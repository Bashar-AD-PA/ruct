import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Trash2, Wallet, CheckCircle2, XCircle, Shield, Eye, EyeOff, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import usePermission from '../../hooks/usePermission';

const PaymentMethodsPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [methods, setMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const { can } = usePermission();

    const [form, setForm] = useState({
        name: '',
        account_details: '',
        stripe_publishable_key: '',
        stripe_secret_key: '',
        is_active: true
    });

    // Password visibility toggles
    const [showPk, setShowPk] = useState(false);
    const [showSk, setShowSk] = useState(false);

    const fetchMethods = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.PAYMENT.METHODS);
            if (res.data.success) {
                setMethods(res.data.data || []);
            } else {
                setMethods(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            addToast('فشل في جلب وسائل الدفع', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

    const openModal = (method = null) => {
        setShowPk(false);
        setShowSk(false);
        if (method) {
            setEditingMethod(method);
            setForm({
                name: method.name || '',
                account_details: method.account_details || '',
                stripe_publishable_key: method.stripe_publishable_key || '',
                stripe_secret_key: method.stripe_secret_key || '',
                is_active: method.is_active == 1 || method.is_active === true || method.is_active === 'true'
            });
        } else {
            setEditingMethod(null);
            setForm({ name: '', account_details: '', stripe_publishable_key: '', stripe_secret_key: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.account_details) {
            addToast('يرجى تعبئة الحقول الأساسية', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...form,
                is_active: form.is_active ? 'true' : 'false'
            };

            if (editingMethod) {
                const id = editingMethod.method_id || editingMethod.id;
                await axiosClient.put(ENDPOINTS.PAYMENT.METHOD(id), payload);
                addToast('تم تعديل وسيلة الدفع بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.PAYMENT.METHODS, payload);
                addToast('تم إضافة وسيلة الدفع بنجاح', 'success');
            }
            closeModal();
            fetchMethods();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || 'حدث خطأ أثناء حفظ وسيلة الدفع', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const { id } = deleteDialog;
        try {
            await axiosClient.delete(ENDPOINTS.PAYMENT.METHOD(id));
            addToast('تم حذف وسيلة الدفع بنجاح', 'success');
            fetchMethods();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل حذف وسيلة الدفع', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    // Calculate Summary Metrics
    const totalMethods = methods.length;
    const activeMethods = methods.filter(m => m.is_active == 1 || m.is_active === true || m.is_active === 'true').length;
    const inactiveMethods = totalMethods - activeMethods;
    const stripeIntegrations = methods.filter(m => m.stripe_publishable_key || m.stripe_secret_key).length;

    const columns = [
        { 
            accessorKey: 'name', 
            header: 'الاسم الوصفي', 
            cell: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-dark-turquoise)]/10 flex items-center justify-center font-black text-[var(--color-dark-turquoise)] text-xs border border-[var(--color-dark-turquoise)]/20 shadow-inner">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-800">{row.name}</span>
                </div>
            ) 
        },
        { 
            accessorKey: 'account_details', 
            header: 'التفاصيل / التوجيهات', 
            cell: (row) => (
                <span className="text-slate-500 font-bold text-xs bg-slate-50 border border-slate-100 rounded-md px-3 py-1.5 inline-block max-w-xs truncate" title={row.account_details}>
                    {row.account_details}
                </span>
            ) 
        },
        {
            accessorKey: 'is_active',
            header: 'الحالة التشغيلية',
            cell: (row) => {
                const isActive = row.is_active == 1 || row.is_active === true || row.is_active === 'true';
                return (
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center justify-center w-max gap-1.5 shadow-sm border ${
                        isActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {isActive ? 'نشط ومفعل' : 'معطل مؤقتاً'}
                    </span>
                );
            }
        }
    ];

    if (can('manage_all')) {
        columns.push({
            accessorKey: 'actions',
            header: 'إجراءات',
            cell: (row) => {
                const id = row.method_id || row.id;
                return (
                    <div className="flex justify-start items-center gap-2">
                        <button onClick={() => openModal(row)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200 shadow-sm" title="تعديل">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, id })} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm" title="حذف">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        });
    }

    const inputClass = "w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-[var(--color-dark-turquoise)] transition-colors !text-right";
    const labelClass = "text-[12px] font-black text-slate-500 uppercase tracking-wider mb-2 block px-1";

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-20 pt-6 pb-4 border-b border-slate-200/50 mb-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title={
                        <span className="flex items-center gap-3">
                            <span className="bg-gradient-to-br from-indigo-600 to-indigo-900 text-white p-2.5 rounded-xl shadow-lg ring-4 ring-indigo-500/10">
                                <Wallet className="w-6 h-6 shrink-0" />
                            </span>
                            <span className="text-3xl font-black tracking-tight text-slate-900">بوابات الدفع الإلكتروني</span>
                        </span>
                    }
                    description="إدارة قنوات التحصيل المالي وربط واجهات الدفع العالمية بشكل آمن."
                />
                
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> تكوين بوابة جديدة
                    </button>
                )}
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 relative z-10 text-slate-600">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">إجمالي القنوات</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-slate-800">{totalMethods}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 relative z-10 text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-emerald-600 mb-1 tracking-wider">القنوات النشطة</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-emerald-600">{activeMethods}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4 relative z-10 text-red-600">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-red-600 mb-1 tracking-wider">موقفة للصيانة</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-red-600">{inactiveMethods}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 relative z-10 text-indigo-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-indigo-600 mb-1 tracking-wider">بوابات آلية (Stripe/API)</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-indigo-600">{stripeIntegrations}</h3>}
                    </div>
                </motion.div>
            </div>

            {/* PAYMENT METHODS TABLE */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">إدارة سجل بوابات التحصيل</h3>
                </div>
                <div className="p-1">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(idx => (
                                <div key={idx} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-xl animate-pulse border border-slate-100">
                                    <div className="w-1/4 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-2/4 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/4 h-8 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : methods.length === 0 ? (
                        <div className="text-center py-20 bg-white">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-100 border-dashed">
                                <CreditCard className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">لا توجد بوابات تحصيل مسجلة</h3>
                            <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto">قم بتكوين حسابات الإيداع البنكي أو التكامل مع بوابات الدفع الإلكترونية.</p>
                        </div>
                    ) : (
                        <div className="[&>div]:!shadow-none [&>div]:!p-0 [&_table]:!border-0">
                            <DataTable
                                columns={columns}
                                data={methods.map(m => ({ ...m, id: m.method_id }))}
                                loading={false}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* CREATE / EDIT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingMethod ? 'تحديث إعدادات البوابة' : 'تكوين بوابة تحصيل جديدة'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pt-4" dir="rtl">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 space-y-4 shadow-inner">
                        <div>
                            <label className={labelClass}>تسمية القناة (يظهر للجمهور) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                maxLength="255"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={inputClass}
                                placeholder="مثال: الحوالات البنكية المباشرة، Stripe"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>إرشادات الدفع (تظهر في الفاتورة) <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                value={form.account_details}
                                onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                                className={`${inputClass} resize-none h-24 leading-relaxed`}
                                placeholder="اكتب تعليمات الإيداع أو أرقام الحسابات المرتبطة هنا..."
                            ></textarea>
                        </div>
                        
                        {/* Custom Animated Toggle for Status */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-4">
                            <div>
                                <p className="font-black text-slate-800 text-sm">حالة التشغيل</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">تفعيل ظهور هذه القناة أثناء عملية شحن الأرصدة</p>
                            </div>
                            <label className="relative flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-dark-turquoise)]"></div>
                            </label>
                        </div>
                    </div>

                    <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="w-4 h-4 text-indigo-500" />
                            <h4 className="text-sm font-black text-indigo-900">الربط البرمجي السري (اختياري לבوابات الدفع الآلية)</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2 block px-1">Publishable Key (المفتاح العام)</label>
                                <div className="relative">
                                    <input
                                        type={showPk ? "text" : "password"}
                                        value={form.stripe_publishable_key}
                                        onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
                                        className={`${inputClass} !bg-white pr-10 font-mono tracking-widest text-[11px]`}
                                        dir="ltr"
                                        placeholder="pk_live_..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPk(!showPk)}
                                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-2 block px-1">Secret Key (المفتاح السري)</label>
                                <div className="relative">
                                    <input
                                        type={showSk ? "text" : "password"}
                                        value={form.stripe_secret_key}
                                        onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
                                        className={`${inputClass} !bg-white pr-10 font-mono tracking-widest text-[11px]`}
                                        dir="ltr"
                                        placeholder="sk_live_..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowSk(!showSk)}
                                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showSk ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 px-1">تشفير تلقائي متاح. لا تشارك المفتاح السري أبداً.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors"
                        >
                            تراجع
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[var(--color-dark-turquoise)] hover:bg-[#0c4c58] text-white font-black px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? 'جاري الاتصال...' : 'حفظ البوابة'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* SECURE DELETE CONFIRM DIALOG */}
            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete} 
                title="تأكيد الحذف الأمني" 
                message="سيؤدي هذا الإجراء إلى حذف بوابة الدفع نهائياً وإلغاء مفاتيح الربط الخاصة بها. لن يتم التأثير على الفواتير السابقة المدفوعة من خلالها. هل ترغب بالاستمرار؟" 
                confirmText="إلغاء تنشيط وحذف" 
            />
        </div>
    );
};

export default PaymentMethodsPage;
