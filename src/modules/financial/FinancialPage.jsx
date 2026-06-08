import React, { useState, useEffect } from 'react';
import { 
    Wallet, Search, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, 
    XCircle, Activity, BarChart3, Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';

const FinancialPage = () => {
    const [data, setData] = useState({ total_payments: 0, transactions: [] });
    const [loading, setLoading] = useState(true);

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

    const transactions = data.transactions || [];
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'completed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const failedTransactions = transactions.filter(t => t.status === 'rejected').length;
    const totalRevenue = data.total_payments || 0;

    const columns = [
        { 
            key: 'created_at', 
            header: 'التاريخ', 
            cell: (row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800" dir="ltr">
                        {new Date(row.created_at).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400" dir="ltr">
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
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-600 text-xs shadow-inner">
                        {row.user?.full_name?.charAt(0) || '-'}
                    </div>
                    <span className="text-sm font-black text-slate-700">{row.user?.full_name || '—'}</span>
                </div>
            )
        },
        { 
            key: 'payment_method', 
            header: 'طريقة الدفع', 
            cell: (row) => (
                <span className="bg-slate-100/80 text-slate-500 font-bold px-2.5 py-1 rounded-md text-xs uppercase tracking-wider flex w-max gap-1 items-center">
                    <Wallet className="w-3 h-3 text-slate-400" /> {row.payment_method || 'N/A'}
                </span>
            )
        },
        { 
            key: 'reference_number', 
            header: 'المرجع', 
            cell: (row) => (
                <span className="font-mono text-xs font-black text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                    #{row.reference_number || '---'}
                </span>
            )
        },
        { 
            key: 'amount', 
            header: 'المبلغ', 
            cell: (row) => (
                <span className="text-base font-black text-slate-900 font-mono tracking-tighter">
                    ${parseFloat(row.amount).toFixed(2)}
                </span>
            )
        },
        { 
            key: 'status', 
            header: 'الحالة', 
            cell: (row) => {
                if (row.status === 'completed') return (
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> معتمدة
                    </span>
                );
                if (row.status === 'rejected') return (
                    <span className="bg-red-50 border border-red-200 text-red-700 font-black text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <XCircle className="w-3.5 h-3.5" /> مرفوضة
                    </span>
                );
                return (
                    <span className="bg-amber-50 border border-amber-200 text-amber-700 font-black text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max shadow-sm">
                        <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                    </span>
                );
            }
        },
    ];

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-20 pt-6 pb-4 border-b border-slate-200/50 mb-8 backdrop-blur-xl">
                <PageHeader 
                    title={
                        <span className="flex items-center gap-3">
                            <span className="bg-gradient-to-br from-slate-800 to-black text-white p-2.5 rounded-xl shadow-lg ring-4 ring-slate-900/5">
                                <BarChart3 className="w-6 h-6 shrink-0" />
                            </span>
                            <span className="text-3xl font-black tracking-tight text-slate-900">دفتر الأستاذ المالي</span>
                        </span>
                    }
                    description="نظرة تنفيذية آنية للتدفقات النقدية والعمليات المالية مع سجلات المحاسبة الدقيقة."
                />
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                {/* Total Revenue Card (Hero Card) */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-bl from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-2 bg-[var(--color-gold)] opacity-90 block"></div>
                    <div className="absolute -bottom-10 -right-10 text-white/5 transform rotate-12">
                        <BarChart3 className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-2 tracking-widest flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-[var(--color-gold)]" /> إجمالي الإيرادات المؤكدة
                        </p>
                        {loading ? (
                            <div className="h-12 w-48 bg-white/10 animate-pulse rounded-xl mt-3"></div>
                        ) : (
                            <h2 className="text-5xl font-black text-white tracking-tighter my-2 font-mono drop-shadow-md">
                                ${parseFloat(totalRevenue).toFixed(2)}
                            </h2>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                            <span className="bg-white/10 text-emerald-400 font-bold text-xs px-2.5 py-1 rounded border border-white/5 flex items-center gap-1 backdrop-blur-sm">
                                <ArrowUpRight className="w-3 h-3" /> محصلة فعلية
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Status Cards */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-slate-100">
                        <Receipt className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-wider">العمليات الكلية</p>
                        {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div> : <h3 className="text-2xl font-black text-slate-800">{totalTransactions}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-emerald-600 mb-1 tracking-wider">عملية ناجحة</p>
                        {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div> : <h3 className="text-2xl font-black text-emerald-600">{successfulTransactions}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4 transition-colors group-hover:bg-amber-100">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-amber-600 mb-1 tracking-wider">قيد المراجعة</p>
                        {loading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-lg"></div> : <h3 className="text-2xl font-black text-amber-600">{pendingTransactions}</h3>}
                    </div>
                </motion.div>
            </div>

            {/* LEDGER TABLE */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400" /> السجل المالي والمحاسبي
                    </h3>
                </div>
                
                <div className="p-1">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4].map(idx => (
                                <div key={idx} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-xl animate-pulse border border-slate-100">
                                    <div className="w-1/6 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-2/6 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/6 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/6 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/6 h-8 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-24 bg-white">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-100 border-dashed">
                                <Receipt className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">السجل المحاسبي فارغ حالياً</h3>
                            <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto">لم يتم تسجيل أي تعاملات أو مدفوعات نقدية في النظام حتى هذه اللحظة.</p>
                        </div>
                    ) : (
                        <div className="[&>div]:!shadow-none [&>div]:!p-0 [&_table]:!border-0">
                            {/* Inheriting DataTable logic but applying clean wrapper constraints to allow it to spread natively */}
                            <DataTable 
                                columns={columns} 
                                data={transactions} 
                                loading={false} 
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default FinancialPage;
