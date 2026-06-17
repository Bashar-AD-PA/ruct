import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
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

    const totalCategories = categories.length;
    const avgPrice = totalCategories > 0 ? (categories.reduce((a, b) => a + parseFloat(b.price || 0), 0) / totalCategories).toFixed(2) : 0;
    const highestPrice = totalCategories > 0 ? Math.max(...categories.map(c => parseFloat(c.price || 0))).toFixed(2) : 0;
    const maxDurationNum = totalCategories > 0 ? Math.max(...categories.map(c => parseInt(c.max_duration || 0))) : 0;

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2.5 px-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:bg-surface transition-all text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-1.5 block px-1";

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 mb-2">
                <div className="flex flex-col">
                    <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-1 flex items-center gap-3">
                        كتالوج التصنيفات المالية
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-xl">account_tree</span>
                        </div>
                    </h1>
                    <p className="text-on-surface-variant font-body-md text-body-md">إدارة هيكل التسعير وفئات البث الإعلاني المرتبطة بحملات المعلنين.</p>
                </div>
                {can('manage_all') && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        إضافة تصنيف سعري
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">إجمالي التصنيفات</p>
                        <p className="font-display-lg text-headline-lg text-on-surface font-extrabold">{totalCategories}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">layers</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">متوسط التسعير اليومي</p>
                        <p className="font-display-lg text-headline-lg text-primary font-extrabold">${avgPrice}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">attach_money</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">السقف السعري الأعلى</p>
                        <p className="font-display-lg text-headline-lg text-on-surface font-extrabold">${highestPrice}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined text-2xl">gpp_maybe</span>
                    </div>
                </div>

                <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start">
                    <div>
                        <p className="font-label-md text-label-md text-on-surface-variant mb-4">سقف المدة الزمني</p>
                        <p className="font-display-lg text-headline-lg text-on-surface font-extrabold flex items-baseline gap-1">
                            {maxDurationNum} <span className="font-body-md text-body-md text-on-surface-variant">ثواني</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">schedule</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[300px] mt-8">
                <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface">
                    <h3 className="font-title-lg text-title-lg text-on-surface font-semibold flex items-center gap-2">
                        التسعير والقيود التشغيلية
                    </h3>
                    <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center">
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center flex-1 bg-surface/50 z-10 py-20">
                        <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center my-auto">
                        <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                            <span className="material-symbols-outlined text-outline text-3xl">info</span>
                        </div>
                        <h4 className="font-headline-md text-headline-md text-on-surface mb-2">لا توجد تصنيفات</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant">أضف تصنيفات إعلانية وتسعيرية للبدء.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                <tr>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap">اسم التصنيف</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">السعر ($/يوم)</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">أقصى مدة (ثانية)</th>
                                    <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-center">الحجم الأقصى (MB)</th>
                                    {can('manage_all') && <th className="py-4 px-6 font-label-md text-label-md text-on-surface-variant font-medium whitespace-nowrap text-left">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
                                {categories.map((row, index) => {
                                    const id = row.category_id || row.id || index;
                                    return (
                                        <tr key={id} className="hover:bg-surface-container-lowest transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-sm">category</span>
                                                    </div>
                                                    <span className="font-medium text-on-surface">{row.category_name || row.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center justify-center w-20 py-1 rounded-full bg-primary/10 text-primary font-bold font-mono text-sm">
                                                    ${parseFloat(row.price).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-on-surface-variant">
                                                <div className="flex justify-center items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    <span className="font-mono text-sm">{row.max_duration}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center text-on-surface-variant">
                                                <div className="flex justify-center items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-sm">sd_storage</span>
                                                    <span className="font-mono text-sm">{row.max_size}</span>
                                                </div>
                                            </td>
                                            {can('manage_all') && (
                                                <td className="py-4 px-6 text-left">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); openModal(row); }}
                                                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                            title="تعديل"
                                                        >
                                                            <span className="material-symbols-outlined">edit</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, id }); }}
                                                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-colors"
                                                            title="حذف"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT CATEGORY MODAL */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategory ? 'تحديث الفئة السعرية' : 'إصدار تصنيف مالي جديد'}
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4 mt-4" dir="rtl">
                    <div>
                        <label className={labelClass}>الاسم التعريفي (التصنيف) <span className="text-error">*</span></label>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>الكلفة التشغيلية (لليوم) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">attach_money</span>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className={`${inputClass} pr-10`}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>السقف الزمني (ثانية) <span className="text-error">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">schedule</span>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={form.max_duration}
                                    onChange={(e) => setForm({ ...form, max_duration: e.target.value })}
                                    className={`${inputClass} pr-10`}
                                    placeholder="مثال: 15"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>عتبة التخزين المسموحة (MB) <span className="text-error">*</span></label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">sd_storage</span>
                            <input
                                type="number"
                                required
                                min="1"
                                value={form.max_size}
                                onChange={(e) => setForm({ ...form, max_size: e.target.value })}
                                className={`${inputClass} pr-10`}
                                placeholder="مثال: 50"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري المعالجة...' : 'تخزين واعتماد'}
                        </button>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 bg-surface-variant text-on-surface-variant py-3 rounded-lg font-label-md text-label-md hover:bg-surface-container-highest border border-outline-variant transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog 
                isOpen={deleteDialog.open} 
                onClose={() => setDeleteDialog({ open: false, id: null })}
                onConfirm={handleDelete} 
                title="تأكيد الحذف النهائي" 
                message="هل أنت متأكد من حذف هذه الفئة السعرية؟ انتبه: سيؤثر الحذف المباشر بشكل سلبي على الإعلانات والحملات المرتبطة وتكلفتها." 
                confirmText="موافق، قم بالحذف" 
            />
        </div>
    );
};

export default CategoriesPage;
