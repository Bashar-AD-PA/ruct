import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, MonitorPlay, Zap, BarChart3, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useAuthStore from '../../store/useAuthStore';
import useToastStore from '../../store/useToastStore';

const PremiumInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{englishLabel}</span>
                <span className="text-sm font-bold text-gray-700">{arabicLabel}</span>
            </div>
            <div 
                className={`flex items-center w-full bg-white/70 backdrop-blur-md border-[1.5px] rounded-xl overflow-hidden transition-all duration-300 ${
                    isFocused ? 'border-[var(--color-dark-turquoise)] shadow-[0_0_0_4px_rgba(20,93,106,0.1)] bg-white' : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                }`}
            >
                <div className={`p-3.5 flex items-center justify-center transition-colors ${isFocused ? 'text-[var(--color-dark-turquoise)]' : 'text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                
                <input
                    type={isPassword ? (isObscure ? 'password' : 'text') : type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={arabicLabel}
                    className="flex-1 bg-transparent border-none outline-none text-right px-2 py-3.5 text-sm font-bold text-gray-800 placeholder-gray-300 w-full"
                    dir="rtl"
                    required
                />

                {isPassword && (
                    <button 
                        type="button" 
                        onClick={onToggleObscure} 
                        tabIndex="-1"
                        className="p-3.5 text-gray-400 hover:text-[var(--color-dark-turquoise)] transition-colors focus:outline-none"
                    >
                        {isObscure ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore(state => state.login);
    const addToast = useToastStore(state => state.addToast);

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isObscure, setIsObscure] = useState(true);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!loginId.trim() || !password) {
            addToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, {
                login_id: loginId.trim(),
                password: password,
                device_name: 'Web Browser'
            });

            if (res.data.token) {
                const { token, user } = res.data;
                login(user, token);
                addToast(`مرحباً بك مجدداً، ${user.full_name}! 👋`, 'success');
                navigate('/dashboard');
            } else {
                addToast(res.data.message || 'فشل تسجيل الدخول', 'error');
            }
        } catch (error) {
            addToast(error.response?.data?.message || 'بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 relative overflow-hidden font-sans">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[var(--color-dark-turquoise)]/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[var(--color-gold)]/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>

            {/* Main Content Container */}
            <div className="w-full flex-1 flex flex-col lg:flex-row relative z-10 p-4 md:p-8 lg:p-12 items-center justify-center lg:items-stretch lg:justify-between gap-8 max-w-[1600px] mx-auto">
                
                {/* Right Side: Auth Form (Will appear on right in LTR, but RTL shifts it appropriately. Handled with Flex row vs flex-col) */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full lg:w-[45%] xl:w-[40%] flex justify-center items-center"
                >
                    <div className="w-full max-w-[440px] bg-white/60 backdrop-blur-xl border border-white/80 p-8 md:p-10 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                        
                        {/* Decorative line top */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-dark-turquoise)] to-transparent opacity-50"></div>

                        {/* Mobile Logo Logo */}
                        <div className="flex lg:hidden justify-center mb-8">
                            <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[120px] h-auto object-contain" />
                        </div>

                        {/* Welcome Texts */}
                        <div className="text-center md:text-right mb-8">
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 tracking-tight" dir="rtl">
                                تسجيل الدخول
                            </h1>
                            <p className="text-sm font-bold text-gray-500 tracking-wide" dir="rtl">
                                مرحباً بك مجدداً في منصة سبأ بوست
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
                            {/* Inputs */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <PremiumInput 
                                    icon={User}
                                    englishLabel="Email or Phone"
                                    arabicLabel="البريد الإلكتروني أو رقم الهاتف"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <PremiumInput 
                                    icon={Lock}
                                    englishLabel="Password"
                                    arabicLabel="كلمة المرور"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    isPassword={true}
                                    isObscure={isObscure}
                                    onToggleObscure={() => setIsObscure(!isObscure)}
                                />
                            </motion.div>

                            {/* Helpers: Remember Me & Forgot Password */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex justify-between items-center px-1"
                                dir="rtl"
                            >
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                        rememberMe ? 'bg-[var(--color-dark-turquoise)] border-[var(--color-dark-turquoise)] text-white' : 'bg-transparent border-gray-300 group-hover:border-[var(--color-dark-turquoise)] text-transparent'
                                    }`}>
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={rememberMe} 
                                        onChange={() => setRememberMe(!rememberMe)} 
                                    />
                                    <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">تذكرني</span>
                                </label>

                                <Link to="/forgot-password" className="text-xs font-bold text-[var(--color-dark-turquoise)] hover:text-[#007b8f] hover:underline transition-all">
                                    هل نسيت كلمة المرور؟
                                </Link>
                            </motion.div>

                            {/* Submit Auth Button */}
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                type="submit" 
                                disabled={isLoading}
                                className="mt-4 w-full bg-[var(--color-dark-turquoise)] hover:bg-[#104d58] text-white py-4 rounded-xl text-base font-black flex justify-center items-center gap-2 transition-all disabled:opacity-75 relative overflow-hidden group shadow-[0_8px_16px_rgba(20,93,106,0.2)] hover:shadow-[0_12px_24px_rgba(20,93,106,0.3)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-[0_8px_16px_rgba(20,93,106,0.2)]"
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
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>جاري المصادقة...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.span 
                                            key="active"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            تسجيل الدخول
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        </form>

                        {/* Divider */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center my-6"
                        >
                            <div className="flex-1 border-t border-gray-200"></div>
                            <div className="px-4 text-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 px-2 rounded">أو عبر</span>
                            </div>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </motion.div>

                        {/* Dummy Social Logins - Coming Soon */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="flex flex-col gap-3 relative group/social"
                        >
                            {/* Coming Soon Overlay */}
                            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover/social:opacity-100 transition-opacity rounded-xl">
                                <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">قريباً (Coming Soon)</span>
                            </div>

                            <div className="flex justify-center gap-3">
                                <button type="button" className="flex-1 bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-600 shadow-sm opacity-60">
                                    <span className="font-serif font-bold text-[18px] text-gray-800">G</span> Google
                                </button>
                                <button type="button" className="flex-1 bg-gray-900 border border-gray-900 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-sm opacity-60">
                                    <span className="text-[20px] pb-1"></span> Apple
                                </button>
                            </div>
                        </motion.div>

                        {/* Sign Up Link */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="mt-8 text-center"
                        >
                            <p className="text-sm font-bold text-gray-500 flex justify-center items-center gap-1.5 flex-row-reverse">
                                <span>ليس لديك حساب؟</span>
                                <Link to="/register" className="text-[var(--color-dark-turquoise)] hover:text-[#007b8f] hover:underline transition-all">
                                    أنشئ حساباً جديداً
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
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-12 w-full max-w-xl">
                        
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="relative w-72 h-72"
                        >
                            {/* Inner Glowing Orb */}
                            <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                                <MonitorPlay className="w-24 h-24 text-white drop-shadow-2xl" strokeWidth={1.5} />
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
                            className="text-center space-y-5"
                            dir="rtl"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
                                أدر شاشاتك الذكية <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-yellow-200">بكل احترافية</span>
                            </h2>
                            <p className="text-white/80 text-base leading-relaxed max-w-lg mx-auto font-medium">
                                نظام السبورة الذكية (Digital Signage) الأول. راقب أداء حملاتك، وتحكم بالمحتوى، وتفاعل مع عملائك في الوقت الفعلي بأمان وسرعة.
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

export default LoginPage;