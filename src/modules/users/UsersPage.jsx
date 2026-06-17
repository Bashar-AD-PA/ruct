import React, { useState, useEffect } from 'react';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import Modal from '../../shared/components/Modal';
import useToastStore from '../../store/useToastStore';

const StatCard = ({ title, value, icon, colorClass }) => (
    <div className="bg-surface border border-outline-variant rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-shadow">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {icon}
            </span>
        </div>
        <div>
            <p className="font-caption text-caption text-on-surface-variant mb-1">{title}</p>
            <p className="font-title-lg text-title-lg text-on-surface">{value}</p>
        </div>
    </div>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const inputClass = "w-full bg-background border border-outline-variant rounded-lg py-2 px-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow text-right";
    const labelClass = "font-label-md text-label-md text-on-surface-variant mb-2 block";

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active || u.account_status === 'Active').length,
        admin: users.filter(u => u.role?.role_name === 'Administrator' || u.role?.role_name === 'SuperAdmin').length,
        advertiser: users.filter(u => u.role?.role_name === 'Advertiser').length,
        owner: users.filter(u => u.role?.role_name === 'ScreenOwner').length,
    };

    const filteredUsers = users.filter(u => 
        (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone || '').includes(searchTerm)
    );
    
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

    const handleExport = () => {
        if (filteredUsers.length === 0) {
            addToast('لا توجد بيانات للتصدير', 'error');
            return;
        }

        const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الموقع', 'حالة الحساب', 'الصلاحية'];
        
        const csvRows = filteredUsers.map(user => [
            user.full_name || '',
            user.email || '',
            user.phone || '',
            user.location || '',
            user.account_status === 'Active' || !user.account_status ? 'نشط' : 'غير نشط',
            user.role?.role_name || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderRoleBadge = (roleName) => {
        if (roleName === 'Administrator' || roleName === 'SuperAdmin') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error/10 text-error border border-error/20">SuperAdmin</span>;
        } else if (roleName === 'Advertiser') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-container/20 text-secondary border border-secondary/20">Advertiser</span>;
        } else if (roleName === 'ScreenOwner') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#a855f7]/10 text-[#9333ea] border border-[#a855f7]/20">ScreenOwner</span>;
        } else if (roleName === 'Accountant') {
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f97316]/10 text-[#ea580c] border border-[#f97316]/20">Accountant</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-outline-variant/30 text-on-surface-variant border border-outline-variant/50">{roleName || '—'}</span>;
    };

    return (
        <div className="flex flex-col gap-8">
            <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">إدارة المستخدمين</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant">إدارة وتحديث بيانات المستخدمين وصلاحياتهم في النظام</p>
                </div>
                <button onClick={() => handleOpenModal('add')} className="bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all">
                    <span className="material-symbols-outlined">add</span>
                    <span>توثيق حساب جديد</span>
                </button>
            </section>

            {!loading && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard title="إجمالي المسجلين" value={stats.total} icon="group" colorClass="bg-primary/10 text-primary" />
                    <StatCard title="حسابات نشطة" value={stats.active} icon="person_check" colorClass="bg-[#22c55e]/10 text-[#22c55e]" />
                    <StatCard title="أعضاء الإدارة" value={stats.admin} icon="admin_panel_settings" colorClass="bg-secondary-container/20 text-secondary" />
                    <StatCard title="كبار المعلنين" value={stats.advertiser} icon="campaign" colorClass="bg-[#eab308]/10 text-[#eab308]" />
                    <StatCard title="ملاك الشاشات" value={stats.owner} icon="monitor" colorClass="bg-[#a855f7]/10 text-[#a855f7]" />
                </section>
            )}

            <section className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface">
                    <div className="relative w-full sm:w-72">
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-background border border-outline-variant rounded-lg py-2 pr-10 pl-4 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-shadow" 
                            placeholder="البحث في المستخدمين..." 
                            type="text" 
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 bg-background border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors w-full sm:w-auto justify-center text-on-surface">
                            <span className="material-symbols-outlined">filter_list</span>
                            <span>تصفية</span>
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-background border border-outline-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-colors w-full sm:w-auto justify-center text-on-surface">
                            <span className="material-symbols-outlined">download</span>
                            <span>تصدير</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto relative min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center items-center absolute inset-0 bg-surface/50 z-10">
                            <div className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : paginatedUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center mb-4 border border-outline-variant">
                                <span className="material-symbols-outlined text-outline text-3xl">warning</span>
                            </div>
                            <h4 className="font-headline-md text-headline-md text-on-surface mb-2">النظام قيد الانتظار</h4>
                            <p className="font-body-md text-body-md text-on-surface-variant max-w-[320px] mx-auto">
                                لا توجد بيانات مسجلين لعرضها حالياً.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-background/80 border-b border-outline-variant font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                                <tr>
                                    <th className="py-4 px-6 font-medium text-right">الاسم</th>
                                    <th className="py-4 px-6 font-medium text-right">البريد الإلكتروني</th>
                                    <th className="py-4 px-6 font-medium text-right">الصلاحية</th>
                                    <th className="py-4 px-6 font-medium text-right">رقم الهاتف</th>
                                    <th className="py-4 px-6 font-medium text-right">الموقع</th>
                                    <th className="py-4 px-6 font-medium text-center">حالة الحساب</th>
                                    <th className="py-4 px-6 font-medium text-center">نشط</th>
                                    <th className="py-4 px-6 font-medium text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
                                {paginatedUsers.map((item) => (
                                    <tr key={item.user_id} className="hover:bg-surface-container-low/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                                    {item.full_name?.charAt(0) || <span className="material-symbols-outlined text-sm">person</span>}
                                                </div>
                                                <span className="font-medium">{item.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-on-surface-variant dir-ltr text-right">
                                            {item.email}
                                        </td>
                                        <td className="py-4 px-6">
                                            {renderRoleBadge(item.role?.role_name)}
                                        </td>
                                        <td className="py-4 px-6 dir-ltr text-right">
                                            {item.phone || '—'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1 text-on-surface-variant">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                <span>{item.location || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {item.account_status === 'Active' || !item.account_status ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#16a34a]">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                                                    نشط
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-outline-variant/30 text-on-surface-variant">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></span>
                                                    غير نشط
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input readOnly type="checkbox" className="sr-only peer" checked={item.is_active !== false} />
                                                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal('edit-role', item) }} className="text-on-surface-variant hover:text-primary transition-colors p-1" title="تعديل">
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(item.user_id) }} className="text-on-surface-variant hover:text-error transition-colors p-1" title="حذف">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredUsers.length > 0 && (
                    <div className="p-4 border-t border-outline-variant bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="font-caption text-caption text-on-surface-variant">
                            عرض <span className="font-medium text-on-surface">{(currentPage - 1) * itemsPerPage + 1}</span> إلى <span className="font-medium text-on-surface">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> من أصل <span className="font-medium text-on-surface">{filteredUsers.length}</span> مستخدم
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button 
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-md border font-medium text-sm transition-colors ${currentPage === page ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant bg-background text-on-surface hover:bg-surface-container-low'}`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-background text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <Modal isOpen={modalConfig.open} onClose={() => setModalConfig({ open: false, type: '', user: null })} title={modalConfig.type === 'add' ? 'تسجيل عضوية النظام' : 'تحديث الصلاحيات'} size="md">
                <form onSubmit={handleSubmit} className="space-y-6 mt-4" dir="rtl">
                    {modalConfig.type === 'add' && (
                        <div className="space-y-4">                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>الاسم الكامل <span className="text-error">*</span></label>
                                    <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} placeholder="الاسم" />
                                </div>
                                <div>
                                    <label className={labelClass}>الموقع / المحافظة</label>
                                    <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="الموقع" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>البريد الإلكتروني <span className="text-error">*</span></label>
                                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} dir="ltr" placeholder="user@example.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>رقم الهاتف</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} dir="ltr" placeholder="رقم الهاتف" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>كلمة المرور <span className="text-error">*</span></label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={`${inputClass} !pl-10`} placeholder="••••••••" dir={form.password ? 'ltr' : 'rtl'} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface outline-none flex items-center justify-center">
                                        <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                            <h4 className="font-label-md text-label-md">هيكل الصلاحيات الوصولية</h4>
                        </div>
                        <div>
                            <label className={labelClass}>تصنيف الصلاحية <span className="text-error">*</span></label>
                            <select required value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className={inputClass}>
                                <option value="">-- اضغط لتعيين الدور الإداري --</option>
                                {roles.map(r => <option key={r.role_id || r.id} value={r.role_id || r.id}>{r.role_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {roles.find(r => (r.role_id || r.id) == form.role_id)?.role_name === 'ScreenOwner' && (
                        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant space-y-4 mt-2">
                            <div className="flex items-center gap-2 mb-2 text-[#a855f7]">
                                <span className="material-symbols-outlined text-xl">account_balance</span>
                                <h4 className="font-label-md text-label-md">السجل المالي</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>البنك المصرفي</label>
                                    <input type="text" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>اسم المستفيد</label>
                                    <input type="text" value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>رقم الحساب / الآيبان (IBAN)</label>
                                <input type="text" value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} className={inputClass} dir="ltr" />
                            </div>
                        </div>
                    )}

                    <button type="submit" disabled={formLoading} className="w-full bg-primary text-on-primary font-label-md hover:bg-primary/90 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6">
                        {formLoading ? 'جاري المعالجة...' : 'تأكيد الحفظ'}
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
