import React, { useState, useEffect } from 'react';
import { 
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
    Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, 
    ChevronDown, Download, Landmark, FileText, Filter, ListFilter, Banknote, CreditCard, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useToastStore from '../../store/useToastStore';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import Modal from '../../shared/components/Modal';
import { useOwnerEarnings, useRequestPayout } from '../../hooks/api/useFinancial';

/* ─── Premium Colour Tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    secondary: '#0060ac',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    onBackground: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    success: '#166534',
    successContainer: '#dcfce7',
    warning: '#b45309',
    warningContainer: '#fef3c7',
};

const OwnerEarningsPage = () => {
    // ─── 1. DATA FROM BACKEND ───
    const { data, isLoading: isFetching } = useOwnerEarnings();
    const { mutateAsync: requestPayout } = useRequestPayout();

    const balance = data?.available_balance || 0;
    const totalEarned = data?.total_earnings || 0;
    const logs = data?.pending_logs || [];
    
    const formattedTx = logs.map(log => {
        let type = 'earning';
        if (log.transaction_type === 'payout_requested' || log.transaction_type === 'payout_completed' || log.transaction_type === 'payout_rejected') {
            type = 'payout';
        }
        
        let source = log.notes || 'معاملة مالية';
        if (log.advertisement) {
             source = 'إعلان: ' + log.advertisement.title;
        }
        
        return {
            id: log.ledger_id || log.id,
            type: type,
            amount: Math.abs(log.amount),
            source: source,
            date: new Date(log.created_at).toLocaleString('ar-EG'),
            status: log.status
        };
    });
    
    const transactions = formattedTx;
    const pendingPayouts = formattedTx.filter(t => t.type === 'payout' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

    // ─── 2. STATE & UI CONTROLS ───
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'earnings', 'payouts'
    const [isPayoutModalOpen, setPayoutModalOpen] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ amount: '', bank: '', account_number: '' });
    const [loading, setLoading] = useState(false);
    const addToast = useToastStore(s => s.addToast);

    // ─── 3. HANDLERS ───
    const handleRequestPayout = async (e) => {
        e.preventDefault();
        const amt = parseFloat(payoutForm.amount);
        if (amt > balance) return addToast('المبلغ المطلوب يتخطى الرصيد المتاح!', 'error');
        if (amt < 50) return addToast('الحد الأدنى للسحب هو $50', 'warning');
        
        setLoading(true);
        try {
            await requestPayout({
                amount: amt,
                bank_name: payoutForm.bank,
                account_number: payoutForm.account_number
            });
            setPayoutModalOpen(false);
            setPayoutForm({ amount: '', bank: '', account_number: '' });
        } catch (error) {
            // Error is handled by hook
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => {
        if (activeTab === 'earnings') return t.type === 'earning';
        if (activeTab === 'payouts') return t.type === 'payout';
        return true;
    });

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto w-full" style={{ direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
            
            {/* ── Page Header ── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#141b2b] m-0 mb-2 tracking-tight flex items-center gap-3">
                        المحفظة الإلكترونية <Wallet className="w-8 h-8 text-blue-600" />
                    </h1>
                    <p className="text-sm font-medium text-gray-500 m-0">تتبع أرباح شاشاتك، راقب نمو استثماراتك، واطلب سحب أموالك بسهولة.</p>
                </div>
                <button
                    onClick={() => setPayoutModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-600/30 hover:-translate-y-1 transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #004ac6 100%)' }}
                >
                    <Landmark className="w-5 h-5" />
                    طلب سحب أرباح
                </button>
            </motion.div>

            {/* ── 1. WALLET CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Available Balance (Hero Card) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="relative overflow-hidden p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between min-h-[220px]"
                    style={{ background: 'linear-gradient(135deg, #141b2b 0%, #1e293b 100%)' }}
                >
                    {/* Decorative abstract shapes */}
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute right-10 top-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-80">
                            <Wallet className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">الرصيد المتاح للسحب</span>
                        </div>
                        <h2 className="text-5xl font-black mb-1 tracking-tight" dir="ltr" style={{ textAlign: 'right' }}>
                            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h2>
                    </div>
                </motion.div>

                {/* Total Earned */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="p-8 rounded-3xl border shadow-sm flex flex-col justify-center"
                    style={{ background: '#ffffff', borderColor: S.outlineVariant }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-50 text-green-600">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">إجمالي الأرباح المتراكمة</p>
                            <h3 className="text-2xl font-black text-[#141b2b]" dir="ltr" style={{ textAlign: 'right' }}>
                                ${totalEarned.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {/* Pending Payouts */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="p-8 rounded-3xl border shadow-sm flex flex-col justify-center"
                    style={{ background: '#ffffff', borderColor: S.outlineVariant }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-1">مبالغ قيد المراجعة والتحويل</p>
                            <h3 className="text-2xl font-black text-[#141b2b]" dir="ltr" style={{ textAlign: 'right' }}>
                                ${pendingPayouts.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── 2. TRANSACTION HISTORY ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl border shadow-sm overflow-hidden"
                style={{ borderColor: S.outlineVariant }}
            >
                {/* Header & Filters */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f9f9ff] border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-[#141b2b] m-0 mb-1">سجل المعاملات والأرباح</h2>
                        <p className="text-xs font-medium text-gray-500 m-0">يظهر هنا تفاصيل الأرباح لكل شاشة بالإضافة لسجلات الدفع والسحب.</p>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'earnings', label: 'الأرباح فقط' },
                            { id: 'payouts', label: 'المسحوبات فقط' }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                <th className="p-5 font-bold">المعاملة</th>
                                <th className="p-5 font-bold">التاريخ والوقت</th>
                                <th className="p-5 font-bold">المصدر / البيان</th>
                                <th className="p-5 font-bold">الحالة</th>
                                <th className="p-5 font-bold text-left">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            <AnimatePresence mode="popLayout">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-16 text-center text-gray-400">
                                            <ListFilter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            لا توجد معاملات مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((trx, i) => (
                                        <motion.tr key={trx.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                                            className="hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${trx.type === 'earning' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                        {trx.type === 'earning' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#141b2b] m-0">{trx.type === 'earning' ? 'أرباح شاشة' : 'سحب أموال'}</p>
                                                        <p className="text-[11px] font-mono text-gray-400 m-0 mt-0.5">{trx.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm font-medium text-gray-600 whitespace-nowrap">{trx.date}</td>
                                            <td className="p-5 text-sm font-bold text-gray-700">{trx.source}</td>
                                            <td className="p-5">
                                                {trx.status === 'completed' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                                        <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-5 text-left whitespace-nowrap">
                                                <span className={`text-lg font-black ${trx.type === 'earning' ? 'text-green-600' : 'text-[#141b2b]'}`} dir="ltr">
                                                    {trx.type === 'earning' ? '+' : '-'}${trx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── 3. PAYOUT MODAL ── */}
            <Modal isOpen={isPayoutModalOpen} onClose={() => setPayoutModalOpen(false)} title="طلب سحب أرباح (Payout Request)">
                <div dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 m-0 mb-1">معلومات السحب</h4>
                            <p className="text-xs text-blue-700 m-0 leading-relaxed">
                                يمكنك سحب أرباحك فور تجاوز الحد الأدنى ($50). يتم معالجة طلبات السحب خلال 2-3 أيام عمل وتحويلها لحسابك البنكي المسجل.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleRequestPayout} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">المبلغ المراد سحبه ($)</label>
                            <input type="number" required min="50" max={balance} step="0.5"
                                value={payoutForm.amount} onChange={e => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                                placeholder="مثال: 500"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                            />
                            <p className="text-[11px] font-bold text-gray-400 mt-2 flex justify-between">
                                <span>الحد الأدنى للسحب: $50</span>
                                <button type="button" onClick={() => setPayoutForm({ ...payoutForm, amount: balance })} className="text-blue-600 hover:underline cursor-pointer">سحب كامل الرصيد</button>
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">البنك المحول إليه</label>
                            <div className="relative">
                                <select required
                                    value={payoutForm.bank} onChange={e => setPayoutForm({ ...payoutForm, bank: e.target.value })}
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer"
                                    style={{ paddingRight: '40px' }}
                                >
                                    <option value="">-- اختر البنك --</option>
                                    <option value="kuraimi">بنك الكريمي</option>
                                    <option value="tadhamon">بنك التضامن</option>
                                    <option value="yemen_kuwait">بنك اليمن والكويت</option>
                                    <option value="cac">بنك التسليف الزراعي (CAC)</option>
                                </select>
                                <Building className="absolute right-3 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                                <ChevronDown className="absolute left-4 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">رقم الحساب البنكي / رقم الآيبان (IBAN)</label>
                            <div className="relative">
                                <input type="text" required
                                    value={payoutForm.account_number} onChange={e => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                                    placeholder="أدخل رقم الحساب المعتمد"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#141b2b] focus:border-blue-600 focus:ring-0 outline-none transition-colors"
                                    style={{ paddingRight: '40px' }}
                                />
                                <CreditCard className="absolute right-3 top-[14px] w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button type="button" onClick={() => setPayoutModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={loading} className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-xl'}`}>
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Landmark className="w-5 h-5" />}
                                تأكيد طلب السحب
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default OwnerEarningsPage;
