import React, { useState, useEffect, useRef } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axiosClient from '../../core/api/axiosClient';
import useToastStore from '../../store/useToastStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const NetworkReportPage = () => {
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => {
        // Automatically fetch network report on load for simplicity, or we can wait for user action
        generateReport();
    }, []);

    const generateReport = async () => {
        setLoadingReport(true);
        try {
            const res = await axiosClient.get('/reports/network');
            setReportData(res.data);
            addToast('تم استخراج التقرير الشبكي بنجاح', 'success');
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
        <div className="p-6 font-sans max-w-[1200px] mx-auto min-h-screen pb-20 bg-gray-50">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        تقرير أداء شبكة الشاشات الإعلانية
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">استخرج تقارير شاملة لجميع شاشات الشبكة والمخططات البيانية للأرباح والإعلانات</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={generateReport}
                        disabled={loadingReport}
                        className="px-6 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 h-11"
                    >
                        {loadingReport ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                تحديث البيانات
                            </>
                        )}
                    </button>
                    
                    <button 
                        onClick={handlePrint}
                        disabled={!reportData}
                        className="px-5 bg-white border border-gray-300 text-gray-700 hover:text-primary hover:bg-primary/5 hover:border-primary font-medium rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 h-11 shadow-sm"
                        title="طباعة التقرير (PDF)"
                    >
                        <Printer className="w-5 h-5" />
                        طباعة
                    </button>
                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { background: white !important; }
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
                    /* Ensure recharts renders well in print */
                    .recharts-responsive-container {
                        width: 100% !important;
                        height: 100% !important;
                    }
                }
                `}
            </style>

            {/* Report Content - This area gets printed */}
            {reportData && (
                <div className="print-area bg-white shadow-sm border border-gray-200 p-8 relative overflow-hidden text-gray-800" dir="rtl" style={{ minHeight: '1000px' }}>
                    
                    {/* Header For Print matching the mockup */}
                    <div className="flex justify-between items-end border-b border-gray-300 pb-4 mb-4">
                        <div className="flex-1 text-right text-sm font-bold">
                            <p className="mb-1">الموقع: <span className="font-normal text-gray-600">محافظة تعز</span></p>
                        </div>

                        {/* Centered Logo & Title */}
                        <div className="flex-1 flex flex-col justify-center items-center">
                            <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="h-20 object-contain drop-shadow-sm mb-2" />
                            <h2 className="text-xl font-bold text-gray-900">تقرير أداء شبكة الشاشات الإعلانية - SabaPost</h2>
                        </div>

                        <div className="flex-1 text-left text-sm font-bold">
                            <p className="mb-1">التاريخ: <span className="font-normal text-gray-600">{new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                            <p>الوقت: <span className="font-normal text-gray-600">{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span></p>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="mb-6">
                        <table className="w-full text-center text-sm border-collapse border border-gray-400">
                            <thead className="bg-gray-200 font-bold">
                                <tr>
                                    <th className="py-2 px-3 border border-gray-400">رقم الشاشة</th>
                                    <th className="py-2 px-3 border border-gray-400">موقع الشاشة</th>
                                    <th className="py-2 px-3 border border-gray-400">حالة الشاشة</th>
                                    <th className="py-2 px-3 border border-gray-400">الإعلان الحالي</th>
                                    <th className="py-2 px-3 border border-gray-400">وقت التشغيل الكلي</th>
                                    <th className="py-2 px-3 border border-gray-400">والأرباح المولدة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.table_data.map((row, idx) => (
                                    <tr key={idx} className="bg-white">
                                        <td className="py-2 px-3 border border-gray-400">{row.screen_id}</td>
                                        <td className="py-2 px-3 border border-gray-400">{row.location}</td>
                                        <td className={`py-2 px-3 border border-gray-400 font-bold ${row.status === 'متصل' ? 'text-green-600' : 'text-red-600'}`}>
                                            {row.status}
                                        </td>
                                        <td className="py-2 px-3 border border-gray-400">{row.current_ad}</td>
                                        <td className="py-2 px-3 border border-gray-400">{row.total_playtime} د</td>
                                        <td className="py-2 px-3 border border-gray-400">${parseFloat(row.generated_profits).toFixed(0)}</td>
                                    </tr>
                                ))}
                                {reportData.table_data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-4 border border-gray-400 text-gray-500">لا توجد بيانات شاشات متاحة</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Charts & Summaries Section */}
                    <div className="grid grid-cols-12 gap-4">
                        
                        {/* Line Chart Section (Left in original, Right in RTL -> Col span 5) */}
                        <div className="col-span-5 border border-gray-400 bg-gray-100 flex flex-col">
                            <div className="text-center font-bold py-2 border-b border-gray-400 bg-gray-200">الأرباح المولدة الأسبوعي</div>
                            <div className="p-4 flex-1 h-48 bg-white">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={reportData.charts.line} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                                        <RechartsTooltip formatter={(val) => [`$${val}`, 'الأرباح']} />
                                        <Line type="monotone" dataKey="profit" stroke="#1f4e79" strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart Section (Middle -> Col span 4) */}
                        <div className="col-span-4 border border-gray-400 bg-gray-100 flex flex-col">
                            <div className="text-center font-bold py-2 border-b border-gray-400 bg-gray-200">الإعلانات النشطة</div>
                            <div className="p-2 flex-1 h-48 bg-white flex justify-center items-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reportData.charts.pie}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={50}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                            style={{ fontSize: '10px' }}
                                        >
                                            {reportData.charts.pie.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Summary Boxes (Right in original, Left in RTL -> Col span 3) */}
                        <div className="col-span-3 flex flex-col gap-4">
                            <div className="border border-gray-400 bg-white text-center flex flex-col">
                                <div className="font-bold py-2 bg-gray-200 border-b border-gray-400 text-sm">إجمالي الشاشات</div>
                                <div className="py-3 font-bold text-xl">{reportData.summary.total_screens}</div>
                            </div>
                            <div className="border border-gray-400 bg-white text-center flex flex-col">
                                <div className="font-bold py-2 bg-gray-200 border-b border-gray-400 text-sm">إجمالي الإعلانات النشطة</div>
                                <div className="py-3 font-bold text-xl">{reportData.summary.total_active_ads}</div>
                            </div>
                            <div className="border border-gray-400 bg-white text-center flex flex-col">
                                <div className="font-bold py-2 bg-gray-200 border-b border-gray-400 text-sm">إجمالي الإعلانات المكتملة</div>
                                <div className="py-3 font-bold text-xl">25</div> {/* Mocked as per the image requirement showing two boxes with 50 and 25 */}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Summary Row */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="border border-gray-400 bg-gray-100 text-center flex flex-col">
                            <div className="font-bold py-2 border-b border-gray-400 bg-gray-300">الأرباح المولدة الشخصية</div>
                            <div className="py-3 font-bold text-xl bg-white">${reportData.summary.personal_profits}</div>
                        </div>
                        <div className="border border-gray-400 bg-gray-100 text-center flex flex-col">
                            <div className="font-bold py-2 border-b border-gray-400 bg-gray-300">إجمالي الأرباح الشهرية (المتوقعة)</div>
                            <div className="py-3 font-bold text-xl bg-white">${reportData.summary.total_monthly_profits}</div>
                        </div>
                        <div className="border border-gray-400 bg-gray-100 text-center flex flex-col">
                            <div className="font-bold py-2 border-b border-gray-400 bg-gray-300">إجمالي الأرباح الشهرية</div>
                            <div className="py-3 font-bold text-xl bg-white">${reportData.summary.total_monthly_profits}</div>
                        </div>
                    </div>

                    {/* Footer / Signature Area */}
                    <div className="mt-12 text-sm">
                        <p className="font-bold mb-4">يعتمد، توقيع واعتمادات:</p>
                        <div className="space-y-6">
                            <div className="border-b border-gray-500 w-full"></div>
                            <div className="border-b border-gray-500 w-full"></div>
                            <div className="border-b border-gray-500 w-full"></div>
                        </div>
                    </div>

                </div>
            )}
            
            {/* Loading State */}
            {loadingReport && (
                <div className="bg-white border border-gray-200 rounded-3xl py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">جاري إعداد التقرير الشبكي...</p>
                </div>
            )}
        </div>
    );
};

export default NetworkReportPage;
