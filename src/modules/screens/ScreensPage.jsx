import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, TerminalSquare, Edit2, Image as ImageIcon, Eye, Activity, Info, MapPin, UploadCloud, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';
import ScreenCommandModal from './components/ScreenCommandModal';
import usePermission from '../../hooks/usePermission';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
};

const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass, textClass }) => (
    <motion.div variants={itemVariants} className={`p-5 md:p-6 rounded-3xl border-2 ${borderClass} ${bgClass} relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300`}>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="space-y-1 z-10">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                <h3 className={`text-3xl md:text-4xl font-black ${textClass}`}>{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorClass} group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>
    </motion.div>
);

const ScreensPage = () => {
    const [screens, setScreens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ open: false, isEdit: false, screen: null });
    const [formLoading, setFormLoading] = useState(false);
    const [showImageModal, setShowImageModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [commandTarget, setCommandTarget] = useState(null);
    const [lookups, setLookups] = useState({ types: [], streets: [], owners: [] });
    const addToast = useToastStore(state => state.addToast);
    
    const [statusFilter, setStatusFilter] = useState('all');
    const [detailsModal, setDetailsModal] = useState({ open: false, screen: null });
    const { can } = usePermission();

    // Form state
    const [form, setForm] = useState({ 
        screen_name: '', 
        mac_address: '', 
        type_id: '', 
        street_id: '', 
        owner_id: '', 
        status: 'Online',
        photo: null 
    });

    const handleOpenModal = (isEdit = false, screen = null) => {
        if (isEdit && screen) {
            setForm({
                screen_name: screen.screen_name || '',
                mac_address: screen.mac_address || '', 
                type_id: screen.type_id || '',
                street_id: screen.street_id || '',
                owner_id: screen.owner_id || '',
                status: screen.status || 'Online',
                photo: null
            });
        } else {
            setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', status: 'Online', photo: null });
        }
        setModalConfig({ open: true, isEdit, screen });
    };

    useEffect(() => {
        fetchScreens();
        fetchLookups();
    }, []);

    const fetchScreens = async () => {
        try {
            const res = await axiosClient.get(ENDPOINTS.SCREENS.ALL);
            setScreens(res.data);
        } catch (e) {
            console.error(e);
            addToast('حدث خطأ أثناء جلب الشاشات', 'error');
        } finally { 
            setLoading(false); 
        }
    };

    const fetchLookups = async () => {
        try {
            const [types, streets, owners] = await Promise.all([
                axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES),
                axiosClient.get(ENDPOINTS.LOOKUPS.STREETS),
                axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('ScreenOwner')),
            ]);
            setLookups({ types: types.data, streets: streets.data, owners: owners.data });
        } catch (e) { 
            console.error(e); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (modalConfig.isEdit) {
                const updatePayload = {
                    screen_name: form.screen_name,
                    type_id: form.type_id,
                    street_id: form.street_id,
                    status: form.status
                };
                await axiosClient.put(ENDPOINTS.SCREENS.UPDATE(modalConfig.screen.screen_id), updatePayload);
                addToast('تم تحديث بيانات الشاشة بنجاح', 'success');
            } else {
                const formData = new FormData();
                Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val); });
                await axiosClient.post(ENDPOINTS.SCREENS.ALL, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                addToast('تمت إضافة الشاشة الجديدة بنجاح', 'success');
            }
            
            setModalConfig({ open: false, isEdit: false, screen: null });
            fetchScreens();
        } catch (e) {
            addToast(e.response?.data?.message || 'تعذر إتمام العملية. يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.SCREENS.DELETE(deleteTarget));
            addToast('تم إسقاط الشاشة من الشبكة بنجاح', 'success');
            setDeleteTarget(null);
            fetchScreens();
        } catch (e) {
            addToast('فشلت عملية الحذف. قد تكون الشاشة مرتبطة بإعلانات نشطة', 'error');
        }
    };

    const columns = [
        { 
            key: 'screen_name', 
            header: 'اسم الشاشة', 
            cell: (row) => <span className="font-black text-gray-900 text-sm whitespace-nowrap">{row.screen_name}</span> 
        },
        { 
            key: 'mac_address', 
            header: 'MAC Address', 
            cell: (row) => <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-bold whitespace-nowrap">{row.mac_address}</span> 
        },
        { 
            key: 'pairing_code', 
            header: 'كود الربط', 
            cell: (row) => row.pairing_code ? <span className="font-mono text-xs font-bold text-gray-700 tracking-widest">{row.pairing_code}</span> : <span className="text-gray-400">—</span> 
        },
        { 
            key: 'status', 
            header: 'الحالة', 
            cell: (row) => <StatusBadge status={row.status} /> 
        },
        { 
            key: 'image', 
            header: 'صورة', 
            cell: (row) => (
                row.image_path ? (
                    <button onClick={(e) => { e.stopPropagation(); setShowImageModal(row.image_path) }} className="hover:scale-105 transition-transform overflow-hidden rounded-xl border border-gray-200 shadow-sm block w-10 h-10 md:w-12 md:h-12 relative group mx-auto shrink-0">
                        <img src={row.image_path} className="w-full h-full object-cover" alt="Thumb" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                    </button>
                ) : <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center mx-auto shrink-0"><ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-300" /></div>
            )
        },
        { 
            key: 'type.type_name', 
            header: 'النوع', 
            cell: (row) => <span className="text-xs font-bold text-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/10 px-3 py-1.5 rounded-full border border-[var(--color-dark-turquoise)]/20 whitespace-nowrap">{row.type?.type_name || '—'}</span> 
        },
        { 
            key: 'owner.full_name', 
            header: 'المالك', 
            cell: (row) => <span className="text-xs md:text-sm font-bold text-gray-700 max-w-[120px] truncate block" title={row.owner?.full_name}>{row.owner?.full_name || '—'}</span> 
        },
        {
            key: 'street.name', 
            header: 'الموقع', 
            cell: (row) => {
                const s = row.street;
                if (!s) return <span className="text-gray-400 text-xs">—</span>;
                return (
                    <div className="flex flex-col text-right">
                        <span className="text-xs font-black text-gray-800 whitespace-nowrap">{s.name}</span>
                        {s.region && <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{s.region.name}</span>}
                    </div>
                );
            }
        },
        { 
            key: 'linked_at', 
            header: 'آخر اتصال', 
            cell: (row) => row.linked_at ? <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{new Date(row.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span> : <span className="text-gray-400">—</span> 
        },
        {
            key: 'actions', 
            header: 'إجراءات', 
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, screen: row }) }} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-900 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-gray-900" title="التفاصيل">
                        <Eye className="w-4 h-4" />
                    </button>
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); setCommandTarget(row) }} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-[var(--color-dark-turquoise)] hover:text-white transition-all shadow-sm border border-gray-200 hover:border-[var(--color-dark-turquoise)]" title="التحكم بالشاشة">
                            <TerminalSquare className="w-4 h-4" />
                        </button>
                    )}
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, row) }} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-blue-600" title="تعديل الشاشة">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    {(can('manage_all') || can('manage_screens')) && (
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id) }} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 hover:border-rose-600" title="حذف الشاشة">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        },
    ];

    const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[var(--color-dark-turquoise)]/10 focus:border-[var(--color-dark-turquoise)] transition-all text-right";
    const labelClass = "text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 block px-1";

    const filteredScreens = statusFilter === 'all' ? screens : screens.filter(s => s.status === statusFilter);

    // Calc stats
    const stats = {
        total: screens.length,
        online: screens.filter(s => s.status === 'Online').length,
        offline: screens.filter(s => s.status === 'Offline').length,
        maintenance: screens.filter(s => s.status === 'Maintenance').length
    };

    return (
        <div className="space-y-6 pb-12 w-full max-w-[1600px] mx-auto font-sans" dir="rtl">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-6 h-6 text-[var(--color-dark-turquoise)]" />
                        </div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">إدارة الشاشات</span>
                    </span>
                }
                description="مراقبة وإدارة جميع شاشات العرض المركزية، والحالة التشغيلية، وصيانة الشبكة بصورة فورية."
                action={
                    (can('manage_all') || can('manage_screens')) && (
                        <button
                            onClick={() => handleOpenModal(false)}
                            className="bg-[var(--color-dark-turquoise)] hover:bg-[#0d4f5b] text-white font-bold px-6 py-3 md:py-3.5 rounded-xl flex items-center gap-2.5 text-sm transition-all shadow-[0_8px_16px_-4px_rgba(20,93,106,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(20,93,106,0.3)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none"></div>
                            <Plus className="w-5 h-5 text-[var(--color-gold)]" /> إضافة شاشة جديدة
                        </button>
                    )
                }
            />

            {!loading && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    <StatCard 
                        title="إجمالي الشاشات في الأسطول" 
                        value={stats.total} 
                        icon={Monitor} 
                        colorClass="bg-blue-50 text-blue-600" 
                        borderClass="border-blue-100" 
                        bgClass="bg-white" 
                        textClass="text-gray-900" 
                    />
                    <StatCard 
                        title="شاشات متصلة بالشبكة" 
                        value={stats.online} 
                        icon={Activity} 
                        colorClass="bg-emerald-50 text-emerald-600" 
                        borderClass="border-emerald-100" 
                        bgClass="bg-white" 
                        textClass="text-gray-900" 
                    />
                    <StatCard 
                        title="شاشات مقطوعة الاتصال" 
                        value={stats.offline} 
                        icon={AlertCircle} 
                        colorClass="bg-red-50 text-red-600" 
                        borderClass="border-red-100" 
                        bgClass="bg-white" 
                        textClass="text-gray-900" 
                    />
                    <StatCard 
                        title="تحت الصيانة والإصلاح" 
                        value={stats.maintenance} 
                        icon={TerminalSquare} 
                        colorClass="bg-amber-50 text-amber-600" 
                        borderClass="border-amber-100" 
                        bgClass="bg-white" 
                        textClass="text-gray-900" 
                    />
                </motion.div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
                {/* Status Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-2 mt-1">
                    {[
                        { key: 'all', label: 'كافة الشاشات' },
                        { key: 'Online', label: 'متصلة (Online)' },
                        { key: 'Offline', label: 'غير متصلة (Offline)' },
                        { key: 'Maintenance', label: 'في قسم الصيانة' },
                        { key: 'pending_activation', label: 'بانتظار الموافقة والتفعيل' }
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                            className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${statusFilter === tab.key ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-900/20' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-white'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/20 shadow-inner min-h-[400px]">
                    <DataTable 
                        columns={columns} 
                        data={filteredScreens} 
                        loading={loading} 
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                                    <Monitor className="w-10 h-10 text-gray-300" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">لا توجد שاشات مسجلة هنا</h4>
                                <p className="text-sm font-medium text-gray-500 max-w-[320px] mx-auto">
                                    يبدو أنه لا يوجد بيانات تطابق معايير الفلترة الحالية أو أنه لم يتم إضافة أي شاشات للنظام بعد.
                                </p>
                            </div>
                        } 
                    />
                </div>
            </div>

            {/* Add/Edit Screen Modal */}
            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, isEdit: false, screen: null })} title={modalConfig.isEdit ? "تحديث بيانات الشاشة" : "تسجيل شاشة جديدة"}>
                <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                    
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-gray-400" />
                            <h4 className="text-xs font-black text-gray-700">المعلومات الأساسية</h4>
                        </div>
                        
                        <div>
                            <label className={labelClass}>اسم الشاشة <span className="text-red-500">*</span></label>
                            <input type="text" required value={form.screen_name} onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))} placeholder="مثال: شاشة مجمع العرب (بوابة 1)" className={inputClass} />
                        </div>
                        
                        {!modalConfig.isEdit && (
                            <div>
                                <label className={labelClass}>معرّف الجهاز (MAC Address) <span className="text-red-500">*</span></label>
                                <input type="text" required value={form.mac_address} onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))} placeholder="AA:BB:CC:DD:EE:FF" className={inputClass} dir="ltr" />
                                <p className="text-[10px] font-bold text-gray-400 mt-1.5 px-1">استخدم عنوان الماك الحقيقي لضمان الاتصال الصحيح</p>
                            </div>
                        )}

                        {modalConfig.isEdit && (
                            <div>
                                <label className={labelClass}>الحالة التشغيلية</label>
                                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                                    <option value="Online">متصلة وتعمل بشكل طبيعي (Online)</option>
                                    <option value="Offline">غير متصلة بالشبكة (Offline)</option>
                                    <option value="Maintenance">تحت الصيانة (Maintenance)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <h4 className="text-xs font-black text-gray-700">تحديد الموقع والتصنيف</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>النوع</label>
                                <select value={form.type_id} onChange={(e) => setForm(p => ({ ...p, type_id: e.target.value }))} className={inputClass}>
                                    <option value="">-- اختر التصنيف --</option>
                                    {lookups.types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>الموقع (الشارع)</label>
                                <select value={form.street_id} onChange={(e) => setForm(p => ({ ...p, street_id: e.target.value }))} className={inputClass}>
                                    <option value="">-- اختر منطقة التواجد --</option>
                                    {lookups.streets.map(s => <option key={s.street_id} value={s.street_id}>{s.name} - {s.region?.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {!modalConfig.isEdit && (
                            <div>
                                <label className={labelClass}>مدير أو مالك الشاشة</label>
                                <select value={form.owner_id} onChange={(e) => setForm(p => ({ ...p, owner_id: e.target.value }))} className={inputClass}>
                                    <option value="">-- تعيين مالك للمحاسبة --</option>
                                    {lookups.owners.map(o => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    {!modalConfig.isEdit && (
                        <div>
                            <label className={labelClass}>صورة مرجعية للشاشة <span className="text-red-500">*</span></label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {form.photo ? (
                                            <div className="flex flex-col items-center text-emerald-600">
                                                <ImageIcon className="w-8 h-8 mb-2" />
                                                <p className="text-sm font-bold text-emerald-700 truncate max-wxs px-4">{form.photo.name}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                                <p className="mb-2 text-sm text-gray-500"><span className="font-bold">انقر للرفع</span> أو اسحب الصورة هنا</p>
                                                <p className="text-xs text-gray-400 font-bold">صيغ مدعومة: JPG, PNG أو WEBP</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" required onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} />
                                </label>
                            </div>
                        </div>
                    )}
                    
                    <button type="submit" disabled={formLoading} className="w-full bg-gray-900 hover:bg-black text-white font-black text-sm py-4 rounded-xl transition-all mt-8 shadow-lg shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed">
                        {formLoading ? 'جاري التنفيذ...' : (modalConfig.isEdit ? 'اعتماد التحديثات المرفوعة' : 'حفظ وإضافة الشاشة للأسطول')}
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="إزالة الشاشة من الشبكة"
                message="هل أنت متأكد من رغبتك في حذف وحذف ربط هذه الشاشة؟ سيؤدي ذلك إلى إيقاف كافة الحملات الإعلانية المرتبطة بها بشكل فوري. هذا الإجراء غير قابل للتراجع."
                confirmText="نعم، تنفيذ الإسقاط"
            />

            <ScreenCommandModal 
                isOpen={!!commandTarget} 
                onClose={() => setCommandTarget(null)} 
                screen={commandTarget} 
            />

            {/* View Details Modal */}
            <Modal isOpen={detailsModal.open} onClose={() => setDetailsModal({ open: false, screen: null })} title="البطاقة التعريفية للشاشة">
                {detailsModal.screen && (
                    <div className="space-y-5" dir="rtl">
                        <div className="flex items-start justify-between bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                            <div className="space-y-1">
                                <h2 className="text-lg font-black text-gray-900">{detailsModal.screen.screen_name}</h2>
                                <p className="text-xs font-mono font-bold text-gray-500 tracking-widest">{detailsModal.screen.mac_address || 'Unregistered MAC'}</p>
                            </div>
                            <StatusBadge status={detailsModal.screen.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-5 rounded-2xl border border-gray-200">
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">كود الربط الداخلي</span>
                                <span className="font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded border shadow-sm">{detailsModal.screen.pairing_code || '—'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">النبضة الأخيرة</span>
                                <span className="font-bold text-gray-800">{detailsModal.screen.linked_at ? new Date(detailsModal.screen.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'لم تتصل بعد'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">طراز الشاشة</span>
                                <span className="font-bold text-gray-800">{detailsModal.screen.type?.type_name || '—'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">المستفيد/المالك</span>
                                <span className="font-bold text-gray-800">{detailsModal.screen.owner?.full_name || '—'}</span>
                            </div>
                            <div className="col-span-2 space-y-1 pt-2 border-t border-gray-200 mt-2">
                                <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">الموقع الجغرافي المسجل</span>
                                <span className="font-bold text-gray-800 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {detailsModal.screen.street?.name || '—'} {detailsModal.screen.street?.region ? `(${detailsModal.screen.street.region.name})` : ''}
                                </span>
                            </div>
                        </div>

                        {detailsModal.screen.image_path && (
                            <div className="pt-2">
                                <span className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">الصورة المرجعية للحالة</span>
                                <div className="border border-gray-200 rounded-2xl flex items-center justify-center p-2 bg-gray-50 shadow-inner overflow-hidden">
                                    <img src={detailsModal.screen.image_path} alt="Screen Map Indicator" className="max-h-[220px] w-full rounded-xl object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" onClick={() => setShowImageModal(detailsModal.screen.image_path)} loading="lazy" />
                                </div>
                            </div>
                        )}

                        <button onClick={() => setDetailsModal({ open: false, screen: null })} className="w-full mt-2 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm">
                            إغلاق البطاقة
                        </button>
                    </div>
                )}
            </Modal>

            {/* View Image Modal */}
            <Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title="استعراض صورة الأصل">
                <div className="flex justify-center items-center py-4 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-inner">
                    {showImageModal && (
                        <img src={showImageModal} alt="Preview" className="max-w-full h-auto rounded-xl object-contain max-h-[60vh] hover:scale-110 transition-transform duration-700 pointer-events-none" />
                    )}
                </div>
                <button onClick={() => setShowImageModal(null)} className="mt-4 w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors shadow-lg">
                    إنهاء المعاينة
                </button>
            </Modal>
        </div>
    );
};

export default ScreensPage;
