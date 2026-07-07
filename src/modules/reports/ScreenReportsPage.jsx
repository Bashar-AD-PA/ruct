import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, Printer, Search, MonitorPlay, DollarSign, ListVideo, Activity } from 'lucide-react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

const ScreenReportsPage = () => {
    const [screens, setScreens] = useState([]);
    const [loadingScreens, setLoadingScreens] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        screen_id: '',
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        end_date: new Date().toISOString().split('T')[0], // Today
    });

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => {
        fetchScreens();
    }, []);

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
            setScreens(res.data || []);
            if (res.data && res.data.length > 0) {
                setFilters(prev => ({ ...prev, screen_id: res.data[0].screen_id }));
            }
        } catch (error) {
            console.error("Error fetching screens", error);
            addToast('فشل في جلب قائمة الشاشات', 'error');
        } finally {
            setLoadingScreens(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const generateReport = async () => {
        if (!filters.screen_id || !filters.start_date || !filters.end_date) {
            addToast('يرجى تعبئة جميع الفلاتر المطلوبة', 'warning');
            return;
        }

        setLoadingReport(true);
        try {
            const res = await axiosClient.get('/reports/screen', { params: filters });
            setReportData(res.data);
            addToast('تم استخراج التقرير بنجاح', 'success');
        } catch (error) {
            console.error("Error generating report", error);
            addToast('حدث خطأ أثناء استخراج التقرير', 'error');
            setReportData(null);
        } finally {
            setLoadingReport(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 font-sans max-w-7xl mx-auto min-h-screen pb-20">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-on-background flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        تقرير أداء الشاشات
                    </h1>
                    <p className="text-on-surface-variant mt-2 text-sm">استخرج تقارير مفصلة حول الإيرادات ومرات العرض لكل شاشة</p>
                </div>
            </div>

            {/* Filters Section - Hidden on Print */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-8 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">اختر الشاشة</label>
                        <select 
                            name="screen_id" 
                            value={filters.screen_id} 
                            onChange={handleFilterChange}
                            className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            disabled={loadingScreens}
                        >
                            <option value="">-- يرجى اختيار شاشة --</option>
                            {screens.map(screen => (
                                <option key={screen.screen_id} value={screen.screen_id}>
                                    {screen.screen_name} {screen.mac_address ? `(${screen.mac_address})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">من تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                            <input 
                                type="date" 
                                name="start_date" 
                                value={filters.start_date} 
                                onChange={handleFilterChange}
                                className="w-full h-11 pr-10 pl-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-on-surface block">إلى تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
                            <input 
                                type="date" 
                                name="end_date" 
                                value={filters.end_date} 
                                onChange={handleFilterChange}
                                className="w-full h-11 pr-10 pl-4 rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 h-11">
                        <button 
                            onClick={generateReport}
                            disabled={loadingReport || !filters.screen_id}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loadingReport ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    استخراج
                                </>
                            )}
                        </button>
                        
                        <button 
                            onClick={handlePrint}
                            disabled={!reportData}
                            className="px-5 bg-surface border border-outline-variant text-on-surface hover:text-primary hover:bg-primary-container hover:border-primary font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            title="طباعة التقرير (PDF)"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
                `}
            </style>

            {/* Report Content - This area gets printed */}
            {reportData && (
                <div className="print-area bg-white rounded-2xl shadow-sm border border-outline-variant p-8 relative overflow-hidden" dir="rtl">
                    
                    {/* Header For Print */}
                    <div className="flex justify-between items-center border-b-2 border-gray-100 pb-6 mb-8">
                        <div className="flex-1 text-right">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">تقرير أداء الشاشة الإعلانية</h2>
                            <p className="text-gray-500 text-sm mb-1">
                                <span className="font-semibold ml-1">اسم الشاشة:</span> 
                                {reportData.screen.screen_name}
                            </p>
                            <p className="text-gray-500 text-sm">
                                <span className="font-semibold ml-1">الموقع:</span> 
                                {reportData.screen.street?.street_name} - {reportData.screen.street?.region?.region_name}
                            </p>
                        </div>

                        {/* Centered Logo */}
                        <div className="flex-1 flex justify-center items-center">
                            <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="h-24 object-contain drop-shadow-md" />
                        </div>

                        <div className="flex-1 text-left">
                            <p className="text-gray-500 text-sm mb-1">
                                <span className="font-semibold ml-1">تاريخ الإصدار:</span> 
                                {new Date().toLocaleDateString('ar-SA')}
                            </p>
                            <p className="text-gray-500 text-sm">
                                <span className="font-semibold ml-1">الفترة:</span> 
                                {filters.start_date} <span className="mx-1">إلى</span> {filters.end_date}
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                                <ListVideo className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">إجمالي الإعلانات</p>
                                <h3 className="text-3xl font-bold text-gray-900">{reportData.summary.total_ads}</h3>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center gap-5">
                            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                <DollarSign className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">إجمالي الإيرادات</p>
                                <h3 className="text-3xl font-bold text-gray-900">${parseFloat(reportData.summary.total_revenue).toFixed(2)}</h3>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center gap-5">
                            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                                <Activity className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">إجمالي مرات العرض (الفعلي)</p>
                                <h3 className="text-3xl font-bold text-gray-900">{reportData.summary.total_plays}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MonitorPlay className="w-5 h-5 text-gray-500" />
                            سجل الحملات الإعلانية
                        </h3>
                        
                        {reportData.ads && reportData.ads.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="w-full text-right text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 font-semibold text-gray-700">اسم الحملة</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700">المعلن</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700">الفئة</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700">تاريخ العرض</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 text-center">التكرار</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 text-center">الإيراد</th>
                                            <th className="py-3 px-4 font-semibold text-gray-700 text-center">مرات البث</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reportData.ads.map((ad, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="py-3 px-4 font-medium text-gray-900">{ad.title}</td>
                                                <td className="py-3 px-4 text-gray-600">{ad.advertiser}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{ad.category}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 text-xs" dir="ltr">
                                                    <div className="text-right">{ad.start_date}</div>
                                                    <div className="text-right text-gray-400">إلى {ad.end_date}</div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-gray-600">كل {ad.frequency} د</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                                                    ${parseFloat(ad.revenue).toFixed(2)}
                                                </td>
                                                <td className="py-3 px-4 text-center text-gray-900 font-medium">
                                                    {ad.plays_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-12 bg-gray-50 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                                <MonitorPlay className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium">لا توجد أي حملات إعلانية مطابقة لهذه الشاشة في الفترة المحددة.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer For Print */}
                    <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                        <p>نظام إدارة اللوحات الإعلانية الرقمية - SabaPost</p>
                        <p>صفحة 1 من 1</p>
                    </div>

                </div>
            )}
            
            {/* Empty State when no report is generated yet */}
            {!reportData && !loadingReport && (
                <div className="bg-surface-container-low border border-outline-variant/50 border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center print:hidden">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center shadow-sm mb-6">
                        <FileText className="w-10 h-10 text-primary/40" />
                    </div>
                    <h3 className="text-xl font-bold text-on-background mb-2">التقارير جاهزة للاستخراج</h3>
                    <p className="text-on-surface-variant max-w-md">قم بتحديد الشاشة والفترة الزمنية من الفلاتر العلوية ثم اضغط على زر "استخراج" لعرض التقرير وطباعته.</p>
                </div>
            )}
        </div>
    );
};

export default ScreenReportsPage;
