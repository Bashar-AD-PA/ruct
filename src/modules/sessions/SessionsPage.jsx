import React, { useState, useEffect, useCallback } from 'react';
import {
    Monitor, Smartphone, Tablet, Globe2, ShieldAlert, ShieldCheck,
    LogOut, RefreshCw, Clock, Wifi, AlertTriangle,
    CheckCircle, Activity, Lock, User, Calendar, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import PageHeader from '../../shared/components/PageHeader';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';
import usePermission, { ROLES } from '../../hooks/usePermission';

/* ─── Animation Variants ─── */
const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } }
};

/* ─── Helpers ─── */

/**
 * Infer a rough device type from the device_name field that Laravel stores
 * (this is the name passed at login time, e.g. "Chrome", "Mobile", "iPhone 13")
 */
const guessDeviceType = (deviceName = '') => {
    const n = deviceName.toLowerCase();
    if (/mobile|iphone|android|pixel|samsung|xiaomi|huawei|galaxy|oppo|vivo/.test(n)) return 'mobile';
    if (/ipad|tablet/.test(n)) return 'tablet';
    return 'desktop';
};

const DeviceIcon = ({ deviceName, size = 20, className = '' }) => {
    const type = guessDeviceType(deviceName);
    const props = { size, strokeWidth: 1.8, className };
    if (type === 'mobile')  return <Smartphone {...props} />;
    if (type === 'tablet')  return <Tablet {...props} />;
    return <Monitor {...props} />;
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Intl.DateTimeFormat('ar-YE', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1)  return 'منذ لحظات';
        if (mins < 60) return `منذ ${mins} دقيقة`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)  return `منذ ${hrs} ساعة`;
        return `منذ ${Math.floor(hrs / 24)} يوم`;
    } catch {
        return '';
    }
};

/* ─── Stat Card ─── */
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass }) => (
    <motion.div
        variants={itemVariants}
        className={`bg-white p-5 rounded-3xl border-2 ${borderClass} relative overflow-hidden group
                    shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)]
                    hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.09)] transition-all duration-300`}
    >
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900">{value ?? '—'}</h3>
                {subtitle && <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{subtitle}</p>}
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                            transition-transform duration-300 group-hover:scale-110 shadow-md ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className={`absolute -bottom-8 -left-8 w-28 h-28 rounded-full blur-3xl opacity-15
                        group-hover:scale-150 transition-transform duration-700 pointer-events-none ${colorClass}`} />
    </motion.div>
);

/* ─── Session Card ─── */
/**
 * Laravel returns per session:
 *   id           – token ID (used for revoke endpoint)
 *   device_name  – the name stored at login (e.g. "Chrome", "Unknown Device")
 *   user_name    – full name of the owning user (SuperAdmin sees all users)
 *   last_used_at – nullable timestamp
 *   created_at   – timestamp
 *   is_current   – boolean, true for the token that made this request
 */
const SessionCard = ({ session, isSuperAdmin, onRevoke }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.div
            variants={itemVariants}
            layout
            className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300
                        ${session.is_current
                    ? 'border-[var(--color-dark-turquoise)] shadow-[0_4px_24px_-4px_rgba(20,93,106,0.2)]'
                    : 'border-gray-100 hover:border-gray-200 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.1)]'
                }`}
        >
            {/* Current session top-bar */}
            {session.is_current && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-dark-turquoise)] to-[#1a8a9e]" />
            )}

            <div className="p-5">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Device avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                    ${session.is_current
                            ? 'bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)]'
                            : 'bg-gray-50 text-gray-500'}`}
                    >
                        <DeviceIcon deviceName={session.device_name} size={22} />
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-black text-gray-900 truncate">
                                {session.device_name || 'جهاز غير معروف'}
                            </span>
                            {session.is_current && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5
                                               rounded-full bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] whitespace-nowrap">
                                    <CheckCircle className="w-3 h-3" />
                                    الجلسة الحالية
                                </span>
                            )}
                        </div>
                        {/* Show user name only if SuperAdmin (seeing all sessions) */}
                        {isSuperAdmin && session.user_name && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <User className="w-3 h-3 text-gray-300 shrink-0" />
                                <span className="text-[10px] font-bold text-gray-400 truncate">{session.user_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions menu (non-current sessions only) */}
                    {!session.is_current && (
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                                           hover:bg-gray-100 hover:text-gray-700 transition-all"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                        transition={{ duration: 0.14 }}
                                        className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl
                                                   border border-gray-100 z-20 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => { setMenuOpen(false); onRevoke(session); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold
                                                       text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            إنهاء هذه الجلسة
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ── Timestamps ── */}
                <div className="space-y-1.5">
                    {session.last_used_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Activity className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <span className="font-bold">{timeAgo(session.last_used_at)}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-[10px]">{formatDateTime(session.last_used_at)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        <span className="text-[10px]">بدأت: {formatDateTime(session.created_at)}</span>
                    </div>
                </div>

                {/* ── Revoke button (visible on all screen sizes) ── */}
                {!session.is_current && (
                    <button
                        onClick={() => onRevoke(session)}
                        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
                                   text-rose-500 border border-rose-100 hover:bg-rose-50 hover:border-rose-200
                                   transition-all group"
                    >
                        <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        إنهاء الجلسة
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ════════════════════════════════════════
   Main Page
════════════════════════════════════════ */
const SessionsPage = () => {
    const [sessions, setSessions]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [revoking, setRevoking]         = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null); // { session, type: 'single'|'others' }

    const addToast        = useToastStore(state => state.addToast);
    const { roleName }    = usePermission();
    const isSuperAdmin    = roleName === ROLES.SUPER_ADMIN;

    /* ── Fetch ── */
    const fetchSessions = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLoading(true);
        try {
            const res  = await axiosClient.get(ENDPOINTS.SESSIONS.ALL);
            // API returns { success: true, data: [...] }
            const list = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data?.data)
                    ? res.data.data
                    : [];
            setSessions(list);
        } catch (err) {
            console.error('Sessions fetch error:', err);
            addToast('تعذّر جلب بيانات الجلسات', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [addToast]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    /* ── Revoke confirm ── */
    const handleRevokeConfirm = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            if (revokeTarget.type === 'others') {
                await axiosClient.delete(ENDPOINTS.SESSIONS.REVOKE_OTHERS);
                addToast('تم إنهاء جميع الجلسات الأخرى بنجاح', 'success');
            } else {
                // pass the token id (not session_id from user_sessions table)
                await axiosClient.delete(ENDPOINTS.SESSIONS.REVOKE(revokeTarget.session.id));
                addToast('تم إنهاء الجلسة المحددة بنجاح', 'success');
            }
            await fetchSessions(true);
        } catch (err) {
            addToast(err.response?.data?.message || 'فشل إنهاء الجلسة', 'error');
        } finally {
            setRevoking(false);
            setRevokeTarget(null);
        }
    };

    /* ── Derived data ── */
    const currentSession = sessions.find(s => s.is_current);
    const otherSessions  = sessions.filter(s => !s.is_current);

    /* ── Skeleton ── */
    const SkeletonCard = () => (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
            </div>
        </div>
    );

    /* ── Unique device types count ── */
    const deviceTypes = [...new Set(sessions.map(s => guessDeviceType(s.device_name)))].length;

    return (
        <div className="space-y-6 pb-12 w-full max-w-[1400px] mx-auto font-sans" dir="rtl">

            {/* ── Page Header ── */}
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[var(--color-dark-turquoise)]" />
                        </div>
                        <span className="text-2xl font-black text-gray-900 tracking-tight">إدارة الجلسات</span>
                    </span>
                }
                description={
                    isSuperAdmin
                        ? 'عرض ومراقبة جلسات جميع المستخدمين في النظام وإنهاء أي جلسة مشبوهة فوراً.'
                        : 'عرض ومراقبة أجهزتك المسجّلة وإنهاء أي جلسة غير معروفة بضغطة واحدة.'
                }
                action={
                    <div className="flex items-center gap-3">
                        {otherSessions.length > 0 && (
                            <button
                                onClick={() => setRevokeTarget({ type: 'others' })}
                                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold
                                           text-rose-600 border-2 border-rose-100 bg-rose-50
                                           hover:bg-rose-600 hover:text-white hover:border-rose-600
                                           transition-all shadow-sm hover:shadow-rose-500/20 hover:shadow-lg"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                إنهاء الجلسات الأخرى
                            </button>
                        )}
                        <button
                            onClick={() => fetchSessions(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold
                                       text-[var(--color-dark-turquoise)] border-2 border-[var(--color-dark-turquoise)]/20
                                       bg-[var(--color-dark-turquoise)]/5 hover:bg-[var(--color-dark-turquoise)]
                                       hover:text-white hover:border-[var(--color-dark-turquoise)]
                                       transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            تحديث
                        </button>
                    </div>
                }
            />

            {/* ── Stats ── */}
            {!loading && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                    <StatCard
                        title="إجمالي الجلسات"
                        value={sessions.length}
                        subtitle="جلسة نشطة في النظام"
                        icon={Wifi}
                        colorClass="bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)]"
                        borderClass="border-transparent hover:border-[var(--color-dark-turquoise)]/30"
                    />
                    <StatCard
                        title="جلسات أخرى"
                        value={otherSessions.length}
                        subtitle="من أجهزة مختلفة"
                        icon={Globe2}
                        colorClass="bg-amber-50 text-amber-600"
                        borderClass="border-transparent hover:border-amber-200"
                    />
                    <StatCard
                        title="أنواع الأجهزة"
                        value={deviceTypes}
                        subtitle="نوع جهاز تم رصده"
                        icon={Monitor}
                        colorClass="bg-purple-50 text-purple-600"
                        borderClass="border-transparent hover:border-purple-200"
                    />
                </motion.div>
            )}

            {/* ── Security Banner ── */}
            <AnimatePresence>
                {!loading && otherSessions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl"
                    >
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-black text-amber-800">تنبيه أمني</p>
                            <p className="text-xs text-amber-700 font-medium mt-0.5 leading-relaxed">
                                {isSuperAdmin
                                    ? <>يوجد <span className="font-black">{otherSessions.length}</span> جلسة نشطة في النظام من أجهزة أخرى. راجعها وأنهِ أي جلسة مشبوهة.</>
                                    : <>لديك <span className="font-black">{otherSessions.length}</span> جلسة نشطة من أجهزة أخرى. إذا لم تكن أنت، أنهِها فوراً وغيّر كلمة المرور.</>
                                }
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Sessions Grid ── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
                        <Lock className="w-9 h-9 text-gray-300" />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">لا توجد جلسات نشطة</h4>
                    <p className="text-sm font-medium text-gray-500 max-w-xs text-center leading-relaxed">
                        لم يتم العثور على أي جلسات نشطة حالياً
                    </p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    {/* Current Session */}
                    {currentSession && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse block" />
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    الجلسة الحالية
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <SessionCard
                                    session={currentSession}
                                    isSuperAdmin={isSuperAdmin}
                                    onRevoke={() => {}}
                                />
                            </div>
                        </section>
                    )}

                    {/* Other Sessions */}
                    {otherSessions.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-gray-300 block" />
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    جلسات أخرى ({otherSessions.length})
                                </h3>
                            </div>
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                >
                                    {otherSessions.map(s => (
                                        <SessionCard
                                            key={s.id}
                                            session={s}
                                            isSuperAdmin={isSuperAdmin}
                                            onRevoke={(sess) => setRevokeTarget({ session: sess, type: 'single' })}
                                        />
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </section>
                    )}
                </motion.div>
            )}

            {/* ── Confirm Dialog ── */}
            <ConfirmDialog
                isOpen={!!revokeTarget}
                onClose={() => !revoking && setRevokeTarget(null)}
                onConfirm={handleRevokeConfirm}
                title={
                    revokeTarget?.type === 'others'
                        ? 'إنهاء جميع الجلسات الأخرى'
                        : 'إنهاء الجلسة المحددة'
                }
                message={
                    revokeTarget?.type === 'others'
                        ? 'سيتم إنهاء جميع الجلسات الأخرى فوراً وستحتاج إلى إعادة تسجيل الدخول عليها. هل أنت متأكد؟'
                        : `سيتم إنهاء جلسة "${revokeTarget?.session?.device_name || 'هذا الجهاز'}" فوراً. هل تريد المتابعة؟`
                }
                confirmText={revokeTarget?.type === 'others' ? 'نعم، إنهاء الكل' : 'نعم، إنهاء الجلسة'}
            />
        </div>
    );
};

export default SessionsPage;
