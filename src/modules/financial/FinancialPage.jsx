import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import DynamicPageLoader from '../../shared/components/DynamicPageLoader';
import Modal from '../../shared/components/Modal';

const FinancialPage = () => {
    const [data, setData] = useState({ total_payments: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'completed', 'pending', 'rejected'
    const [formData, setFormData] = useState({ amount: '', reference_number: '', payment_method: 'bank_transfer' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAmountVisible, setIsAmountVisible] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            try {
                const res = await axiosClient.get(ENDPOINTS.FINANCIAL.LEDGER);
                setData(res.data?.data || res.data || { total_payments: 0, transactions: [] });
            } catch (error) {
                console.error(error);
                setData({ total_payments: 0, transactions: [] });
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const newTransaction = {
                id: Math.random(),
                created_at: new Date().toISOString(),
                amount: parseFloat(formData.amount),
                reference_number: formData.reference_number,
                payment_method: formData.payment_method,
                status: 'completed', // Make it auto-approved for manually added ones
                user: { full_name: 'إضافة يدوية (أنت)' }
            };
            setData(prev => ({
                ...prev,
                total_payments: prev.total_payments + newTransaction.amount,
                transactions: [newTransaction, ...prev.transactions]
            }));
            setIsAddModalOpen(false);
            setFormData({ amount: '', reference_number: '', payment_method: 'bank_transfer' });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportCSV = () => {
        const transactionsList = data.transactions || [];
        const headers = ['التاريخ', 'المعلن', 'طريقة الدفع', 'المرجع', 'المبلغ ($)', 'الحالة'];
        
        let csvContent = "";
        
        if (transactionsList.length === 0) {
            // Provide feedback via alert if the user wants to ensure it's communicative
            alert("السجل المحاسبي فارغ حالياً! سيتم تصدير قالب فارغ يحتوي على العناوين فقط.");
        }

        const csvRows = transactionsList.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('ar-EG');
            const user = t.user?.full_name || 'غير معروف';
            const method = t.payment_method || 'N/A';
            const ref = t.reference_number || '-';
            const amount = parseFloat(t.amount || 0).toFixed(2);
            const status = t.status === 'completed' ? 'معتمدة' : t.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة';
            return `"${date}","${user}","${method}","${ref}","${amount}","${status}"`;
        });
        
        csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...csvRows].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const transactions = data.transactions || [];
    const filteredTransactions = transactions.filter(t => activeFilter === 'all' || t.status === activeFilter);
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const totalRevenue = data.total_payments || 0;

    const columns = [
        { 
            key: 'created_at', 
            header: 'التاريخ', 
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface" dir="ltr">
                        {new Date(row.created_at).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-caption text-[10px] text-on-surface-variant" dir="ltr">
                        {new Date(row.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        { 
            key: 'user.full_name', 
            header: 'المعلن', 
            cell: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant text-xs shadow-inner shrink-0">
                        {row.user?.full_name?.charAt(0) || '-'}
                    </div>
                    <span className="font-label-md text-label-md text-on-surface">{row.user?.full_name || '—'}</span>
                </div>
            )
        },
        { 
            key: 'payment_method', 
            header: 'طريقة الدفع', 
            cell: (row) => (
                <span className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md font-caption text-xs uppercase flex w-max gap-1 items-center">
                    <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span> {row.payment_method || 'N/A'}
                </span>
            )
        },
        { 
            key: 'reference_number', 
            header: 'المرجع', 
            cell: (row) => (
                <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded border border-outline-variant">
                    #{row.reference_number || '---'}
                </span>
            )
        },
        { 
            key: 'amount', 
            header: 'المبلغ', 
            cell: (row) => (
                <span className="font-body-md text-base font-bold text-primary tracking-tighter">
                    ${parseFloat(row.amount || 0).toFixed(2)}
                </span>
            )
        },
        { 
            key: 'status', 
            header: 'الحالة', 
            cell: (row) => {
                if (row.status === 'completed') return (
                    <span className="bg-secondary-container/20 border border-secondary text-secondary font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span> معتمدة
                    </span>
                );
                if (row.status === 'rejected') return (
                    <span className="bg-error-container border border-error/50 text-error font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">cancel</span> مرفوضة
                    </span>
                );
                return (
                    <span className="bg-surface-container-high border border-outline-variant text-on-surface-variant font-label-md text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> قيد المراجعة
                    </span>
                );
            }
        },
    ];

    if (loading) return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center flex-1 w-full py-20" dir="rtl">
            <DynamicPageLoader 
                messages={[
                    "جاري مزامنة الإيرادات المالية...", 
                    "يتم تدقيق المعاملات من قاعدة البيانات...",
                    "يتم سحب السجلات المحاسبية..."
                ]}
                icon="payments"
            />
        </motion.div>
    );

    return (
        <div className="w-full font-[IBM_Plex_Sans_Arabic] pb-20" dir="rtl">
            {/* Page Header */}
            <div className="mb-lg flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <h1 className="font-headline-lg text-headline-lg md:text-display-lg text-on-surface">دفتر الأستاذ المالي</h1>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant">نظرة تنفيذية آنية للتدفقات النقدية والعمليات المالية مع سجلات المحاسبة الدقيقة.</p>
                </div>
                <div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        إضافة معاملة
                    </button>
                </div>
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-lg">
                {/* Primary Revenue Card */}
                <div className="md:col-span-6 lg:col-span-6 rounded-2xl text-white p-lg shadow-md relative overflow-hidden flex flex-col justify-between min-h-[200px]" style={{ background: 'linear-gradient(135deg, #004ac6 0%, #00174b 100%)' }}>
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <h3 className="font-title-lg text-title-lg text-inverse-primary opacity-90 flex items-center gap-2">
                            <span className="material-symbols-outlined font-normal">account_balance</span>
                            إجمالي الإيرادات المؤكدة
                        </h3>
                        <span className="material-symbols-outlined text-3xl opacity-50 font-normal">trending_up</span>
                    </div>
                    <div className="relative z-10 mt-6">
                        <div className="font-display-lg text-display-lg font-bold tracking-tight mb-4">
                            {isAmountVisible ? `$${parseFloat(totalRevenue).toFixed(2)}` : '****'}
                        </div>
                        <button 
                            onClick={() => setIsAmountVisible(!isAmountVisible)}
                            className="bg-white/10 hover:bg-white/20 text-white w-10 h-10 rounded-lg backdrop-blur-sm transition-all border border-white/20 flex items-center justify-center"
                            title={isAmountVisible ? 'إخفاء الرصيد' : 'إظهار الرصيد'}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {isAmountVisible ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Secondary Metrics Group */}
                <div className="md:col-span-6 lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-md">
                    {/* Total Transactions */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-on-surface-variant font-normal">receipt_long</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">العمليات الكلية</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">{totalTransactions}</p>
                        </div>
                    </div>

                    {/* Successful Transactions */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-secondary font-normal">check_circle</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">عملية ناجحة</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">{successfulTransactions}</p>
                        </div>
                    </div>

                    {/* Under Review */}
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-error font-normal">schedule</span>
                        </div>
                        <div>
                            <p className="font-label-md text-label-md text-on-surface-variant mb-1">قيد المراجعة</p>
                            <p className="font-headline-lg text-headline-lg text-on-surface">{pendingTransactions}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-error opacity-20"></div>
                    </div>
                </div>
            </div>

            {/* Main Financial Log Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                {/* Card Header */}
                <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h2 className="font-title-lg text-title-lg text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary font-normal">monitoring</span>
                        السجل المالي {activeFilter !== 'all' && <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-md mx-2">{activeFilter === 'completed' ? 'الناجحة' : activeFilter === 'pending' ? 'المعلقة' : 'المرفوضة'}</span>}
                    </h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFilterModalOpen(true)}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant flex items-center justify-center" title="فلترة المعاملات">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                        <button 
                            onClick={handleExportCSV}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors border border-outline-variant flex items-center justify-center" title="تصدير بصيغة CSV">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-2xl text-center bg-surface-bright">
                        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-5xl text-outline font-normal">receipt_long</span>
                        </div>
                        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">السجل المحاسبي فارغ حالياً</h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mb-6 w-full text-center" style={{ maxWidth: '400px' }}>
                            لم يتم تسجيل أي تعاملات المحددة في النظام حتى هذه اللحظة. عندما تتم الحركات، ستظهر تفاصيلها هنا في الجداول.
                        </p>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-primary-container text-on-primary-container px-6 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add_box</span>
                            تسجيل معاملة
                        </button>
                    </div>
                ) : (
                    <div className="p-4 [&>div]:!shadow-none [&>div]:!p-0 [&_table]:!border-0">
                        <DataTable 
                            columns={columns} 
                            data={filteredTransactions} 
                            loading={false} 
                        />
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="تصفية السجل المالي">
                <div className="space-y-4" dir="rtl">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">اختر نوع التصنيف الذي ترغب بعرضه في دفتر الأستاذ:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setActiveFilter('all'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'all' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">receipt_long</span>
                            عرض كل المعاملات
                        </button>
                        
                        <button 
                            onClick={() => { setActiveFilter('completed'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'completed' ? 'bg-secondary/5 border-secondary text-secondary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            الإيرادات المعتمدة فقط
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('pending'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'pending' ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">schedule</span>
                            العمليات قيد المراجعة
                        </button>

                        <button 
                            onClick={() => { setActiveFilter('rejected'); setIsFilterModalOpen(false); }}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${activeFilter === 'rejected' ? 'bg-error/5 border-error text-error font-bold' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
                        >
                            <span className="material-symbols-outlined">cancel</span>
                            العمليات المرفوضة
                        </button>
                    </div>

                    <div className="pt-4 mt-2 mb-1 border-t border-outline-variant/60">
                        <button 
                            onClick={() => setIsFilterModalOpen(false)}
                            className="w-full bg-surface border border-outline-variant text-on-surface hover:bg-surface-container font-label-md text-label-md py-3 rounded-xl transition-colors shadow-sm"
                        >
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add Transaction Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="تسجيل بيانات معاملة مالية">
                <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                    <div className="bg-primary-container/20 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                        <div>
                            <h4 className="font-label-md text-label-md text-primary mb-1">تسجيل يدوي للأرصدة</h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">استخدم هذا المربع لإضافة العمليات المالية الخارجية (تحويلات بنكية، كاش) التي تمت خارج بوابة الدفع الآلية ليتم إدراجها بالدفتر.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">إجمالي المبلغ المقبوض ($) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    min="1"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    className="w-full bg-surface border border-outline-variant rounded-xl py-3 pl-4 pr-10 font-body-lg text-body-lg text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="مثال: 500.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">رقم المرجع (رقم الحوالة/الإيصال) <span className="text-error">*</span></label>
                            <input 
                                type="text" 
                                required
                                value={formData.reference_number}
                                onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                                className="w-full bg-surface border border-outline-variant rounded-xl py-3 px-4 font-body-md text-body-md text-on-background placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="مثال: TRX-9821102"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="font-label-md text-label-md text-on-surface">وسيلة الدفع <span className="text-error">*</span></label>
                            <div className="relative">
                                <select 
                                    required
                                    value={formData.payment_method}
                                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                    className="w-full appearance-none bg-surface border border-outline-variant rounded-xl py-3 pr-4 pl-10 font-body-md text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                >
                                    <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                                    <option value="cash">نقداً (Cash)</option>
                                    <option value="credit">رصيد دائن (Credit Note)</option>
                                </select>
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_content</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-outline-variant/60 flex items-center justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-5 py-2.5 rounded-xl font-label-md text-label-md border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                        >
                            تراجع
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`px-6 py-2.5 rounded-xl font-label-md text-label-md text-on-primary transition-all shadow-sm flex items-center gap-2 ${isSubmitting ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-fixed-variant'}`}
                        >
                            {isSubmitting ? 'جاري التسجيل...' : 'اعتماد وحفظ المعاملة'}
                            {!isSubmitting && <span className="material-symbols-outlined text-[18px]">save</span>}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FinancialPage;
