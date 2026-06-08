import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, CheckCircle, XCircle, Trash2, Eye, PauseCircle, PlayCircle, CreditCard, Activity, Clock, Ban, DollarSign, Calendar, Info, Layers, User, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import usePermission from '../../hooks/usePermission';
import useToastStore from '../../store/useToastStore';
import StripePaymentModal from './components/StripePaymentModal';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, textClass }) => (
    <motion.div variants={itemVariants} className={`p-5 md:p-6 rounded-3xl border-2 ${borderClass} ${bgClass} relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300`}>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="space-y-1.5 z-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <h3 className={`text-3xl md:text-4xl font-black ${textClass}`}>{value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110 shadow-lg ${colorClass}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorClass.split(' ')[0]} group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>
    </motion.div>
);

const AdsPage = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [approveModal, setApproveModal] = useState({ open: false, ad: null, action: '' });
    const [detailsModal, setDetailsModal] = useState({ open: false, ad: null });
    const [stripeModal, setStripeModal] = useState({ open: false, ad: null });
    const [rejectReason, setRejectReason] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const { can, isAdvertiser, isAdmin } = usePermission();
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    useEffect(() => { fetchAds(); }, []);

    const fetchAds = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.ADS.ALL);
            setAds(res.data.data || []);
        } catch (e) { 
            console.error(e); 
            addToast('واجه النظام مشكلة في جلب الإعلانات', 'error');
        } finally { 
            setLoading(false); 
        }
    };

    const filteredAds = ads.filter(a => {
        const matchStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchCategory = categoryFilter === 'all' || a.category_id === Number(categoryFilter);
        return matchStatus && matchCategory;
    });

    const handleStatusChange = async () => {
        const { ad, action } = approveModal;
        try {
            await axiosClient.put(ENDPOINTS.ADS.STATUS(ad.ad_id), {
                status: action,
                reason: action === 'Rejected' ? rejectReason : null,
            });
            addToast(`تم ${action === 'Active' ? 'قبول وبدء عرض' : action === 'Rejected' ? 'رفض' : 'إيقاف'} الحملة الإعلانية بنجاح`, 'success');
            setApproveModal({ open: false, ad: null, action: '' });
            setRejectReason('');
            fetchAds();
        } catch (e) {
            addToast('فشلت العملية المحددة. يرجى المحاولة مرة أخرى', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.ADS.DELETE(deleteTarget));
            addToast('تم حذف الحملة الإعلانية من السجلات نهائياً', 'success');
            setDeleteTarget(null);
            fetchAds();
        } catch (e) { 
            addToast('لا يمكن حذف الحملة الإعلانية حالياً لارتباطها بجدولة سابقة', 'error'); 
        }
    };

    const columns = [
        { 
            key: 'title', 
            header: 'العنوان', 
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5 text-[var(--color-dark-turquoise)]" />
                    </div>
                    <span className="font-black text-gray-900 text-sm whitespace-nowrap">{row.title}</span>
                </div>
            )
        },
        { 
            key: 'advertiser.full_name', 
            header: 'المعلن', 
            render: (row) => (
                <div className="flex items-center gap-1.5 text-gray-600">
                    <User className="w-3.5 h-3.5 opacity-50" />
                    <span className="text-xs font-bold whitespace-nowrap">{row.advertiser?.full_name || 'غير محدد'}</span>
                </div>
            )
        },
        { 
            key: 'category', 
            header: 'التصنيف', 
            render: (row) => (
                <span className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full whitespace-nowrap flex items-center gap-1.5 w-max">
                    <Layers className="w-3 h-3 text-gray-400" />
                    {row.category?.category_name || 'عام'}
                </span>
            )
        },
        { 
            key: 'status', 
            header: 'الحالة', 
            render: (row) => <StatusBadge status={row.status} /> 
        },
        { 
            key: 'total_cost', 
            header: 'التكلفة', 
            render: (row) => (
                <span className="font-black text-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/5 px-3 py-1 rounded-lg">
                    ${row.total_cost || 0}
                </span>
            ) 
        },
        { 
            key: 'daily_frequency', 
            header: 'التكرار (د)', 
            render: (row) => <span className="font-mono text-xs text-gray-500 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">كل {row.daily_frequency || '—'} د</span> 
        },
        { 
            key: 'duration', 
            header: 'المدة (ث)', 
            render: (row) => <span className="text-xs font-bold text-gray-700">{row.duration ? `${row.duration}s` : '—'}</span> 
        },
        { 
            key: 'file_size', 
            header: 'الحجم', 
            render: (row) => (
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 whitespace-nowrap">
                    <Server className="w-3 h-3" />
                    {row.file_size ? `${row.file_size} MB` : '—'}
                </span>
            )
        },
        { 
            key: 'start_date', 
            header: 'من', 
            render: (row) => (
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap block" dir="ltr">{row.start_date || '—'}</span>
            ) 
        },
        { 
            key: 'end_date', 
            header: 'إلى', 
            render: (row) => (
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap block" dir="ltr">{row.end_date || '—'}</span>
            ) 
        },
        {
            key: 'actions', 
            header: 'إجراءات', 
            render: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, ad: row }) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-gray-900 group" title="استعراض التفاصيل">
                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    {can('approve_ads') && row.status === 'Pending' && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' }) }}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 hover:border-emerald-600 shadow-sm group" title="الموافقة">
                                <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Rejected' }) }}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 hover:border-rose-600 shadow-sm group" title="رفض وطلب تعليل">
                                <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                        </>
                    )}
                    {(can('approve_ads') || can('manage_all')) && row.status === 'Active' && (
                        <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Paused' }) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 hover:border-amber-500 shadow-sm group" title="إيقاف مؤقت للحملة">
                            <PauseCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                    {(can('approve_ads') || can('manage_all')) && row.status === 'Paused' && (
                        <button onClick={(e) => { e.stopPropagation(); setApproveModal({ open: true, ad: row, action: 'Active' }) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 hover:border-blue-600 shadow-sm group" title="استئناف البث">
                            <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                    {(isAdvertiser || isAdmin) && row.status === 'waiting_payment' && (
                        <button onClick={(e) => { e.stopPropagation(); setStripeModal({ open: true, ad: row }) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all border border-purple-100 hover:border-purple-600 shadow-sm group" title="سداد مبكر (Stripe)">
                            <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.ad_id) }} className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 hover:border-rose-600 group" title="حذف الحملة">
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )
        },
    ];

    const mappedColumns = columns.map(col => ({
        header: col.header,
        accessorKey: col.accessorKey || col.key,
        cell: col.render
    }));

    const statusTabs = [
        { key: 'all', label: 'كافة الحملات' },
        { key: 'Active', label: 'تبث حالياً (نشط)' },
        { key: 'Pending', label: 'تنتظر الموافقة' },
        { key: 'waiting_payment', label: 'معلقة مالياً' },
        { key: 'Paused', label: 'تمت المقاطعة' },
        { key: 'Rejected', label: 'مرفوضة رقابياً' },
    ];

    const uniqueCategories = [...new Set(ads.map(a => a.category).filter(Boolean).map(c => JSON.stringify(c)))].map(s => JSON.parse(s));

    const stats = {
        total: ads.length,
        active: ads.filter(a => a.status === 'Active').length,
        pending: ads.filter(a => a.status === 'Pending').length,
        rejected: ads.filter(a => a.status === 'Rejected').length,
        paused: ads.filter(a => a.status === 'Paused').length,
    };

    return (
        <div className="space-y-6 pb-12 w-full max-w-[1600px] mx-auto font-sans" dir="rtl">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                            <Megaphone className="w-6 h-6 text-[var(--color-dark-turquoise)]" />
                        </div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">المركز الإعلاني المباشر</span>
                    </span>
                }
                description="مراقبة ومراجعة وتوجيه جميع الحملات الإعلانية النشطة والمتوقفة ضمن الشبكة."
                action={
                    can('create_campaigns') && (
                        <button onClick={() => navigate('/dashboard/ads/create')}
                            className="bg-[var(--color-dark-turquoise)] hover:bg-[#0d4f5b] text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2.5 text-sm transition-all shadow-[0_8px_16px_-4px_rgba(20,93,106,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(20,93,106,0.3)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none"></div>
                            <Plus className="w-5 h-5 text-[var(--color-gold)]" /> إطلاق حملة جديدة
                        </button>
                    )
                }
            />

            {!loading && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
                    <StatCard title="إجمالي المعاملات" value={stats.total} icon={Layers} colorClass="bg-blue-50 text-blue-600 shadow-blue-500/20" borderClass="border-blue-100 border-transparent hover:border-blue-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="يتم بثها حالياً" value={stats.active} icon={Activity} colorClass="bg-emerald-50 text-emerald-600 shadow-emerald-500/20" borderClass="border-emerald-100 border-transparent hover:border-emerald-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="تنتظر الاعتماد" value={stats.pending} icon={Clock} colorClass="bg-amber-50 text-amber-600 shadow-amber-500/20" borderClass="border-amber-100 border-transparent hover:border-amber-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="إعلانات مرفوضة" value={stats.rejected} icon={Ban} colorClass="bg-rose-50 text-rose-600 shadow-rose-500/20" borderClass="border-rose-100 border-transparent hover:border-rose-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="حملات متوقفة" value={stats.paused} icon={PauseCircle} colorClass="bg-gray-100 text-gray-600 shadow-gray-500/20" borderClass="border-gray-200 border-transparent hover:border-gray-500" bgClass="bg-white" textClass="text-gray-900" />
                </motion.div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar items-center flex-1">
                        {statusTabs.map(tab => (
                            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${statusFilter === tab.key ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-white'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100">التصنيف</span>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[var(--color-dark-turquoise)] focus:ring-4 focus:ring-[var(--color-dark-turquoise)]/10 transition-all cursor-pointer">
                            <option value="all">كافة التصنيفات والمجالات</option>
                            {uniqueCategories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/20 shadow-inner min-h-[400px]">
                    <DataTable 
                        columns={mappedColumns} 
                        data={filteredAds} 
                        loading={loading} 
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm relative">
                                    <div className="absolute inset-0 bg-gray-200 rounded-full animate-ping opacity-20"></div>
                                    <Megaphone className="w-10 h-10 text-gray-300" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">لا توجد حملات مسجلة هنا</h4>
                                <p className="text-sm font-medium text-gray-500 max-w-[320px] mx-auto">
                                    حاول تغيير الفلاتر الحالية للبحث، أو ابدأ بإطلاق حملتك الإعلانية الأولى فوراً عبر لوحة التحكم.
                                </p>
                            </div>
                        } 
                    />
                </div>
            </div>

            {/* Approve/Reject Modal */}
            <Modal isOpen={approveModal.open} onClose={() => { setApproveModal({ open: false, ad: null, action: '' }); setRejectReason(''); }}
                title={approveModal.action === 'Active' ? 'الموافقة على الحملة' : approveModal.action === 'Paused' ? 'إيقاف البث مؤقتاً' : 'قرارات الرقابة (رفض الإعلان)'}>
                <div className="space-y-6" dir="rtl">
                    <div className={`p-4 rounded-xl border ${approveModal.action === 'Active' ? 'bg-emerald-50 border-emerald-100' : approveModal.action === 'Paused' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex gap-3">
                            {approveModal.action === 'Active' ? <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" /> : approveModal.action === 'Paused' ? <PauseCircle className="w-6 h-6 text-amber-600 shrink-0" /> : <Ban className="w-6 h-6 text-rose-600 shrink-0" />}
                            <p className={`text-sm font-bold ${approveModal.action === 'Active' ? 'text-emerald-800' : approveModal.action === 'Paused' ? 'text-amber-800' : 'text-rose-800'} leading-relaxed`}>
                                {approveModal.action === 'Active'
                                    ? `أنت على وشك اعتماد الحملة "${approveModal.ad?.title}" وبدء البث الفوري لها على الشاشات بناءً على الجدول الزمني المسجل.`
                                    : approveModal.action === 'Paused'
                                    ? `هل أنت متأكد من إيقاف البث مؤقتاً للحملة "${approveModal.ad?.title}"؟ لن يتم عرضها على الشاشات حتى استئنافها.`
                                    : `سيتم رفض حملة "${approveModal.ad?.title}" وإعادتها للمعلن بانتظار تعديلها. يرجى توضيح التجاوزات ليتمكن المعلن من إصلاحها.`}
                            </p>
                        </div>
                    </div>

                    {approveModal.action === 'Rejected' && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block px-1">سبب تعليق وإيقاف الحملة رقابياً <span className="text-red-500">*</span></label>
                            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="مثال: التصميم يحتوي مساحات فارغة كبيرة، أو يخالف الشروط والأحكام الخاصة بالمحتوى الصوتي..."
                                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all min-h-[120px] resize-none" required />
                        </div>
                    )}
                    
                    <button onClick={handleStatusChange}
                        className={`w-full font-black py-4 rounded-xl transition-all text-white shadow-lg ${approveModal.action === 'Active' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : approveModal.action === 'Paused' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'}`}>
                        {approveModal.action === 'Active' ? 'اعتماد العرض الآن' : approveModal.action === 'Paused' ? 'تأكيد الإيقاف' : 'إصدار قرار الرفض'}
                    </button>
                </div>
            </Modal>

            {/* View Details Modal */}
            <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, ad: null })} title="البطاقة التعريفية للحملة">
                {detailsModal.ad && (
                    <div className="space-y-6" dir="rtl">
                        <div className="flex items-start justify-between bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                            <div className="space-y-1.5 flex-1 pr-2">
                                <h2 className="text-lg font-black text-gray-900">{detailsModal.ad.title}</h2>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <User className="w-4 h-4" />
                                    <span className="font-bold">{detailsModal.ad.advertiser?.full_name || 'غير معروف'}</span>
                                </div>
                            </div>
                            <StatusBadge status={detailsModal.ad.status} />
                        </div>

                        {detailsModal.ad.rejection_reason && detailsModal.ad.status === 'Rejected' && (
                            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-800 flex gap-3 shadow-inner">
                                <Ban className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-xs font-black mb-1.5 uppercase tracking-wider text-rose-600">رسالة الرقابة</span>
                                    <p className="text-sm font-bold leading-relaxed">{detailsModal.ad.rejection_reason}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50/70 p-5 rounded-2xl border border-gray-200">
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">التصنيف الإعلاني</span>
                                <span className="font-bold text-gray-800 bg-white px-2.5 py-1 rounded border border-gray-200 shadow-sm inline-block">{detailsModal.ad.category?.category_name || '—'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">الميزانية المرصودة</span>
                                <span className="font-black text-[var(--color-dark-turquoise)] flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {detailsModal.ad.total_cost || 0}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">معدل البث</span>
                                <span className="font-bold text-gray-800 flex items-center gap-1">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                    كل {detailsModal.ad.daily_frequency || '—'} دقيقة
                                </span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">طول الشريط / المقطع</span>
                                <span className="font-bold text-gray-800 flex items-center gap-1" dir="ltr">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {detailsModal.ad.duration ? `${detailsModal.ad.duration}s` : '—'}
                                </span>
                            </div>
                            <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-2">
                                <div className="space-y-1.5">
                                    <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> الإنطلاق
                                    </span>
                                    <span className="font-bold text-gray-800 block text-xs" dir="ltr">{detailsModal.ad.start_date || '—'}</span>
                                </div>
                                <div className="space-y-1.5 border-r border-gray-200 pr-4">
                                    <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> التوقف
                                    </span>
                                    <span className="font-bold text-gray-800 block text-xs" dir="ltr">{detailsModal.ad.end_date || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-3 px-1">أسطول الشاشات المستهدف ({detailsModal.ad.screens?.length || 0})</span>
                            {detailsModal.ad.screens && detailsModal.ad.screens.length > 0 ? (
                                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-inner max-h-[160px] overflow-y-auto custom-scrollbar">
                                    {detailsModal.ad.screens.map(s => (
                                        <span key={s.screen_id} className="bg-white text-gray-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 shadow-sm flex items-center gap-2 hover:border-gray-400 cursor-default transition-colors">
                                            <MonitorSmartphone className="w-3 h-3 text-gray-400" />
                                            {s.screen_name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center shadow-inner">
                                    <Info className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                                    <span className="text-sm font-bold text-gray-400">لم يتم تحديد شاشات مستهدفة لهذه الحملة</span>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setDetailsModal({ open: false, ad: null })} className="w-full mt-2 bg-gray-100 text-gray-700 font-black py-4 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm focus:outline-none">
                            إغلاق نافذة التفاصيل
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="إتلاف وحذف الحملة الإعلانية" message="هل أنت متأكد من رغبتك في حذف هذا الإعلان من سجلات النظام نهائياً؟ في حال حذفه لن تتمكن من استرجاع البيانات المالية والتقارير المرتبطة به. الإجراء دائم المفعول." confirmText="نعم، موافق على الإتلاف" />

            <StripePaymentModal
                isOpen={stripeModal.open}
                onClose={() => setStripeModal({ open: false, ad: null })}
                advertisement={stripeModal.ad}
                onSuccess={() => fetchAds()}
            />
        </div>
    );
};

export default AdsPage;
