import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';

const SettingsPage = () => {
    const { user } = useAuthStore();
    const [emailNotif, setEmailNotif] = useState(true);
    const [systemNotif, setSystemNotif] = useState(true);

    /* ── Field rows for personal info table ── */
    const infoRows = [
        {
            id: 'full_name',
            icon: 'person',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'الاسم الكامل',
            value: user?.full_name || '—',
            dir: 'rtl',
        },
        {
            id: 'email',
            icon: 'mail',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'البريد الإلكتروني',
            value: user?.email || '—',
            dir: 'ltr',
        },
        {
            id: 'phone',
            icon: 'call',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'رقم الهاتف',
            value: user?.phone || '—',
            dir: 'ltr',
        },
        {
            id: 'role',
            icon: 'admin_panel_settings',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'الصلاحية الإدارية',
            value: user?.role?.role_name || '—',
            dir: 'ltr',
            highlight: true,
        },
    ];

    /* ── Notification rows ── */
    const notifRows = [
        {
            id: 'email_notif',
            icon: 'mail',
            iconBg: 'bg-secondary/10',
            iconColor: 'text-secondary',
            label: 'إشعارات البريد الإلكتروني',
            description: 'تلقي تحديثات أسبوعية حول أداء الإعلانات وحالة الحساب المالي.',
            value: emailNotif,
            onChange: () => setEmailNotif(p => !p),
        },
        {
            id: 'system_notif',
            icon: 'notifications',
            iconBg: 'bg-primary/10',
            iconColor: 'text-primary',
            label: 'إشعارات النظام التفاعلية',
            description: 'تنبيهات فورية متعلقة بالموافقات على الحملات والفواتير المصدرة.',
            value: systemNotif,
            onChange: () => setSystemNotif(p => !p),
        },
    ];

    return (
        <div className="space-y-4 pb-8" dir="rtl">

            {/* ══════════════════════════════════════
                Page Header
            ══════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 py-2 mb-1">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-on-surface mb-0.5 flex items-center gap-2">
                        إعدادات الحساب
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">settings</span>
                        </div>
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                        إدارة ملفك الشخصي وتخصيص تفضيلات الإشعارات والأمان.
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Section 1: Personal Information Table
            ══════════════════════════════════════ */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-outline-variant flex items-center gap-2 bg-surface">
                    <span className="material-symbols-outlined text-lg text-primary">person</span>
                    <h3 className="text-base font-semibold text-on-surface">المعلومات الشخصية</h3>
                    <span className="mr-auto text-xs text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant">
                        للقراءة فقط
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap">الحقل</th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap">القيمة</th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap text-left">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant text-sm">
                            {infoRows.map((row) => (
                                <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                                    {/* Field label + icon */}
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full ${row.iconBg} ${row.iconColor} flex items-center justify-center flex-shrink-0`}>
                                                <span className="material-symbols-outlined text-[16px]">{row.icon}</span>
                                            </div>
                                            <span className="font-medium text-on-surface-variant">{row.label}</span>
                                        </div>
                                    </td>

                                    {/* Value */}
                                    <td className="py-3 px-5">
                                        {row.highlight ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                                                <span className="material-symbols-outlined text-[13px]">verified_user</span>
                                                {row.value}
                                            </span>
                                        ) : (
                                            <span
                                                className="font-medium text-on-surface"
                                                style={{ direction: row.dir, display: 'inline-block' }}
                                            >
                                                {row.value}
                                            </span>
                                        )}
                                    </td>

                                    {/* Status badge */}
                                    <td className="py-3 px-5 text-left">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs border border-outline-variant">
                                            <span className="material-symbols-outlined text-[12px]">lock</span>
                                            مقفل
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Locked Notice inside the card */}
                <div className="border-t border-outline-variant bg-error-container/40 px-5 py-3 flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-error mt-0.5">info</span>
                    <p className="text-xs text-on-error-container/80 leading-relaxed">
                        <span className="font-bold">تعديل الملف الشخصي مقفل حالياً — </span>
                        حسابك مرتبط بالنظام الإداري المركزي ولا يمكن تعديله يدوياً لأغراض أمنية. للتغيير يرجى التواصل مع الدعم الفني.
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Section 2: Notification Preferences Table
            ══════════════════════════════════════ */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-4 border-b border-outline-variant flex items-center gap-2 bg-surface">
                    <span className="material-symbols-outlined text-lg text-primary">notifications_active</span>
                    <h3 className="text-base font-semibold text-on-surface">تفضيلات الإشعارات</h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-surface-container-low border-b border-outline-variant">
                            <tr>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap">نوع الإشعار</th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap hidden md:table-cell">الوصف</th>
                                <th className="py-3 px-5 text-xs text-on-surface-variant font-medium whitespace-nowrap text-left">تفعيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant text-sm">
                            {notifRows.map((row) => (
                                <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                                    {/* Label + icon */}
                                    <td className="py-3 px-5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-full ${row.iconBg} ${row.iconColor} flex items-center justify-center flex-shrink-0`}>
                                                <span className="material-symbols-outlined text-[16px]">{row.icon}</span>
                                            </div>
                                            <span className="font-medium text-on-surface">{row.label}</span>
                                        </div>
                                    </td>

                                    {/* Description */}
                                    <td className="py-3 px-5 text-on-surface-variant text-xs hidden md:table-cell max-w-xs">
                                        {row.description}
                                    </td>

                                    {/* Toggle */}
                                    <td className="py-3 px-5 text-left">
                                        <button
                                            type="button"
                                            onClick={row.onChange}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                                row.value ? 'bg-primary' : 'bg-outline-variant'
                                            }`}
                                            role="switch"
                                            aria-checked={row.value}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                                    row.value ? 'translate-x-1' : 'translate-x-6'
                                                }`}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════
                Save Bar
            ══════════════════════════════════════ */}
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-on-surface-variant">
                    آخر تعديل على الإعدادات منذ وقت قريب.
                </p>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary text-sm font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-base">save</span>
                    حفظ التفضيلات
                </button>
            </div>

        </div>
    );
};

export default SettingsPage;
