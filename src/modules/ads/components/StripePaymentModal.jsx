import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, UploadCloud, FileImage } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import axiosClient from '../../../core/api/axiosClient';
import { ENDPOINTS } from '../../../core/api/endpoints';
import useToastStore from '../../../store/useToastStore';

const StripePaymentModal = ({ isOpen, onClose, advertisement, onSuccess }) => {
    const addToast = useToastStore(state => state.addToast);
    const [isLoading, setIsLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    
    // Dynamic payment methods states
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [isFetchingMethods, setIsFetchingMethods] = useState(true);
    const [receiptFile, setReceiptFile] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setIsFetchingMethods(true);
            setReceiptFile(null); // Reset on open
            axiosClient.get('/payment-methods')
                .then(res => {
                    if (res.data.success) {
                        setPaymentMethods(res.data.data);
                        if (res.data.data.length > 0) {
                            setSelectedMethod(res.data.data[0]);
                        }
                    }
                })
                .catch(() => addToast('فشل جلب بوابات الدفع', 'error'))
                .finally(() => setIsFetchingMethods(false));
        }
    }, [isOpen, addToast]);

    if (!advertisement) return null;

    const isStripe = !!selectedMethod?.stripe_publishable_key || selectedMethod?.name?.toLowerCase().includes('stripe') || selectedMethod?.name?.toLowerCase().includes('ستراب');

    const handleAction = async () => {
        if (!isStripe) {
            // Manual Transfer Logic
            if (!receiptFile) {
                addToast('يرجى إرفاق صورة سند التحويل أولاً', 'warning');
                return;
            }

            setIsLoading(true);
            try {
                const formData = new FormData();
                formData.append('ad_id', advertisement.ad_id);
                formData.append('payment_method_id', selectedMethod.method_id);
                formData.append('receipt_image', receiptFile);

                const res = await axiosClient.post('/payments/manual', formData);
                
                if (res.data.success) {
                    addToast('تم رفع السند بنجاح! ستتم المراجعة قريباً.', 'success');
                    onSuccess();
                    onClose();
                }
            } catch (error) {
                addToast(error.response?.data?.message || 'فشل رفع السند، يرجى المحاولة مرة أخرى', 'error');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Stripe Logic
        setIsLoading(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.PAYMENTS.STRIPE_CREATE_INTENT, {
                ad_id: advertisement.ad_id
            });
            if (res.data.success) {
                setClientSecret(res.data.clientSecret);
                addToast('تم إنشاء جلسة الدفع بنجاح', 'success');
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل الاتصال ببوابة الدفع', 'error');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmMock = async () => {
        if (!clientSecret) return;
        setIsConfirming(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.PAYMENTS.STRIPE_CONFIRM, {
                ad_id: advertisement.ad_id,
                payment_intent_id: clientSecret.split('_secret_')[0] 
            });
            if (res.data.success) {
                addToast('تم تأكيد الدفع الإلكتروني بنجاح', 'success');
                onSuccess();
                onClose();
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'حدث خطأ أثناء تأكيد الدفع', 'error');
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={clientSecret ? "متابعة الدفع" : "اختر طريقة الدفع"}
            icon={CreditCard}
        >
            <div className="space-y-6" dir="rtl">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-[var(--color-dark-turquoise)] mb-3 border-b pb-2">
                        تفاصيل الفاتورة
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between">
                            <span className="font-bold">رقم الإعلان:</span>
                            <span>#{advertisement.ad_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">العنوان:</span>
                            <span>{advertisement.title}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="font-black text-[var(--color-dark-turquoise)]">المبلغ الإجمالي المطلـوب:</span>
                            <span className="font-black text-2xl text-[var(--color-gold)]">
                                ${advertisement.total_cost}
                            </span>
                        </div>
                    </div>
                </div>

                {!clientSecret ? (
                    <div className="space-y-4">
                        <div className="font-bold text-gray-700 text-sm">بوابات الدفع المتاحة:</div>
                        {isFetchingMethods ? (
                            <div className="text-center text-sm text-gray-500 py-4">جاري تحميل بوابات الدفع...</div>
                        ) : paymentMethods.length === 0 ? (
                            <div className="text-center text-sm text-red-500 py-4">لا توجد بوابات دفع مفعلة حالياً.</div>
                        ) : (
                            <div className="space-y-3">
                                {paymentMethods.map(method => {
                                    const isSelected = selectedMethod?.method_id === method.method_id;
                                    const isStripeMethod = !!method.stripe_publishable_key || method.name.toLowerCase().includes('stripe') || method.name.toLowerCase().includes('ستراب');
                                    return (
                                        <div 
                                            key={method.method_id}
                                            className={`border rounded-xl transition-all overflow-hidden ${isSelected ? 'border-[var(--color-dark-turquoise)] bg-teal-50/30 shadow-sm' : 'border-gray-200 hover:border-teal-300'}`}
                                        >
                                            <div 
                                                onClick={() => setSelectedMethod(method)}
                                                className="p-4 cursor-pointer flex items-start gap-3"
                                            >
                                                <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-dark-turquoise)]' : 'border-gray-300'}`}>
                                                    {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--color-dark-turquoise)]" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm text-gray-800">{method.name}</div>
                                                    {method.account_details && (
                                                        <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{method.account_details}</div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isSelected && !isStripeMethod && (
                                                <div className="px-4 pb-4 border-t border-teal-100 pt-3 mt-1 bg-white">
                                                    <label className="block text-xs font-bold text-gray-700 mb-2">إرفاق صورة سند التحويل:</label>
                                                    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${receiptFile ? 'border-teal-400 bg-teal-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                                                        <div className="flex flex-col items-center justify-center pt-3 pb-4">
                                                            {receiptFile ? (
                                                                <>
                                                                    <FileImage className="w-6 h-6 text-teal-600 mb-1" />
                                                                    <p className="text-xs font-semibold text-teal-700 truncate max-w-[200px]">{receiptFile.name}</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                                                                    <p className="text-xs text-gray-500"><span className="font-semibold text-teal-600">اضغط لرفع الصورة</span></p>
                                                                </>
                                                            )}
                                                        </div>
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setReceiptFile(e.target.files[0])} />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1 mt-6">
                            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                            معاملاتك مشفرة ومؤمنة بالكامل عبر بوابة الدفع المختارة.
                        </p>
                        <button
                            onClick={handleAction}
                            disabled={isLoading || paymentMethods.length === 0 || !selectedMethod}
                            className="w-full bg-[var(--color-dark-turquoise)] hover:opacity-90 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'جاري التنفيذ...' : isStripe ? 'متابعة للدفع الإلكتروني' : 'تأكيد رفع الحوالة اليدوية'}
                        </button>
                    </div>
                ) : (
                    <div className="pt-2">
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-xs font-bold text-yellow-800 text-center">
                            بيئة مطورين (مُحاكاة): سيتم تجاوز إدخال البطاقة وإرسال طلب التأكيد API مباشرة كاختبار.
                        </div>
                        
                        <button
                            onClick={handleConfirmMock}
                            disabled={isConfirming}
                            className="w-full bg-[#2E7D32] hover:opacity-90 text-white font-black py-3.5 rounded-xl transition-all disabled:opacity-50"
                        >
                            {isConfirming ? 'جاري تأكيد الدفع...' : 'محاكاة تأكيد الدفع'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StripePaymentModal;
