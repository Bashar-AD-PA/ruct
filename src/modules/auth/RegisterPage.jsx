import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, LayoutDashboard, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

const PremiumInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure, required }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between items-end px-1">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    {englishLabel} {required && <span className="text-red-400">*</span>}
                </span>
                <span className="text-xs font-bold text-gray-700">
                    {arabicLabel} {required && <span className="text-red-400">*</span>}
                </span>
            </div>
            <div 
                className={`flex items-center w-full bg-white/70 backdrop-blur-md border-[1.5px] rounded-xl overflow-hidden transition-all duration-300 ${
                    isFocused ? 'border-[var(--color-dark-turquoise)] shadow-[0_0_0_4px_rgba(20,93,106,0.1)] bg-white' : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
            >
                <div className={`p-3.5 flex items-center justify-center transition-colors ${isFocused ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                
                <input
                    type={isPassword ? (isObscure ? 'password' : 'text') : type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={arabicLabel}
                    className="flex-1 bg-transparent border-none outline-none text-right px-2 py-3 text-sm font-bold text-gray-800 placeholder-gray-300 w-full min-w-0"
                    dir="rtl"
                    required={required}
                />

                {isPassword && (
                    <button 
                        type="button" 
                        onClick={onToggleObscure} 
                        tabIndex="-1"
                        className="p-3 text-gray-400 hover:text-[var(--color-dark-turquoise)] transition-colors focus:outline-none"
                    >
                        {isObscure ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);

    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isObscure, setIsObscure] = useState(true);

    const handleChange = (e, field) => {
        setForm({ ...form, [field]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        // Preserved exact business logic
        if (!form.full_name.trim() || !form.email.trim() || !form.password) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        setIsLoading(true);
        try {
            // Preserved exact endpoint and form payload structure
            const res = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, form);
            if (res.data.success || res.status === 201) {
                addToast('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
                navigate('/login');
            } else {
                addToast(res.data.message || 'فشل إنشاء الحساب', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'تعذر الاتصال بالخادم. يرجى التأكد من البيانات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-dark-turquoise)]/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none hidden md:block"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[var(--color-gold)]/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none hidden md:block"></div>

            {/* Main Content Container */}
            <div className="w-full flex-1 flex flex-col lg:flex-row relative z-10 p-4 md:p-8 lg:p-12 items-center justify-center lg:items-stretch lg:justify-between gap-8 max-w-[1600px] mx-auto min-h-[calc(100vh-2rem)]">
                
                {/* Right Side: Auth Form (Will appear on right in LTR, but context is RTL) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full lg:w-[45%] xl:w-[40%] flex justify-center items-center py-2 lg:py-4 h-[calc(100vh-2rem)] lg:h-auto"
                >
                    <div className="w-full max-w-[440px] bg-white/60 backdrop-blur-xl border border-white/80 p-5 md:p-8 lg:p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative flex flex-col my-auto max-h-full overflow-y-auto custom-scrollbar">
                        
                        {/* Decorative line top */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-dark-turquoise)] to-transparent opacity-50"></div>

                        {/* Mobile Logo Logo */}
                        <div className="flex lg:hidden justify-center mb-4 md:mb-6 mt-2 shrink-0">
                            <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[100px] h-auto object-contain" />
                        </div>

                        {/* Welcome Texts */}
                        <div className="text-center md:text-right mb-6 shrink-0">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 mb-1 lg:mb-2 tracking-tight" dir="rtl">
                                إنشاء حساب جديد
                            </h1>
                            <p className="text-xs md:text-sm font-bold text-gray-500 tracking-wide" dir="rtl">
                                انضم إلى شبكة سبأ بوست لإدارة إعلاناتك بذكاء
                            </p>
                        </div>

                        <form onSubmit={handleRegister} className="flex flex-col gap-3.5 relative z-10">
                            {/* Inputs */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="shrink-0">
                                <PremiumInput 
                                    icon={User}
                                    englishLabel="Full Name"
                                    arabicLabel="الاسم الكامل"
                                    value={form.full_name}
                                    onChange={(e) => handleChange(e, 'full_name')}
                                    required={true}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="shrink-0">
                                <PremiumInput 
                                    icon={Mail}
                                    englishLabel="Email Address"
                                    arabicLabel="البريد الإلكتروني"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleChange(e, 'email')}
                                    required={true}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="shrink-0">
                                <PremiumInput 
                                    icon={Phone}
                                    englishLabel="Phone Number"
                                    arabicLabel="رقم الجوال"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => handleChange(e, 'phone')}
                                    required={false}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="shrink-0">
                                <PremiumInput 
                                    icon={MapPin}
                                    englishLabel="Location"
                                    arabicLabel="الموقع / المحافظة"
                                    value={form.location}
                                    onChange={(e) => handleChange(e, 'location')}
                                    required={false}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="shrink-0">
                                <PremiumInput 
                                    icon={Lock}
                                    englishLabel="Password"
                                    arabicLabel="كلمة المرور"
                                    value={form.password}
                                    onChange={(e) => handleChange(e, 'password')}
                                    isPassword={true}
                                    isObscure={isObscure}
                                    onToggleObscure={() => setIsObscure(!isObscure)}
                                    required={true}
                                />
                                <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400 px-1" dir="rtl">
                                    <span>يجب أن تحتوي على 8 أحرف على الأقل</span>
                                    <span>مطلوب</span>
                                </div>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                type="submit" 
                                disabled={isLoading}
                                className="mt-3 w-full shrink-0 bg-[var(--color-dark-turquoise)] hover:bg-[#104d58] text-white py-3.5 md:py-4 rounded-xl text-sm md:text-base font-black flex justify-center items-center gap-2 transition-all disabled:opacity-75 relative overflow-hidden group shadow-[0_8px_16px_rgba(20,93,106,0.2)] hover:shadow-[0_12px_24px_rgba(20,93,106,0.3)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(20,93,106,0.2)]"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                                
                                <AnimatePresence mode="wait">
                                    {isLoading ? (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                            dir="rtl"
                                        >
                                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>جاري التسجيل...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span 
                                            key="active"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            إنشاء حساب
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="flex items-center my-4 md:my-5 shrink-0"
                        >
                            <div className="flex-1 border-t border-gray-200"></div>
                            <div className="px-3 text-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 px-2 rounded">أو عبر</span>
                            </div>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </motion.div>

                        {/* Dummy Social Logins - Coming Soon */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="flex flex-col gap-3 relative group/social shrink-0 pb-4 md:pb-6"
                        >
                            {/* Coming Soon Overlay */}
                            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/social:opacity-100 transition-opacity rounded-xl">
                                <span className="bg-gray-900 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">قريباً (Coming Soon)</span>
                            </div>

                            <div className="flex justify-center gap-3">
                                <button type="button" className="flex-1 bg-white border border-gray-200 py-2.5 md:py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-600 shadow-sm opacity-60 text-sm">
                                    <span className="font-serif font-bold text-[16px] md:text-[18px] text-gray-800">G</span> Google
                                </button>
                                <button type="button" className="flex-1 bg-gray-900 border border-gray-900 py-2.5 md:py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-sm opacity-60 text-sm">
                                    <span className="text-[18px] md:text-[20px] pb-1"></span> Apple
                                </button>
                            </div>
                        </motion.div>

                        {/* Sticky Sign In Link at the bottom of the scroll container to ensure it's visible */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="mt-auto pt-4 text-center shrink-0 border-t border-gray-100"
                        >
                            <p className="text-xs md:text-sm font-bold text-gray-500 flex justify-center items-center gap-1.5 flex-row-reverse">
                                <span>لديك حساب بالفعل؟</span>
                                <Link to="/login" className="text-[var(--color-dark-turquoise)] hover:text-[#007b8f] hover:underline transition-all">
                                    تسجيل الدخول
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Left Side: Modern SaaS Visuals (Hidden on Mobile) */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="hidden lg:flex w-[55%] xl:w-[60%] bg-[var(--color-dark-turquoise)] rounded-[2.5rem] relative flex-col items-center justify-center p-12 overflow-hidden shadow-2xl"
                >
                    {/* Background Pattern / Shapes inside card */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[var(--color-gold)]/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Logo Section */}
                    <div className="absolute top-12 left-12 right-12 z-10 flex justify-between items-start" dir="rtl">
                        <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[180px] h-auto object-contain brightness-0 invert" />
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                            <span className="text-white text-xs font-bold tracking-widest shadow-sm">ENTERPRISE V2.0</span>
                        </div>
                    </div>

                    {/* Central Animated Graphic */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-12 w-full max-w-xl text-center">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="relative w-72 h-72"
                        >
                            {/* Inner Glowing Orb */}
                            <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                                <LayoutDashboard className="w-24 h-24 text-white drop-shadow-2xl" strokeWidth={1.5} />
                            </div>
                            
                            {/* Orbiting Dashboard Rings */}
                            <div className="absolute inset-0 border-[1.5px] border-white/10 rounded-full animate-[spin_12s_linear_infinite]">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[var(--color-gold)] rounded-xl rotate-45 shadow-[0_0_20px_rgba(196,160,82,0.4)] flex items-center justify-center">
                                    <div className="w-full h-full -rotate-45 flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-white drop-shadow-md" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -inset-8 border border-white/5 rounded-full animate-[spin_18s_linear_infinite_reverse]">
                                <div className="absolute bottom-6 right-6 w-10 h-10 bg-white rounded-full shadow-[0_0_25px_rgba(255,255,255,0.4)] flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-[var(--color-dark-turquoise)]" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4"
                            dir="rtl"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
                                انضم إلى شبكة <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-yellow-200">الوكلاء والمعلنين</span>
                            </h2>
                            <p className="text-white/80 text-base leading-relaxed max-w-lg mx-auto font-medium">
                                ابدأ في إدارة شاشاتك الإعلانية أو إنشاء حملاتك بكل سهولة عبر منصة مخصصة تلبي كافة احتياجاتك.
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer Links */}
                    <div className="absolute bottom-12 inset-x-12 z-10 flex justify-between items-center text-white/50 text-xs font-bold" dir="rtl">
                        <div className="flex gap-6">
                            <span className="hover:text-white cursor-pointer transition-colors hover:underline">سياسة الخصوصية</span>
                            <span className="hover:text-white cursor-pointer transition-colors hover:underline">شروط الاستخدام</span>
                        </div>
                        <p className="tracking-wider">© {new Date().getFullYear()} SABAPOST SECURE</p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default RegisterPage;
