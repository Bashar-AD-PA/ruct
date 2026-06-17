import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
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

    const inputClass = "w-full bg-surface text-on-surface border border-outline-variant rounded-lg py-2 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-right";
    const labelClass = "text-label-md font-label-md text-on-surface mb-1.5 block";

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-2">
                <div className="flex flex-col">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1 flex items-center gap-3">
                        بوابات الدفع الإلكتروني
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                        </div>
                    </h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">إدارة قنوات التحصيل المالي وربط واجهات الدفع العالمية بشكل آمن.</p>
                </div>
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        تكوين بوابة جديدة
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">إجمالي القنوات</p>
                        <p className="font-display-lg text-headline-lg text-on-surface font-extrabold">{totalMethods}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">القنوات النشطة</p>
                        <p className="font-display-lg text-headline-lg text-[#16a34a] font-extrabold">{activeMethods}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#16a34a]/10 flex items-center justify-center text-[#16a34a]">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">موقوفة للصيانة</p>
                        <p className="font-display-lg text-headline-lg text-error font-extrabold">{inactiveMethods}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined text-2xl">cancel</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">بوابات آلية (API)</p>
                        <p className="font-display-lg text-headline-lg text-[#4f46e5] font-extrabold">{stripeIntegrations}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#4f46e5]/10 flex items-center justify-center text-[#4f46e5]">
                        <span className="material-symbols-outlined text-2xl">shield</span>
                    </div>
                </div>
            </div>

            {/* Main Data Table Container */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] mt-8">
                <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-2">
                        إدارة سجل بوابات التحصيل
                    </h3>
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-surface/50 z-10 py-20">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : methods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                            <span className="material-symbols-outlined text-outline text-3xl">info</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-on-surface mb-2">لا توجد بوابات تحصيل مسجلة</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">قم بإنشاء بوابة جديدة من الزر أعلاه.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap">الاسم الوصفي</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap">التفاصيل / التوجيهات</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">الحالة التشغيلية</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-left">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md text-on-surface">
                                {methods.map(method => {
                                    const isActive = method.is_active == 1 || method.is_active === true || method.is_active === 'true';
                                    const id = method.method_id || method.id;
                                    return (
                                        <tr key={id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6 font-medium whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                        <span className="material-symbols-outlined text-xl">credit_card</span>
                                                    </div>
                                                    <span className="font-medium">{method.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-on-surface-variant">
                                                <span className="truncate max-w-[250px] inline-block font-mono" title={method.account_details}>
                                                    {method.account_details}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center whitespace-nowrap">
                                                {isActive ? (
                                                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] font-bold text-xs tracking-wide">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                                        نشط ومفعل
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] font-bold text-xs tracking-wide">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                                                        معطل مؤقتاً
                                                    </span>
                                                )}
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); openModal(method); }} 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" 
                                                            title="تعديل"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id }); }} 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors" 
                                                            title="حذف"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingMethod ? 'تحديث إعدادات البوابة' : 'تكوين بوابة تحصيل جديدة'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4" dir="rtl">
                    <div className="bg-surface border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
                        <div>
                            <label className={labelClass}>تسمية القناة (يظهر للجمهور) <span className="text-error">*</span></label>
                            <input
                                type="text"
                                required
                                maxLength="255"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={inputClass}
                                placeholder="مثال: الحوالات البنكية المباشرة، Stripe"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className={labelClass}>إرشادات الدفع (تظهر في الفاتورة) <span className="text-error">*</span></label>
                            <textarea
                                required
                                value={form.account_details}
                                onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                                className={`${inputClass} resize-none h-24 leading-relaxed`}
                                placeholder="اكتب تعليمات الإيداع أو أرقام الحسابات المرتبطة هنا..."
                            ></textarea>
                        </div>
                        
                        {/* Status Toggle */}
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                            <div>
                                <p className="font-label-md text-label-md text-on-surface">حالة التشغيل</p>
                                <p className="font-caption text-caption text-on-surface-variant mt-0.5">تفعيل ظهور هذه القناة أثناء عملية الشحن</p>
                            </div>
                            <label className="relative flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>

                    <div className="border border-outline-variant bg-surface-container-lowest rounded-2xl p-5 mt-4 group">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary text-xl">key</span>
                            <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">الربط البرمجي السري (اختياري لبوابات Stripe)</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Publishable Key (المفتاح العام)</label>
                                <div className="relative">
                                    <input
                                        type={showPk ? "text" : "password"}
                                        value={form.stripe_publishable_key}
                                        onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
                                        className={`${inputClass} !bg-background pr-10 font-mono tracking-wider`}
                                        dir="ltr"
                                        placeholder="pk_live_..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPk(!showPk)}
                                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 flex text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showPk ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Secret Key (المفتاح السري)</label>
                                <div className="relative">
                                    <input
                                        type={showSk ? "text" : "password"}
                                        value={form.stripe_secret_key}
                                        onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
                                        className={`${inputClass} !bg-background pr-10 font-mono tracking-wider`}
                                        dir="ltr"
                                        placeholder="sk_live_..."
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowSk(!showSk)}
                                        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 flex text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {showSk ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                                <p className="font-caption text-caption text-on-surface-variant mt-2 px-1">تشفير تلقائي متاح. لا تشارك المفتاح السري أبداً.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري المعالجة...' : 'تخزين واعتماد'}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-surface-variant text-on-surface-variant py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest border border-outline-variant transition-colors"
                        >
                            إلغاء
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
