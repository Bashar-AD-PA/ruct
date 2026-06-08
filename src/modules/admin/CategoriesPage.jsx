import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, DollarSign, Clock, FileDigit, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import DataTable from '../../shared/components/DataTable';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import usePermission from '../../hooks/usePermission';

const CategoriesPage = () => {
    const addToast = useToastStore(state => state.addToast);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
    const { can } = usePermission();

    const [form, setForm] = useState({
        category_name: '',
        price: '',
        max_duration: '',
        max_size: ''
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES);
            if (res.data.success) {
                setCategories(Array.isArray(res.data.data) ? res.data.data : res.data.data.data || []);
            } else {
                setCategories(Array.isArray(res.data) ? res.data : []);
            }
        } catch (error) {
            addToast('فشل في جلب التصنيفات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setForm({
                category_name: category.category_name || category.name || '',
                price: category.price || '',
                max_duration: category.max_duration || '',
                max_size: category.max_size || ''
            });
        } else {
            setEditingCategory(null);
            setForm({ category_name: '', price: '', max_duration: '', max_size: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category_name || !form.price || !form.max_duration || !form.max_size) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                category_name: form.category_name,
                price: parseFloat(form.price),
                max_duration: parseInt(form.max_duration),
                max_size: parseInt(form.max_size)
            };

            if (editingCategory) {
                const id = editingCategory.category_id || editingCategory.id;
                await axiosClient.put(ENDPOINTS.LOOKUPS.CATEGORY(id), payload);
                addToast('تم تعديل التصنيف بنجاح', 'success');
            } else {
                await axiosClient.post(ENDPOINTS.LOOKUPS.CATEGORIES, payload);
                addToast('تم إضافة التصنيف بنجاح', 'success');
            }
            closeModal();
            fetchCategories();
        } catch (error) {
            const errList = error.response?.data?.errors;
            if (errList) {
                const firstErr = Object.values(errList)[0][0];
                addToast(firstErr, 'error');
            } else {
                addToast(error.response?.data?.message || error.response?.data?.error || 'حدث خطأ أثناء حفظ التصنيف', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const { id } = deleteDialog;
        try {
            await axiosClient.delete(ENDPOINTS.LOOKUPS.CATEGORY(id));
            addToast('تم حذف التصنيف بنجاح', 'success');
            fetchCategories();
        } catch (error) {
            addToast(error.response?.data?.message || 'فشل حذف التصنيف', 'error');
        } finally {
            setDeleteDialog({ open: false, id: null });
        }
    };

    // Calculate Summary Metrics
    const totalCategories = categories.length;
    const avgPrice = totalCategories > 0 ? (categories.reduce((a, b) => a + parseFloat(b.price || 0), 0) / totalCategories).toFixed(2) : 0;
    const highestPrice = totalCategories > 0 ? Math.max(...categories.map(c => parseFloat(c.price || 0))).toFixed(2) : 0;
    const maxDurationNum = totalCategories > 0 ? Math.max(...categories.map(c => parseInt(c.max_duration || 0))) : 0;

    const columns = [
        { 
            key: 'category_name', 
            accessorKey: 'category_name', 
            label: 'اسم التصنيف', 
            header: 'اسم التصنيف', 
            cell: (row) => (
                <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-dark-turquoise)]/10 flex items-center justify-center font-black text-[var(--color-dark-turquoise)] text-xs border border-[var(--color-dark-turquoise)]/20 shadow-inner">
                        <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black text-slate-800">{row.category_name || row.name}</span>
                </div>
            )
        },
        { 
            key: 'price', 
            accessorKey: 'price', 
            label: 'السعر ($/يوم)', 
            header: 'السعر ($/يوم)', 
            cell: (row) => (
                <span className="bg-emerald-50 text-emerald-700 font-mono font-black border border-emerald-200 px-2.5 py-1 rounded-lg text-sm w-max inline-block shadow-sm">
                    ${parseFloat(row.price).toFixed(2)}
                </span>
            ) 
        },
        { 
            key: 'max_duration', 
            accessorKey: 'max_duration', 
            label: 'أقصى مدة (ثانية)', 
            header: 'أقصى مدة (ثانية)', 
            cell: (row) => (
                <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" /> {row.max_duration} <span className="text-[10px] text-slate-400">ثانية</span>
                </span>
            )
        },
        { 
            key: 'max_size', 
            accessorKey: 'max_size', 
            label: 'الحجم الأقصى (MB)', 
            header: 'الحجم الأقصى (MB)', 
            cell: (row) => (
                <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                    <FileDigit className="w-4 h-4 text-slate-400" /> {row.max_size} <span className="text-[10px] text-slate-400">MB</span>
                </span>
            )
        },
    ];

    if (can('manage_all')) {
        columns.push({
            key: 'actions',
            accessorKey: 'actions',
            label: 'إجراءات',
            header: 'إجراءات',
            cell: (row) => {
                const id = row.category_id || row.id;
                return (
                    <div className="flex justify-start items-center gap-2">
                        <button onClick={() => openModal(row)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200 shadow-sm" title="تعديل">
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, id })} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200 shadow-sm" title="حذف">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            }
        });
    }

    const inputClass = "w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-[var(--color-dark-turquoise)] transition-colors !text-right";
    const labelClass = "text-[12px] font-black text-slate-500 uppercase tracking-wider mb-2 block px-1";

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-20 pt-6 pb-4 border-b border-slate-200/50 mb-8 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader 
                    title={
                        <span className="flex items-center gap-3">
                            <span className="bg-gradient-to-br from-[var(--color-gold)] to-amber-500 text-white p-2.5 rounded-xl shadow-lg ring-4 ring-amber-500/10">
                                <Layers className="w-6 h-6 shrink-0" />
                            </span>
                            <span className="text-3xl font-black tracking-tight text-slate-900">كتالوج التصنيفات المالية</span>
                        </span>
                    }
                    description="إدارة هيكل التسعير وفئات البث الإعلاني المرتبطة بحملات المعلنين."
                />

                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-2xl active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> إضافة تصنيف سعري
                    </button>
                )}
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 relative z-10 text-indigo-600">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">إجمالي التصنيفات</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-slate-800">{totalCategories}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 relative z-10 text-emerald-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">متوسط التسعير اليومي</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-emerald-600">${avgPrice}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 relative z-10 text-amber-600">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">السقف السعري الأعلى</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-slate-800">${highestPrice}</h3>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[100px] z-0 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 relative z-10 text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">سقف المدة الزمني</p>
                        {isLoading ? <div className="h-8 w-16 bg-slate-100 animate-pulse rounded my-1"></div> : <h3 className="text-3xl font-black text-slate-800">{maxDurationNum} <span className="text-sm text-slate-400 font-bold">ثواني</span></h3>}
                    </div>
                </motion.div>
            </div>

            {/* CATEGORIES TABLE */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">التسعير والقيود التشغيلية</h3>
                </div>
                <div className="p-1">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(idx => (
                                <div key={idx} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-xl animate-pulse border border-slate-100">
                                    <div className="w-1/5 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/5 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/5 h-8 bg-slate-200 rounded"></div>
                                    <div className="w-1/5 h-8 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-20 bg-white">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-slate-100 border-dashed">
                                <Layers className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-700 mb-2">كتالوج التصنيفات فارغ تماماً</h3>
                            <p className="text-sm font-bold text-slate-400 max-w-sm mx-auto">أضف تصنيفات إعلانية وتسعيرية للبدء في توفير خطط مخصصة للمعلنين.</p>
                        </div>
                    ) : (
                        <div className="[&>div]:!shadow-none [&>div]:!p-0 [&_table]:!border-0">
                            <DataTable
                                columns={columns}
                                data={categories}
                                loading={false}
                            />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* CREATE / EDIT CATEGORY MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategory ? 'تحديث الفئة السعرية' : 'إصدار تصنيف مالي جديد'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pt-4" dir="rtl">
                    <div>
                        <label className={labelClass}>الاسم التعريفي (التصنيف) <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                maxLength="100"
                                value={form.category_name}
                                onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                                className={inputClass}
                                placeholder="أدخل اسم الفئة الإعلانية..."
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <label className={`${labelClass} flex items-center gap-1.5`}><DollarSign className="w-3.5 h-3.5 text-emerald-500" /> الكلفة التشغيلية (لليوم)</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className={`${inputClass} border-slate-300 bg-white font-mono text-xl text-[var(--color-dark-turquoise)]`}
                                placeholder="0.00"
                            />
                            <p className="text-[10px] font-bold text-slate-400 mt-2">عائد التسعير المباشر لليوم الواحد</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>السقف الزمني للمحتوى (ثانية) *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.max_duration}
                                    onChange={(e) => setForm({ ...form, max_duration: e.target.value })}
                                    className={`${inputClass} font-mono`}
                                    placeholder="مثال: 15"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>عتبة التخزين المسموحة (MB) *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.max_size}
                                    onChange={(e) => setForm({ ...form, max_size: e.target.value })}
                                    className={`${inputClass} font-mono`}
                                    placeholder="مثال: 50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-colors"
                        >
                            تراجع
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[var(--color-dark-turquoise)] hover:bg-[#0c4c58] text-white font-black px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    معالجة النظام...
                                </>
                            ) : (
                                'تخزين واعتماد'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* SECURE DELETE CONFIRM DIALOG */}
            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete} 
                title="تأكيد الحذف النهائي" 
                message="هل أنت متأكد من حذف هذه الفئة السعرية؟ انتبه: سيؤثر الحذف المباشر بشكل سلبي على الإعلانات والحملات المرتبطة وتكلفتها." 
                confirmText="حذف ضار" 
            />
        </div>
    );
};

export default CategoriesPage;
