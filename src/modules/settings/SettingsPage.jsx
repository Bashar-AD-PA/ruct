import React from 'react';
import { Settings, User, Bell, Shield, Mail, Phone, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import PageHeader from '../../shared/components/PageHeader';

const SettingsSection = ({ title, description, icon: Icon, children, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, delay }}
        className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] overflow-hidden mb-8 relative group"
    >
        <div className="absolute top-0 right-0 w-2 h-full bg-[var(--color-dark-turquoise)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="flex flex-col md:flex-row md:items-start gap-8 p-8 md:p-10">
            {/* Section Header */}
            <div className="md:w-1/3 shrink-0">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                    <Icon className="w-6 h-6 text-[var(--color-dark-turquoise)]" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-[250px]">{description}</p>
            </div>
            
            {/* Section Content */}
            <div className="md:w-2/3 flex-1 w-full">
                {children}
            </div>
        </div>
    </motion.div>
);

const SettingsPage = () => {
    const { user } = useAuthStore();

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-20 pt-6 pb-4 border-b border-slate-200/50 mb-10 backdrop-blur-xl">
                <PageHeader 
                    title={
                        <span className="flex items-center gap-3">
                            <span className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg ring-4 ring-slate-900/5">
                                <Settings className="w-6 h-6 shrink-0" />
                            </span>
                            <span className="text-3xl font-black tracking-tight text-slate-900">إعدادات الحساب</span>
                        </span>
                    }
                    description="إدارة ملفك الشخصي وتخصيص تفضيلات الإشعارات والأمان."
                />
            </div>

            {/* ACCOUNT INFORMATION */}
            <SettingsSection 
                title="المعلومات الشخصية" 
                description="بيانات الحساب الأساسية الخاصة بك. لتحديث هذه البيانات يرجى التواصل مع الإدارة المركزية."
                icon={User}
                delay={0}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block px-1">الاسم الكامل</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                disabled 
                                value={user?.full_name || ''} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm font-bold text-slate-600 cursor-not-allowed shadow-inner focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block px-1">البريد الإلكتروني</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-slate-400" />
                            </div>
                            <input 
                                type="email" 
                                disabled 
                                value={user?.email || ''} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm font-bold text-slate-600 cursor-not-allowed shadow-inner focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block px-1">رقم الهاتف</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-slate-400" />
                            </div>
                            <input 
                                type="text" 
                                disabled 
                                value={user?.phone || '—'} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm font-bold text-slate-600 cursor-not-allowed shadow-inner focus:outline-none"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block px-1">الصلاحية الإدارية</label>
                        <div className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl py-3 px-4 text-sm font-black text-indigo-700 cursor-not-allowed flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            {user?.role?.role_name || '—'}
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <h5 className="text-sm font-black text-amber-800">تعديل الملف الشخصي مقفل حالياً</h5>
                        <p className="text-xs font-bold text-amber-600/80 mt-1">حسابك مرتبط بالنظام الإداري المركزي ولا يمكن تعديله يدوياً لأغراض أمنية.</p>
                    </div>
                </div>
            </SettingsSection>

            {/* NOTIFICATION PREFERENCES */}
            <SettingsSection 
                title="تفضيلات الإشعارات" 
                description="إدارة كيفية تواصل النظام معك واستقبالك للتنبيهات الحيوية."
                icon={Bell}
                delay={0.1}
            >
                <div className="space-y-4">
                    <label className="relative flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white border border-slate-200 transition-colors">
                                <Mail className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-sm">إشعارات البريد الإلكتروني</p>
                                <p className="text-xs font-bold text-slate-500 mt-1">تلقي تحديثات أسبوعية حول أداء الإعلانات وحالة الحساب المالي.</p>
                            </div>
                        </div>
                        {/* Custom Modern Toggle UI strictly visual based on native checkbox hidden behind peer */}
                        <div className="relative z-10">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-dark-turquoise)]"></div>
                        </div>
                    </label>

                    <label className="relative flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all group overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-white border border-slate-200 transition-colors">
                                <Bell className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-sm">إشعارات النظام التفاعلية</p>
                                <p className="text-xs font-bold text-slate-500 mt-1">تنبيهات فورية متعلقة بالموافقات على الحملات والفواتير المصدرة.</p>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-dark-turquoise)]"></div>
                        </div>
                    </label>
                </div>
            </SettingsSection>
            
            {/* ACTION FOOTER */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="flex items-center justify-between pt-6 border-t border-slate-200"
            >
                <p className="text-xs font-bold text-slate-400">آخر تعديل على الحساب منذ وقت قريب.</p>
                <button 
                    type="button"
                    className="bg-[var(--color-dark-turquoise)] hover:bg-[#0c4c58] text-white font-black px-10 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2"
                >
                    حفظ التفضيلات المؤقتة
                </button>
            </motion.div>
        </div>
    );
};

export default SettingsPage;
