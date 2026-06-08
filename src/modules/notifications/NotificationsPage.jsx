import React, { useState, useEffect } from 'react';
import { 
    Bell, CheckCircle2, Trash2, CheckSquare, Sparkles, Inbox, BellRing, BellOff, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import { parseNotificationContent, getNotificationIconInfo } from './utils/notificationTranslator';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const addToast = useToastStore(state => state.addToast);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get(ENDPOINTS.NOTIFICATIONS.ALL);
            if (res.data?.success || (res.status >= 200 && res.status < 300)) {
                const fetchedNotifications = res.data.data || res.data || [];
                setNotifications(fetchedNotifications);
                
                const count = res.data.unread_count !== undefined 
                    ? res.data.unread_count 
                    : fetchedNotifications.filter(n => n.read_at === null || n.is_read === false || n.is_read === 'false').length;
                
                setUnreadCount(count);
            }
        } catch (error) {
            addToast('حدث خطأ أثناء جلب الإشعارات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
            setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 'true', read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            addToast('تعذر تحديث حالة الإشعار', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            await axiosClient.put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 'true', read_at: new Date().toISOString() })));
            setUnreadCount(0);
            addToast('تم تحديد جميع الإشعارات كمقروءة', 'success');
        } catch (error) {
            addToast('تعذر تحديث الإشعارات', 'error');
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axiosClient.delete(ENDPOINTS.NOTIFICATIONS.DELETE(id));
            setNotifications(prev => {
                const target = prev.find(n => n.notification_id === id);
                if (target && (target.read_at === null || target.is_read === false || target.is_read === 'false')) {
                    setUnreadCount(count => Math.max(0, count - 1));
                }
                return prev.filter(n => n.notification_id !== id);
            });
            addToast('تم حذف الإشعار بنجاح', 'success');
        } catch (error) {
            addToast('تعذر حذف الإشعار', 'error');
        }
    };

    const totalNotifications = notifications.length;
    const readNotifications = totalNotifications - unreadCount;

    return (
        <div className="space-y-8 max-w-5xl mx-auto font-sans pb-20" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-30 pt-6 pb-4 border-b border-gray-200/50 mb-8 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader 
                        title={
                            <span className="flex items-center gap-3">
                                <span className="bg-gradient-to-br from-[var(--color-dark-turquoise)] to-[#0c4c58] text-white p-2.5 rounded-xl shadow-lg ring-4 ring-[var(--color-dark-turquoise)]/10">
                                    <Bell className="w-6 h-6 shrink-0" />
                                </span>
                                <span className="text-3xl font-black tracking-tight text-slate-900">مركز الإشعارات</span>
                            </span>
                        }
                        description="متابعة جميع أنشطة النظام، التنبيهات، والتحديثات المالية والعملياتية."
                    />
                    
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm active:scale-95 group"
                        >
                            <CheckSquare className="w-5 h-5 text-[var(--color-dark-turquoise)] group-hover:scale-110 transition-transform" /> تحديد الكل كمقروء
                        </button>
                    )}
                </div>
            </div>

            {/* SUMMARY METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[100px] z-0"></div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 z-10 relative">
                        <Inbox className="w-6 h-6" />
                    </div>
                    <div className="z-10 relative">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">إجمالي الرسائل الإشعارية</p>
                        <h4 className="text-3xl font-black text-slate-800">{totalNotifications}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-[100px] z-0"></div>
                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center shrink-0 z-10 relative">
                        <BellRing className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                        )}
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </div>
                    <div className="z-10 relative">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">الرسائل الجديدة (غير مقروءة)</p>
                        <h4 className="text-3xl font-black text-red-500">{unreadCount}</h4>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[100px] z-0"></div>
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 z-10 relative">
                        <BellOff className="w-6 h-6" />
                    </div>
                    <div className="z-10 relative">
                        <p className="text-[11px] uppercase font-black text-slate-400 mb-1 tracking-wider">الرسائل المؤرشفة (مقروءة)</p>
                        <h4 className="text-3xl font-black text-slate-800">{readNotifications}</h4>
                    </div>
                </div>
            </div>

            {/* NOTIFICATIONS CONTENT */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 animate-pulse">
                            <div className="w-12 h-12 bg-slate-100 rounded-full shrink-0"></div>
                            <div className="flex-1 space-y-3 py-1">
                                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 py-20 px-8 text-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                        <Sparkles className="w-10 h-10 text-slate-300 absolute -top-2 -right-2 rotate-12" />
                        <Inbox className="w-12 h-12 text-[var(--color-dark-turquoise)] opacity-80" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">صندوق الوارد فارغ تماماً 🌟</h3>
                    <p className="text-slate-500 font-bold max-w-md mx-auto">أنت متصل تماماً ولا توجد إشعارات معلقة. يمكنك الاسترخاء الآن، وسنقوم بتنبيهك عند توفر أي جديد.</p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {notifications.map(notif => {
                            const isUnread = notif.read_at === null || notif.is_read === false || notif.is_read === 'false';
                            const { Icon, colorClass } = getNotificationIconInfo(notif.title);
                            
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    key={notif.notification_id} 
                                    className={`relative flex flex-col md:flex-row md:items-start p-5 rounded-2xl transition-all group overflow-hidden border ${
                                        isUnread 
                                        ? 'bg-white border-[var(--color-dark-turquoise)]/20 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.05)]' 
                                        : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-sm'
                                    }`}
                                >
                                    {isUnread && (
                                        <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-[var(--color-dark-turquoise)]" />
                                    )}

                                    <div className="flex-1 flex gap-5 items-start">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                            isUnread 
                                            ? `bg-gradient-to-br from-white to-slate-50 border ${colorClass.replace('bg-', 'border-').replace('/10', '/20')} ${colorClass.replace('bg-', 'text-').replace('/10', '')}` 
                                            : 'bg-white border border-slate-200 text-slate-400'
                                        }`}>
                                            <Icon className={`w-6 h-6 w-full ${isUnread ? colorClass : 'text-slate-400'}`} />
                                        </div>
                                        <div className="flex-1 pr-1 pb-2 md:pb-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <h4 className={`text-base font-black ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {parseNotificationContent(notif.title)}
                                                </h4>
                                                {isUnread && (
                                                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                        جديد
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-sm leading-relaxed mb-3 ${isUnread ? 'text-slate-700 font-bold' : 'text-slate-500 font-medium'}`}>
                                                {parseNotificationContent(notif.message)}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-100/80 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 min-w-max" dir="ltr">
                                                    {new Date(notif.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-center mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-slate-100 w-full md:w-auto shrink-0 justify-end">
                                        {isUnread ? (
                                            <button 
                                                onClick={() => markAsRead(notif.notification_id)}
                                                className="bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] hover:bg-[var(--color-dark-turquoise)] hover:text-white font-black text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> تحديد مقروء
                                            </button>
                                        ) : (
                                            <div className="hidden md:flex bg-slate-100 text-slate-400 font-black text-xs px-4 py-2 rounded-lg items-center gap-2 cursor-default">
                                                <CheckCircle2 className="w-4 h-4" /> مقروء
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => deleteNotification(notif.notification_id)}
                                            className="bg-slate-100 text-slate-500 hover:text-white hover:bg-red-500 font-black px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                                            title="حذف نهائي"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
