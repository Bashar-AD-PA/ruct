import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';

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

    const [originalData, setOriginalData] = useState({ ...formData });

    const isEmailChanged = formData.email !== originalData.email;
    const isPhoneChanged = formData.phone !== originalData.phone;
    const isNameChanged = formData.full_name !== originalData.full_name;
    const isDirty = isEmailChanged || isPhoneChanged || isNameChanged;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        if (!isDirty) return;

        try {
            const res = await axiosClient.put(ENDPOINTS.AUTH.UPDATE_PROFILE, {
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone
            });
            // Update global state and original state
            useAuthStore.getState().setUser(res.data.user);
            setOriginalData({ ...formData });
            addToast('تم حفظ الملف الشخصي وتحديث بياناتك بنجاح!', 'success');
        } catch (error) {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء تعديل الحساب، يرجى المحاولة لاحقاً', 'error');
            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach(errArray => {
                    addToast(errArray[0], 'error');
                });
            }
        }
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
                        </div>
                        <div className="md:w-2/3">
                            <div className="relative">
                                <input
                                    type="text"
                                    name="phone"
                                    dir="ltr"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 text-[15px] font-mono font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                />
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
                        </div>
                        <div className="md:w-2/3">
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-surface-container border border-outline-variant rounded-xl p-3.5 text-[15px] font-mono leading-none font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
                                />
                            </div>
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
                        <div key={row.id} className="p-6 flex flex-col sm:flex-row items-center justify-between hover:bg-surface-container-lowest/50 transition-colors gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                                <div className={`w-12 h-12 rounded-xl ${row.iconBg} ${row.iconColor} flex items-center justify-center flex-shrink-0 shadow-sm border border-outline-variant/30`}>
                                    <span className="material-symbols-outlined text-[22px]">{row.icon}</span>
                                </div>
                                <div className="flex-1">
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
