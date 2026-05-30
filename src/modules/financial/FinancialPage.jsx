import React, { useState, useEffect } from 'react';
import { Wallet, Search } from 'lucide-react';
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
                setData({ total_payments: 0, transactions: [] }); // Safe fallback
            } finally {
                setLoading(false);
            }
        };
        fetchFinancials();
    }, []);

    const columns = [
        { key: 'created_at', header: 'التاريخ', cell: (row) => new Date(row.created_at).toLocaleDateString('ar-EG') },
        { key: 'user.full_name', header: 'المعلن', cell: (row) => row.user?.full_name || '—' },
        { key: 'payment_method', header: 'طريقة الدفع', accessorKey: 'payment_method' },
        { key: 'reference_number', header: 'المرجع', accessorKey: 'reference_number' },
        { key: 'amount', header: 'المبلغ', cell: (row) => `$${row.amount}` },
        { key: 'status', header: 'الحالة', cell: (row) => (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold text-white ${
                row.status === 'completed' ? 'bg-[#2E7D32]' : 
                row.status === 'rejected' ? 'bg-red-600' : 'bg-[var(--color-gold)]'
            }`}>
                {row.status === 'completed' ? 'معتمدة' : row.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
            </span>
        )},
    ];

    return (
        <div className="space-y-6" dir="rtl">
            <PageHeader 
                title={
                    <span className="flex items-center gap-3">
                        <Wallet className="w-7 h-7 text-[var(--color-dark-turquoise)]" /> الإدارة المالية
                    </span>
                }
                description="عرض جميع المعاملات المالية"
            />

            <div className="bg-white border-[2.5px] border-[var(--color-dark-turquoise)] rounded-lg p-6 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-500 mb-1">إجمالي المدفوعات المعتمدة</p>
                    <h2 className="text-3xl font-black text-[var(--color-dark-turquoise)]">${data.total_payments || 0}</h2>
                </div>
                <div className="p-4 bg-[var(--color-dark-turquoise)]/10 rounded-full">
                    <Wallet className="w-8 h-8 text-[var(--color-gold)]" />
                </div>
            </div>

            <DataTable columns={columns} data={data.transactions} loading={loading} emptyMessage="لا توجد عمليات مالية" />
        </div>
    );
};

export default FinancialPage;
