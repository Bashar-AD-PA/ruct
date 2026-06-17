import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import Modal from '../../shared/components/Modal';

const PaymentOperationsPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [isLoading, setIsLoading] = useState(true);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [completedPayments, setCompletedPayments] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    
    // For Receipt Modal
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.FINANCIAL.LEDGER);
            if (res.data.success) {
                const ledger = res.data.data || [];
                
                // Filter manual pending payments
                setPendingPayments(
                    ledger.filter(item => item.transaction_type === 'payment_pending' && item.status === 'pending')
                );
                
                // Filter completed electronic/approved payments
                setCompletedPayments(
                    ledger.filter(item => item.transaction_type === 'payment_in' && item.status === 'completed')
                );
            }
        } catch (error) {
            addToast('فشل في جلب سجلات الدفع', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleApprove = async (ledgerId) => {
        if (!window.confirm('هل أنت متأكد من اعتماد هذه الدفعة وتفعيل الإعلان؟')) return;
        
        try {
            await axiosClient.post(ENDPOINTS.FINANCIAL.APPROVE(ledgerId));
            addToast('تم اعتماد الدفعة بنجاح', 'success');
            fetchPayments();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل اعتماد الدفعة', 'error');
        }
    };

    const openReceipt = (path) => {
        if (!path) return;
        const fullUrl = axiosClient.defaults.baseURL.replace('/api', '') + path;
        setSelectedReceipt(fullUrl);
        setIsReceiptModalOpen(true);
    };

    const PaymentCard = ({ item, isCompleted }) => (
        <div className="bg-surface-container-lowest rounded-[16px] border border-outline-variant shadow-sm flex flex-col justify-between overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
            {/* Main Content Padding */}
            <div className="p-6 pb-6">
                {/* Header: Badge on Right, Amount on Left */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className={`px-3 py-1.5 rounded-full font-label-md text-[11px] font-bold ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                        }`}>
                            {isCompleted ? 'مكتمل (إلكتروني/معتمد)' : 'بانتظار التأكيد (يدوي)'}
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="font-caption text-caption text-on-surface-variant mb-1">المبلغ</p>
                        <p className={`font-title-lg text-title-lg font-black ${isCompleted ? 'text-emerald-600' : 'text-orange-500'}`}>
                            ${parseFloat(item.amount || 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Rows list */}
                <div className="space-y-5">
                    <div className="flex justify-between items-center">
                        <span className="font-caption text-xs text-on-surface-variant">الإعلان المستهدف:</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold truncate max-w-[140px] text-left">{item.advertisement?.title || 'غير متوفر'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-caption text-xs text-on-surface-variant">المعلن:</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold text-left">{item.user?.full_name || 'غير متوفر'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-caption text-xs text-on-surface-variant">التاريخ:</span>
                        <span className="font-label-md text-label-md text-on-surface font-bold text-left">{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    {isCompleted && item.reference_number && (
                        <div className="flex justify-between items-center">
                            <span className="font-caption text-xs text-on-surface-variant whitespace-nowrap ml-2">المرجع (Stripe):</span>
                            <span className="font-caption text-[11px] text-on-surface font-bold truncate text-left" dir="ltr">{item.reference_number}</span>
                        </div>
                    )}
                </div>
                
                {/* Action buttons (only for pending) inside main padded area */}
                {!isCompleted && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-outline-variant/30">
                        {item.receipt_path && (
                            <button
                                onClick={() => openReceipt(item.receipt_path)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary font-label-md text-label-md hover:bg-primary-fixed transition-colors"
                            >
                                <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px' }}>image</span> عرض الإيصال
                            </button>
                        )}
                        <button
                            onClick={() => handleApprove(item.ledger_id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-label-md text-label-md hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                        >
                            <span className="material-symbols-outlined shrink-0" style={{ fontSize: '18px' }}>check_circle</span> اعتماد الدفع
                        </button>
                    </div>
                )}
            </div>

            {/* Footer for general view details */}
            <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/30 flex justify-start">
                <button className="text-primary font-label-md text-[13px] flex items-center gap-1 hover:text-primary-container transition-colors font-bold outline-none">
                    التفاصيل
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 p-margin-desktop flex flex-col gap-xl max-w-7xl mx-auto w-full animate-fade-in" dir="rtl">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
                {/* Title Block */}
                <div className="flex flex-col gap-xs">
                    <div className="flex items-center gap-sm">
                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                        <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">عمليات الدفع</h2>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant pr-md">مراجعة الإيصالات اليدوية واعتماد الدفعات المعلقة</p>
                </div>

                {/* Tabs (Segmented Control) */}
                <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/50">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`font-label-md text-label-md px-xl py-sm rounded-md focus:outline-none transition-colors flex items-center gap-2 ${
                            activeTab === 'pending'
                                ? 'text-primary bg-surface-container-lowest shadow-sm border border-outline-variant/30 font-bold'
                                : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        المعلقات (يدوي)
                        {pendingPayments.length > 0 && (
                            <span className="inline-flex items-center justify-center bg-error-container text-on-error-container rounded-full font-caption text-[10px] min-w-[20px] h-5 px-1">
                                {pendingPayments.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`font-label-md text-label-md px-xl py-sm rounded-md focus:outline-none transition-colors ${
                            activeTab === 'completed'
                                ? 'text-primary bg-surface-container-lowest shadow-sm border border-outline-variant/30 font-bold'
                                : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        مكتملة
                    </button>
                </div>
            </div>

            {/* Lists or Empty States */}
            {isLoading ? (
                <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col items-center justify-center p-2xl min-h-[500px]">
                     <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex-1 w-full relative">
                    {activeTab === 'pending' ? (
                        pendingPayments.length === 0 ? (
                            <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col items-center justify-center p-2xl min-h-[500px]">
                                <div className="flex flex-col items-center gap-lg max-w-md text-center">
                                    <div className="text-surface-variant opacity-50 mb-md">
                                        <span className="material-symbols-outlined" style={{ fontSize: '96px', fontWeight: 200 }}>attach_money</span>
                                    </div>
                                    <div className="flex flex-col gap-sm">
                                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">لا توجد معلقات</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant">جميع الدفعات اليدوية تم معالجتها.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                                {pendingPayments.map(item => <PaymentCard key={item.ledger_id} item={item} isCompleted={false} />)}
                            </div>
                        )
                    ) : (
                        completedPayments.length === 0 ? (
                            <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col items-center justify-center p-2xl min-h-[500px]">
                                <div className="flex flex-col items-center gap-lg max-w-md text-center">
                                    <div className="text-surface-variant opacity-50 mb-md">
                                        <span className="material-symbols-outlined" style={{ fontSize: '96px', fontWeight: 200 }}>check_circle</span>
                                    </div>
                                    <div className="flex flex-col gap-sm">
                                        <h3 className="font-headline-md text-headline-md text-on-surface font-bold">لا توجد عمليات مكتملة</h3>
                                        <p className="font-body-md text-body-md text-on-surface-variant">لم يقم أحد بالدفع بعد.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                                {completedPayments.map(item => <PaymentCard key={item.ledger_id} item={item} isCompleted={true} />)}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Receipt Modal */}
            <Modal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                title="إيصال الدفع"
            >
                <div className="flex flex-col items-center pt-4">
                    {selectedReceipt ? (
                        <img 
                            src={selectedReceipt} 
                            alt="إيصال الدفع" 
                            className="max-w-full rounded-[16px] border border-outline-variant"
                            onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/400x500?text=تعذر+تحميل+الصورة';
                            }}
                        />
                    ) : (
                        <div className="py-xl flex flex-col items-center gap-md">
                            <span className="material-symbols-outlined text-surface-variant" style={{ fontSize: '48px' }}>image_not_supported</span>
                            <p className="font-body-md text-body-md text-on-surface-variant">لا يوجد إيصال مرفق</p>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsReceiptModalOpen(false)}
                        className="mt-6 w-full bg-surface-container-highest text-on-surface py-3 rounded-lg font-label-md text-label-md font-bold hover:bg-outline-variant transition-colors"
                    >
                        إغلاق
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentOperationsPage;
