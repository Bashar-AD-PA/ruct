import React, { useState } from 'react';
import { useAdminDashboardStats } from '../../../hooks/api/useFinancial';
import DynamicPageLoader from '../../../shared/components/DynamicPageLoader';
import { Wallet, Monitor, Plus, ReceiptText, ArrowUpRight, ArrowDownRight, Percentage } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminFinancialDashboard = () => {
    const { data, isLoading } = useAdminDashboardStats();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex justify-center flex-1 w-full py-20" dir="rtl">
                <DynamicPageLoader messages={["جاري تحميل البيانات المالية...", "يتم تجميع سجلات الأرباح..."]} icon="payments" />
            </div>
        );
    }

    const { total_system_profit = 0, total_owners_profit = 0, current_system_rate = 15, ad_transactions = [], screens_history = [] } = data || {};

    return (
        <div className="flex flex-col lg:flex-row gap-6 mt-6" dir="rtl">
            
            {/* Left side: Main tables and stats */}
            <div className="flex-1 space-y-6 min-w-0">
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-on-surface-variant">إجمالي أرباح النظام</h3>
                                <p className="text-3xl font-black text-primary mt-1">${parseFloat(total_system_profit).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Wallet className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-success mt-4 relative z-10 font-bold">
                            <ArrowUpRight className="w-4 h-4" />
                            <span>معدل الخصم الحالي: {current_system_rate}%</span>
                        </div>
                        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                    </div>

                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <div>
                                <h3 className="text-sm font-bold text-on-surface-variant">أرباح ملاك الشاشات</h3>
                                <p className="text-3xl font-black text-secondary mt-1">${parseFloat(total_owners_profit).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                                <Monitor className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-on-surface-variant mt-4 relative z-10">
                            <span>حصيلة الأرباح الصافية بعد الخصم</span>
                        </div>
                        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-secondary/5 rounded-full blur-2xl"></div>
                    </div>
                </div>

                {/* Ad Transactions Table */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
                        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-primary" /> سجل المعاملات الإعلانية
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant">
                                <tr>
                                    <th className="p-4">اسم الإعلان</th>
                                    <th className="p-4">الشاشة المستهدفة</th>
                                    <th className="p-4">المعلن</th>
                                    <th className="p-4">السعر الكلي</th>
                                    <th className="p-4">خصم الخدمة (Sfee%)</th>
                                    <th className="p-4">صافي ربح المالك</th>
                                    <th className="p-4">وقت التشغيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/50 text-on-surface font-medium">
                                {ad_transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-on-surface-variant">لا توجد معاملات إعلانية حتى الآن.</td>
                                    </tr>
                                ) : (
                                    ad_transactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-surface-container-lowest/50 transition-colors">
                                            <td className="p-4">{tx.title}</td>
                                            <td className="p-4">{tx.target_screen}</td>
                                            <td className="p-4">{tx.advertiser}</td>
                                            <td className="p-4 font-bold">${parseFloat(tx.total_price).toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className="bg-error/10 text-error px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1">
                                                    {tx.sfee_rate}% <span>(${parseFloat(tx.sfee_amount).toFixed(2)})</span>
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-success">${parseFloat(tx.net_owner_profit).toFixed(2)}</td>
                                            <td className="p-4 font-mono text-xs" dir="ltr">{tx.run_time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Screens Financial History Table */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container/30">
                        <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-secondary" /> سجل الشاشات المالي الكلي
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant">
                                <tr>
                                    <th className="p-4">اسم الشاشة</th>
                                    <th className="p-4">الموقع</th>
                                    <th className="p-4">أرباح الشاشة الكلية</th>
                                    <th className="p-4">عمولة النظام المحصلة</th>
                                    <th className="p-4 text-center">عدد الإعلانات المشغلة</th>
                                    <th className="p-4 text-center">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/50 text-on-surface font-medium">
                                {screens_history.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-on-surface-variant">لا توجد شاشات مسجلة حتى الآن.</td>
                                    </tr>
                                ) : (
                                    screens_history.map((screen, idx) => (
                                        <tr key={idx} className="hover:bg-surface-container-lowest/50 transition-colors">
                                            <td className="p-4 font-bold">{screen.screen_name}</td>
                                            <td className="p-4 text-on-surface-variant text-xs">{screen.location}</td>
                                            <td className="p-4 font-bold text-secondary">${parseFloat(screen.total_screen_profit).toFixed(2)}</td>
                                            <td className="p-4 font-bold text-primary">${parseFloat(screen.system_commission_collected).toFixed(2)}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-surface-container-high px-2 py-1 rounded text-xs">{screen.ads_played_count}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center items-center gap-1.5 text-xs font-bold">
                                                    <span className={`w-2 h-2 rounded-full ${screen.status === 'Online' ? 'bg-success' : 'bg-error'}`}></span>
                                                    {screen.status === 'Online' ? 'نشط' : 'غير متصل'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Right side: Pricing and Action */}
            <div className="w-full lg:w-[320px] space-y-6 flex-shrink-0">
                <button 
                    onClick={() => navigate('/dashboard/screens')}
                    className="w-full bg-primary hover:bg-primary/90 text-white p-4 rounded-2xl shadow-lg shadow-primary/20 transition-all font-bold flex items-center justify-center gap-2 text-lg hover:-translate-y-1"
                >
                    <Plus className="w-6 h-6" /> تسجيل شاشة جديدة
                </button>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-container/30">
                        <h4 className="font-bold text-on-surface flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-primary" /> أسعار الإعلانات القياسية
                        </h4>
                    </div>
                    <div className="p-4 space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                            <span className="font-bold text-on-surface">إعلان عادي (10 ثواني)</span>
                            <span className="font-black text-primary">$15.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                            <span className="font-bold text-on-surface">إعلان فضي (15 ثانية)</span>
                            <span className="font-black text-primary">$20.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1 h-full bg-secondary"></div>
                            <span className="font-bold text-on-surface">إعلان ذهبي (30 ثانية)</span>
                            <span className="font-black text-secondary">$35.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                            <span className="font-bold text-on-surface">إعلان طويل (60 ثانية)</span>
                            <span className="font-black text-primary">$60.00</span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-outline-variant bg-surface-container/30">
                        <h4 className="font-bold text-on-surface flex items-center gap-2">
                            <Percentage className="w-5 h-5 text-error" /> هيكل الخصم / الخدمة
                        </h4>
                    </div>
                    <div className="p-5 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-error/10 text-error rounded-full mb-3">
                            <span className="text-3xl font-black">{current_system_rate}%</span>
                        </div>
                        <h5 className="font-bold text-on-surface mb-1">عمولة تشغيل النظام</h5>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            يتم استقطاع هذه النسبة من إجمالي مبلغ كل إعلان لصالح إدارة النظام كرسوم تشغيل وخدمة، ويتم تحويل الباقي مباشرة لحساب المالك كأرباح صافية.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminFinancialDashboard;
