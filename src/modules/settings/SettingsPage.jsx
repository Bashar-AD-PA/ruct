import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = () => {
    const { user } = useAuthStore();
    const addToast = useToastStore(state => state.addToast);

    const [emailNotif, setEmailNotif] = useState(true);
    const [systemNotif, setSystemNotif] = useState(true);

    // Profile States
    const [formData, setFormData] = useState({
        full_name: user?.full_name || 'مدير النظام المتقدم',
        email: user?.email || 'admin@digitalsignage.com',
        phone: user?.phone || '+967 777 123 456',
    });

    const [originalData] = useState({ ...formData });

    // UI States for verification
    const [emailPending, setEmailPending] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);

    const isEmailChanged = formData.email !== originalData.email;
    const isPhoneChanged = formData.phone !== originalData.phone;
    const isNameChanged = formData.full_name !== originalData.full_name;
    const isDirty = isEmailChanged || isPhoneChanged || isNameChanged;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'email') setEmailPending(false);
        if (e.target.name === 'phone') setPhoneVerified(false);
    };

    const handleRequestEmailVerification = () => {
        addToast('تم إرسال رابط التفعيل للبريد الجديد. يرجى التحقق من صندوق الوارد.', 'primary');
        setEmailPending(true);
    };

    const handleRequestPhoneVerification = () => {
        // Mocking the OTP process
        addToast('تم إرسال رمز OTP المكون من 6 أرقام إلى هاتفك.', 'primary');
        setTimeout(() => {
            setPhoneVerified(true);
            addToast('تم تأكيد الرقم بنجاح (محاكاة)', 'success');
        }, 1500);
    };

    const handleSaveProfile = () => {
        if (!isDirty) return;
        
        // Security logic check before saving
        if (isEmailChanged && !emailPending) {
            addToast('عذراً، يجب إرسال رابط تأكيد للبريد الإلكتروني الجديد أولاً.', 'error');
            return;
        }
        if (isPhoneChanged && !phoneVerified) {
            addToast('عذراً، يجب تأكيد رقم الهاتف الجديد عبر رسالة (OTP) أولاً.', 'error');
            return;
        }

        addToast('تم حفظ الملف الشخصي وتحديث بياناتك بنجاح!', 'success');
        // Usually, here you update the global state or local original states
    };

    const notifRows = [
        {
            id: 'email_notif',
            icon: 'mail',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'إشعارات البريد الإلكتروني',
            description: 'تلقي تقارير أمنية وإحصائيات أسبوعية حول نشاط النظام مباشرة لبريدك.',
            value: emailNotif,
            onChange: () => setEmailNotif(!emailNotif),
        },
        {
            id: 'system_notif',
            icon: 'notifications',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'إشعارات النظام التفاعلية',
            description: 'تنبيهات فورية تظهر داخل النظام عند حدوث أي حظر أمني أو عمليات مالية.',
            value: systemNotif,
            onChange: () => setSystemNotif(!systemNotif),
        },
    ];

    return (
        <div className="space-y-6 pb-8 font-sans w-full max-w-5xl mx-auto" dir="rtl">

            {/* ══════════════════════════════════════
                Page Header
            ══════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-on-surface mb-0.5 tracking-tight">
                            الإعدادات الشخصية
                        </h1>
                        <p className="text-sm font-medium text-on-surface-variant">
                            إدارة هويتك الرقمية، تخصيص الإشعارات، والتحكم بمفاتيح الأمان.
                        </p>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Section 1: Profile Editing (Global Standard)
            ══════════════════════════════════════ */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden mt-6 relative">
                {/* Decorative Background Glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <div className="p-6 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        <h3 className="text-lg font-extrabold text-on-surface tracking-tight">الهوية والمصادقة الأمنية</h3>
                    </div>
                    {isDirty && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-pulse border border-orange-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            يوجد تغييرات غير محفوظة!
                        </span>
                    )}
                </div>

                <div className="p-6 md:p-8 space-y-8 relative z-10">
                    
                    {/* Full Name */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4 border-b border-outline-variant/40 pb-8">
                        <div className="md:w-1/3">
                            <label className="text-[15px] font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl text-on-surface-variant">badge</span>
                                الإسم الكامل
                            </label>
                            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                                سيظهر هذا الاسم لباقي الموظفين والعملاء في النظام (يمكن تعديله فوراً).
                            </p>
                        </div>
                        <div className="md:w-2/3">
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 text-[15px] font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4 border-b border-outline-variant/40 pb-8">
                        <div className="md:w-1/3">
                            <label className="text-[15px] font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl text-on-surface-variant">phone_iphone</span>
                                رقم الهاتف
                            </label>
                            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                                يستخدم لإرسال إشعارات وتأكيدات (OTP) الهامة.
                            </p>
                        </div>
                        <div className="md:w-2/3">
                            <div className="relative">
                                <input
                                    type="text"
                                    name="phone"
                                    dir="ltr"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full bg-surface-container border rounded-xl p-3.5 text-[15px] font-mono font-bold focus:outline-none transition-all shadow-inner pr-32 ${
                                        isPhoneChanged && !phoneVerified 
                                            ? 'border-orange-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-orange-700' 
                                            : phoneVerified
                                                ? 'border-emerald-400 text-emerald-700'
                                                : 'border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary'
                                    }`}
                                />
                                <AnimatePresence>
                                    {isPhoneChanged && !phoneVerified && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            onClick={handleRequestPhoneVerification}
                                            className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white text-xs font-bold px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">sms</span>
                                            جلب رمز التأكيد
                                        </motion.button>
                                    )}
                                    {phoneVerified && isPhoneChanged && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute right-3 top-0 bottom-0 flex items-center text-emerald-600 text-xs font-bold gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">verified</span>
                                            تم التحقق من الرقم الجديد
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="md:w-1/3">
                            <label className="text-[15px] font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-xl text-on-surface-variant">mail</span>
                                البريد الإلكتروني
                            </label>
                            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed font-medium">
                                المعرف الأساسي لحسابك. يتطلب تغييره التحقق عبر الايميل الجديد لضمان الأمان العالي.
                            </p>
                        </div>
                        <div className="md:w-2/3">
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full bg-surface-container border rounded-xl p-3.5 text-[15px] font-mono leading-none font-bold focus:outline-none transition-all shadow-inner pr-44 ${
                                        isEmailChanged 
                                            ? 'border-error/60 focus:border-error focus:ring-1 focus:ring-error text-error/90 bg-error/5' 
                                            : 'border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary'
                                    }`}
                                />
                                <AnimatePresence>
                                    {isEmailChanged && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            onClick={handleRequestEmailVerification}
                                            disabled={emailPending}
                                            className={`absolute right-2 top-2 bottom-2 text-white text-xs font-bold px-4 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                                                emailPending 
                                                    ? 'bg-emerald-500 hover:bg-emerald-600' 
                                                    : 'bg-gradient-to-r from-error to-error/80 hover:from-error/90 hover:to-error hover:shadow-error/20'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                {emailPending ? 'mark_email_read' : 'outgoing_mail'}
                                            </span>
                                            {emailPending ? 'تم الإرسال.. (بانتظار التأكيد)' : 'إرسال رابط التفعيل'}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                            
                            {/* Email Hint Alert */}
                            <AnimatePresence>
                                {isEmailChanged && !emailPending && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-error/10 border border-error/20 rounded-lg p-3 mt-3 flex items-start gap-2.5"
                                    >
                                        <span className="material-symbols-outlined text-error text-[18px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                                        <p className="text-xs font-bold text-error leading-relaxed">
                                            إجراء أمني: سيبقى إيميلك القديم يعمل حتى تقوم بالضغط على الرابط الذي سنُرسله للإيميل التابع للحقل أعلاه.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Section 2: Notification Preferences
            ══════════════════════════════════════ */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="p-6 border-b border-outline-variant/60 flex items-center gap-3 bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                    <h3 className="text-lg font-extrabold text-on-surface tracking-tight">تخصيص الإشعارات</h3>
                </div>

                <div className="divide-y divide-outline-variant/40">
                    {notifRows.map((row) => (
                        <div key={row.id} className="p-6 flex items-center justify-between hover:bg-surface-container-lowest/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl ${row.iconBg} ${row.iconColor} flex items-center justify-center flex-shrink-0 shadow-sm border border-outline-variant/30`}>
                                    <span className="material-symbols-outlined text-[22px]">{row.icon}</span>
                                </div>
                                <div className="max-w-lg">
                                    <h4 className="font-bold text-[15px] text-on-surface mb-1">{row.label}</h4>
                                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{row.description}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={row.onChange}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none shadow-inner shrink-0 ${
                                    row.value ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant border-transparent'
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                        row.value ? 'translate-x-1' : 'translate-x-6'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════
                Action / Save Bar
            ══════════════════════════════════════ */}
            <div className="sticky bottom-6 bg-surface/80 backdrop-blur-xl rounded-2xl border border-outline-variant shadow-lg shadow-black/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-40">
                <div className="flex items-center gap-3 text-sm text-on-surface-variant px-2">
                    <span className="material-symbols-outlined text-emerald-500 animate-pulse">verified_user</span>
                    <span className="font-medium">بياناتك مشفرة ومؤمنة بالكامل على خوادم النظام.</span>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                    {isDirty && (
                        <button
                            type="button"
                            onClick={() => setFormData({ ...originalData })}
                            className="flex-[1] sm:w-auto px-5 py-3 rounded-xl font-bold text-sm bg-surface-container hover:bg-outline-variant/60 text-on-surface-variant transition-colors"
                        >
                            تراجع
                        </button>
                    )}
                    <button
                        type="button"
                        disabled={!isDirty}
                        onClick={handleSaveProfile}
                        className={`flex-[2] sm:w-auto inline-flex items-center justify-center gap-2 text-[15px] font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 ${
                            isDirty 
                                ? 'bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-primary/20' 
                                : 'bg-surface-container text-on-surface-variant opacity-60 cursor-not-allowed'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        {isDirty ? 'تحديث الإعدادات' : 'لم يتم تعديل شيء'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
