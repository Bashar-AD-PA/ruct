import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Edit2, Trash2, ShieldCheck, Megaphone, MonitorSmartphone, Mail, MapPin, Eye, EyeOff, Building, CreditCard, Landmark, AlertCircle, Activity, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import DataTable from '../../shared/components/DataTable';
import StatusBadge from '../../shared/components/StatusBadge';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import PageHeader from '../../shared/components/PageHeader';
import useToastStore from '../../store/useToastStore';

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
    <motion.div variants={itemVariants} className={`p-5 md:p-6 rounded-3xl border-2 ${borderClass} ${bgClass} relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300`}>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="space-y-1.5 z-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <h3 className={`text-3xl md:text-4xl font-black ${textClass}`}>{value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110 shadow-lg ${colorClass}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
        <div className={`absolute -bottom-8 -left-8 w-32 h-32 rounded-full blur-3xl opacity-20 ${colorClass.split(' ')[0]} group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>
    </motion.div>
);

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [modalConfig, setModalConfig] = useState({ open: false, type: '', user: null });
    const addToast = useToastStore(state => state.addToast);
    const [formLoading, setFormLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role_id: '',
        location: '',
        bank_name: '',
        account_name: '',
        account_number: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                axiosClient.get(ENDPOINTS.USERS.ALL),
                axiosClient.get(ENDPOINTS.LOOKUPS.ROLES)
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data?.data || rolesRes.data);
        } catch (e) {
            console.error(e);
            addToast('حدث خطأ أثناء جلب بيانات المستخدمين', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(ENDPOINTS.USERS.DELETE(deleteTarget));
            addToast('تم إسقاط الحساب من النظام بنجاح', 'success');
            setDeleteTarget(null);
            fetchData();
        } catch (e) {
            addToast('لا يمكن حذف الحساب نظراً لارتباطه ببيانات نشطة', 'error');
        }
    };

    const handleOpenModal = (type, user = null) => {
        if (type === 'edit-role') {
            setForm({
                role_id: user.role_id || user.role?.role_id || '',
                bank_name: '',
                account_name: '',
                account_number: ''
            });
        } else {
            setForm({
                full_name: '',
                email: '',
                phone: '',
                password: '',
                role_id: '',
                location: '',
                bank_name: '',
                account_name: '',
                account_number: ''
            });
            setShowPassword(false);
        }
        setModalConfig({ open: true, type, user });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (modalConfig.type === 'add') {
                await axiosClient.post(ENDPOINTS.USERS.ALL, form);
                addToast('تم تنشيط الحساب الجديد بنجاح', 'success');
            } else if (modalConfig.type === 'edit-role') {
                await axiosClient.put(ENDPOINTS.USERS.UPDATE_ROLE(modalConfig.user.user_id), {
                    role_id: form.role_id,
                    bank_name: form.bank_name,
                    account_name: form.account_name,
                    account_number: form.account_number
                });
                addToast('تم تحديث صلاحيات الحساب المحددة', 'success');
            }
            setModalConfig({ open: false, type: '', user: null });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'واجه النظام مشكلة أثناء المعالجة', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const columns = [
        { 
            key: 'full_name', 
            header: 'الاسم', 
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="font-black text-gray-900 text-sm whitespace-nowrap">{row.full_name}</span>
                </div>
            ) 
        },
        { 
            key: 'email', 
            header: 'البريد الإلكتروني', 
            cell: (row) => (
                <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold" dir="ltr">{row.email}</span>
                </div>
            ) 
        },
        {
            key: 'role.role_name', 
            header: 'الصلاحية', 
            cell: (row) => {
                const roleName = row.role?.role_name || '—';
                let icon = <Shield className="w-3.5 h-3.5 mr-1.5" />;
                let styles = "bg-gray-100 text-gray-600 border-gray-200";

                if (roleName === 'Administrator' || roleName === 'SuperAdmin') {
                    icon = <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />;
                    styles = "bg-purple-50 text-purple-700 border-purple-200";
                } else if (roleName === 'Advertiser') {
                    icon = <Megaphone className="w-3.5 h-3.5 mr-1.5" />;
                    styles = "bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] border-[var(--color-dark-turquoise)]/20";
                } else if (roleName === 'ScreenOwner') {
                    icon = <MonitorSmartphone className="w-3.5 h-3.5 mr-1.5" />;
                    styles = "bg-amber-50 text-amber-700 border-amber-200";
                }

                return (
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-black border whitespace-nowrap ${styles}`}>
                        {icon}
                        {roleName}
                    </span>
                );
            }
        },
        { 
            key: 'phone', 
            header: 'رقم الهاتف', 
            cell: (row) => <span className="font-mono text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 whitespace-nowrap" dir="ltr">{row.phone || '—'}</span> 
        },
        { 
            key: 'location', 
            header: 'الموقع', 
            cell: (row) => (
                <div className="flex items-center gap-1.5 text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold whitespace-nowrap">{row.location || '—'}</span>
                </div>
            )
        },
        { 
            key: 'account_status', 
            header: 'حالة الحساب', 
            cell: (row) => <StatusBadge status={row.account_status || 'Active'} /> 
        },
        { 
            key: 'is_active', 
            header: 'نشط', 
            cell: (row) => <StatusBadge status={row.is_active ? 'Active' : 'Inactive'} /> 
        },
        {
            key: 'actions', 
            header: 'إجراءات', 
            cell: (row) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit-role', row) }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-gray-200 hover:border-blue-600 group" title="تعديل صلاحيات الحساب">
                        <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.user_id) }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 hover:border-rose-600 group" title="حذف الحساب">
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            )
        },
    ];

    const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[var(--color-dark-turquoise)]/10 focus:border-[var(--color-dark-turquoise)] transition-all text-right";
    const labelClass = "text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2 block px-1";

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active || u.account_status === 'Active').length,
        admin: users.filter(u => u.role?.role_name === 'Administrator' || u.role?.role_name === 'SuperAdmin').length,
        advertiser: users.filter(u => u.role?.role_name === 'Advertiser').length,
        owner: users.filter(u => u.role?.role_name === 'ScreenOwner').length,
    };

    return (
        <div className="space-y-6 pb-12 w-full max-w-[1600px] mx-auto font-sans" dir="rtl">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6 text-[var(--color-dark-turquoise)]" />
                        </div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">إدارة المستخدمين</span>
                    </span>
                }
                description="إدارة كافة الأدوار والهويات في المنظومة، التحكم بالصلاحيات والإيقاف الفوري."
                action={
                    <button onClick={() => handleOpenModal('add')}
                        className="bg-[var(--color-dark-turquoise)] hover:bg-[#0d4f5b] text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2.5 text-sm transition-all shadow-[0_8px_16px_-4px_rgba(20,93,106,0.25)] hover:shadow-[0_12px_24px_-4px_rgba(20,93,106,0.3)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none"></div>
                        <Plus className="w-5 h-5 text-[var(--color-gold)]" /> توثيق حساب جديد
                    </button>
                }
            />

            {!loading && (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6">
                    <StatCard title="إجمالي المسجلين" value={stats.total} icon={Users} colorClass="bg-blue-50 text-blue-600 shadow-blue-500/20" borderClass="border-blue-100 border-transparent hover:border-blue-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="حسابات نشطة" value={stats.active} icon={Activity} colorClass="bg-emerald-50 text-emerald-600 shadow-emerald-500/20" borderClass="border-emerald-100 border-transparent hover:border-emerald-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="أعضاء الإدارة" value={stats.admin} icon={ShieldCheck} colorClass="bg-purple-50 text-purple-600 shadow-purple-500/20" borderClass="border-purple-100 border-transparent hover:border-purple-500" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="كبار المعلنين" value={stats.advertiser} icon={Megaphone} colorClass="bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] shadow-[var(--color-dark-turquoise)]/20" borderClass="border-[var(--color-dark-turquoise)]/20 border-transparent hover:border-[var(--color-dark-turquoise)]" bgClass="bg-white" textClass="text-gray-900" />
                    <StatCard title="ملاك الشاشات" value={stats.owner} icon={MonitorSmartphone} colorClass="bg-amber-50 text-amber-600 shadow-amber-500/20" borderClass="border-amber-100 border-transparent hover:border-amber-500" bgClass="bg-white" textClass="text-gray-900" />
                </motion.div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
                <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50/20 shadow-inner min-h-[400px]">
                    <DataTable 
                        columns={columns} 
                        data={users} 
                        loading={loading} 
                        emptyMessage={
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
                                    <Users className="w-10 h-10 text-gray-300" />
                                </div>
                                <h4 className="text-xl font-black text-gray-900 mb-2">النظام قيد الانتظار</h4>
                                <p className="text-sm font-medium text-gray-500 max-w-[320px] mx-auto">
                                    يبدو أنه لا يوجـد مسجلين حالياً يطابقون هذه الصلاحيات، اضغط لإضافة مستخدم جديد.
                                </p>
                            </div>
                        } 
                    />
                </div>
            </div>

            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: '', user: null })} title={modalConfig.type === 'add' ? 'تسجيل عضوية النظام' : 'ترقية أو تخفيض الصلاحيات'} size="md">
                <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                    {modalConfig.type === 'add' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-100 p-3 rounded-xl">
                                <Info className="w-5 h-5 text-gray-400 shrink-0" />
                                <p className="text-xs font-bold text-gray-500 leading-relaxed">أدخل المعلومات الأساسية بعناية لضمان وصول الإشعارات والإيميلات الصحيحة.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>الاسم الكامل <span className="text-red-500">*</span></label>
                                    <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="مثال: يوسف المحمد" />
                                </div>
                                <div>
                                    <label className={labelClass}>الموقع / المحافظة</label>
                                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="الرياض، السعودية" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>البريد الإلكتروني <span className="text-red-500">*</span></label>
                                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} dir="ltr" placeholder="user@example.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>رقم الهاتف</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} dir="ltr" placeholder="+966xxxxxxxxx" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>تأمين الدخول (كلمة المرور) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="••••••••" dir={form.password ? 'ltr' : 'rtl'} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <h4 className="text-xs font-black text-gray-700">هيكل الصلاحيات الوصولية</h4>
                        </div>
                        <div>
                            <label className={labelClass}>تصنيف الصلاحية <span className="text-red-500">*</span></label>
                            <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className={inputClass}>
                                <option value="">-- اضغط لتعيين الدور الإداري --</option>
                                {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Conditional Bank Fields for Screen Owners */}
                    <AnimatePresence>
                        {roles.find(r => (r.role_id || r.id) == form.role_id)?.role_name === 'ScreenOwner' && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-4 mt-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Landmark className="w-4 h-4 text-amber-600" />
                                        <h4 className="text-xs font-black text-gray-700">السجل المالي لمالك الشاشة</h4>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-500 mb-4 px-1 leading-relaxed">يرجى تعبئة بيانات الحساب البنكي لتحويل الأرباح والمستحقات بدقة. يجب التأكد من صحة رقم الآيبان لتجنب رفض التحويلات الأوتوماتيكية.</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>البنك المصرفي</label>
                                            <div className="relative">
                                                <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className={`${inputClass} pl-10`} placeholder="البنك الأهلي، الراجحي..." />
                                                <Building className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>اسم المستفيد</label>
                                            <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} className={inputClass} placeholder="يطابق الاسم في الآيبان" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>رقم الحساب / الآيبان (IBAN)</label>
                                        <div className="relative">
                                            <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={`${inputClass} pl-10`} dir="ltr" placeholder="SA00000000000000000" />
                                            <CreditCard className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button type="submit" disabled={formLoading} className="w-full bg-gray-900 text-white font-black hover:bg-black py-4 rounded-xl shadow-lg shadow-gray-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                        {formLoading ? 'جاري المعالجة والأرشفة...' : (modalConfig.type === 'add' ? 'تأكيد التسجيل بالهوية' : 'تطبيق التحديث الجديد')}
                    </button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="إلغاء نشاط المستخدم وحذفه"
                message="هل أنت متأكد من إسقاط هذا الحساب من سجلات الوصول نهائياً؟ في حال حذفه لن يتمكن صاحبه من الدخول مستقبلاً وهذا الإجراء دائم."
                confirmText="نعم، موافق على الإلغاء"
            />
        </div>
    );
};

export default UsersPage;
