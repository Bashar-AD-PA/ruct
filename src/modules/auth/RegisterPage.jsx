import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Lock, Eye, EyeOff, LayoutDashboard, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

const PremiumInput = ({ icon: Icon, englishLabel, arabicLabel, type = "text", value, onChange, isPassword, isObscure, onToggleObscure, required }) => {
    const isLtrField = type === 'email' || type === 'tel' || isPassword;
    
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[#111827]">
                    {arabicLabel} {required && <span className="text-red-500">*</span>}
                </label>
                <span className="text-xs text-[#6b7280] uppercase" dir="ltr">
                    {englishLabel} {required && '*'}
                </span>
            </div>
            <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#6b7280]">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <input
                    type={isPassword ? (isObscure ? 'password' : 'text') : type}
                    value={value}
                    onChange={onChange}
                    placeholder={arabicLabel}
                    className={`block w-full pl-3 pr-10 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] sm:text-sm text-[#111827] placeholder-[#6b7280] outline-none shadow-sm transition-colors bg-white ${isLtrField ? 'text-left' : 'text-right'}`}
                    dir={isLtrField ? 'ltr' : 'rtl'}
                    required={required}
                />
                {isPassword && (
                    <button 
                        type="button" 
                        onClick={onToggleObscure} 
                        tabIndex="-1"
                        className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer text-[#6b7280] hover:text-[#111827] focus:outline-none"
                    >
                        {isObscure ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                    </button>
                )}
            </div>
            {isPassword && (
                <div className="flex justify-between mt-1 text-xs text-[#6b7280]" dir="rtl">
                    <span>مطلوب</span>
                    <span>يجب أن تحتوي على 8 أحرف على الأقل</span>
                </div>
            )}
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
        if (!form.full_name.trim() || !form.email.trim() || !form.password) {
            addToast('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        setIsLoading(true);
        try {
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
        <div className="bg-[#f9f9ff] text-[#111827] min-h-screen antialiased flex items-center justify-center p-4 lg:p-0 font-sans" dir="rtl">
            {/* BEGIN: Main Layout Container */}
            <main className="bg-white lg:bg-transparent w-full max-w-[1400px] h-full lg:h-[90vh] flex flex-col lg:flex-row shadow-2xl lg:shadow-none rounded-2xl lg:rounded-none overflow-hidden xl:rounded-3xl xl:shadow-2xl">
                
                {/* BEGIN: Left Side - Form Container */}
                <section className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative order-2 lg:order-1 h-full overflow-y-auto">
                    <div className="w-full max-w-md space-y-8 my-auto py-8">
                        {/* Form Header */}
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold text-[#111827]">إنشاء حساب جديد</h1>
                            <p className="text-[#6b7280]">انضم إلى شبكة سبأ بوست لإدارة إعلاناتك بذكاء</p>
                        </div>
                        
                        {/* Registration Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <PremiumInput 
                                    icon={User}
                                    englishLabel="Full Name"
                                    arabicLabel="الاسم الكامل"
                                    value={form.full_name}
                                    onChange={(e) => handleChange(e, 'full_name')}
                                    required={true}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <PremiumInput 
                                    icon={MapPin}
                                    englishLabel="Location"
                                    arabicLabel="الموقع / المحافظة"
                                    value={form.location}
                                    onChange={(e) => handleChange(e, 'location')}
                                    required={false}
                                />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#1e4b5e] hover:bg-[#163a49] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] transition-colors disabled:opacity-75"
                                >
                                    <AnimatePresence mode="wait">
                                        {isLoading ? (
                                            <motion.div 
                                                key="loading"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-2"
                                            >
                                                <div className="w-4 h-4 border-[2px] border-white/30 border-t-white rounded-full animate-spin"></div>
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
                                </button>
                            </motion.div>
                        </form>

                        {/* Bottom Link */}
                        <div className="text-center pt-2 pb-8">
                            <p className="text-sm text-[#6b7280]">
                                لديك حساب بالفعل؟{' '}
                                <Link to="/login" className="font-semibold text-[#1e4b5e] hover:text-[#163a49] transition-colors">
                                    تسجيل الدخول
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
                {/* END: Left Side - Form Container */}

                {/* BEGIN: Right Side - Branding Panel */}
                <section className="hidden lg:flex w-1/2 bg-[#1e4b5e] text-white flex-col justify-between p-12 relative overflow-hidden order-1 lg:order-2 rounded-r-2xl lg:rounded-none xl:rounded-r-3xl h-full">
                    {/* Decorative Background Rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-[24rem] h-[24rem] rounded-full border border-white opacity-50 absolute"></div>
                        <div className="w-[30rem] h-[30rem] rounded-full border border-white opacity-30 absolute"></div>
                        <div className="w-[40rem] h-[40rem] rounded-full border border-white opacity-10 absolute"></div>
                    </div>

                    {/* Top Elements */}
                    <div className="flex justify-between items-start relative z-10 w-full mb-auto text-right" dir="rtl">
                        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] sm:text-xs tracking-wider uppercase backdrop-blur-sm border border-white/20 h-fit mt-1">
                            ENTERPRISE V2.0
                        </span>
                        <div className="flex flex-col items-center">
                            {/* Logo */}
                            <div className="mb-1">
                                <img src="/src/assets/images/Main_app_logo.png" alt="SabaPost Logo" className="w-[110px] h-auto object-contain brightness-0 invert" />
                            </div>
                        </div>
                    </div>

                    {/* Center Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center mt-12 mb-12">
                        {/* Central Icon/Illustration */}
                        <div className="mb-12 relative">
                            <div className="w-24 h-24 border-2 border-white/80 rounded-xl grid grid-cols-2 gap-2 p-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-white/5 backdrop-blur-sm">
                                <div className="border border-white/60 rounded-md bg-white/10"></div>
                                <div className="border border-white/60 rounded-md bg-white/10"></div>
                                <div className="border border-white/60 rounded-md bg-white/10"></div>
                                <div className="border border-white/60 rounded-md bg-white/10"></div>
                            </div>
                            {/* Floating Element 1 */}
                            <div className="absolute -top-6 -right-6 w-10 h-10 bg-white text-[#1e4b5e] rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            {/* Floating Element 2 */}
                            <div className="absolute -bottom-6 -left-8 w-12 h-12 bg-[#eab308] text-white rounded-full flex items-center justify-center shadow-lg transform -rotate-12 opacity-90">
                                <Zap className="w-6 h-6" />
                            </div>
                        </div>
                        
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} dir="rtl">
                            <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight drop-shadow-md">
                                انضم إلى شبكة<br/>
                                <span className="text-[#eab308]">الوكلاء والمعلنين</span>
                            </h2>
                            <p className="text-lg text-white/80 max-w-md mx-auto leading-relaxed font-medium">
                                ابدأ في إدارة شاشاتك الإعلانية أو إنشاء حملاتك بكل سهولة عبر منصة متخصصة تلبي كافة احتياجاتك.
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer Elements */}
                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center text-xs text-white/60 border-t border-white/10 pt-6 mt-auto">
                        <div className="flex space-x-6 space-x-reverse mt-4 sm:mt-0 font-medium" dir="rtl">
                            <Link to="#" className="hover:text-white transition-colors">شروط الاستخدام</Link>
                            <Link to="#" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
                        </div>
                        <p dir="ltr" className="tracking-wider">2026 SABAPOST SECURE ©</p>
                    </div>
                </section>
                {/* END: Right Side - Branding Panel */}
                
            </main>
        </div>
    );
};

export default RegisterPage;
