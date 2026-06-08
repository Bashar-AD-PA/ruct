import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, ArrowRight, Monitor, CheckSquare, Info, Calendar, Clock, DollarSign, 
    Image as ImageIcon, FileText, CheckCircle2, ChevronDown, Layers, Crosshair, 
    MapPin, Calculator, ShieldCheck, Activity, ChevronLeft, Flag, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';
import PageHeader from '../../shared/components/PageHeader';
import ScreenAvailabilityModal from './components/ScreenAvailabilityModal';
import usePermission from '../../hooks/usePermission';

const CreateAdPage = () => {
    const navigate = useNavigate();
    const addToast = useToastStore(state => state.addToast);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [screens, setScreens] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedScreens, setSelectedScreens] = useState([]);
    const [availabilityScreen, setAvailabilityScreen] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    const [form, setForm] = useState({
        title: '', category_id: '', duration: '', start_date: '', end_date: '',
        target_start_time: '', target_end_time: '',
        interval_minutes: '', total_cost: '', package_name: '', file: null, receipt: null,
        advertiser_id: ''
    });
    const [calculatedCost, setCalculatedCost] = useState(null);
    const [costDetails, setCostDetails] = useState(null);
    const [costLoading, setCostLoading] = useState(false);
    const [frequencyPackages, setFrequencyPackages] = useState([]);
    const [advertisers, setAdvertisers] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const { can } = usePermission();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [screensRes, categoriesRes, freqRes, advRes] = await Promise.all([
                    axiosClient.get(ENDPOINTS.SCREENS.ALL),
                    axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES),
                    axiosClient.get(ENDPOINTS.FREQUENCY_PACKAGES.ALL),
                    can('manage_all') ? axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('Advertiser')) : Promise.resolve({ data: [] })
                ]);
                setScreens(screensRes.data || []);
                setCategories(categoriesRes.data || []);
                setFrequencyPackages(freqRes.data?.data || freqRes.data || []);
                setAdvertisers(advRes.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (file && file.size > 50 * 1024 * 1024) {
            addToast('عذراً، حجم الملف يتجاوز الحد الأقصى المسموح به (50 ميجابايت).', 'error');
            e.target.value = null;
            return;
        }

        setForm(p => ({ ...p, file }));
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    };

    const toggleScreen = (screenId) => {
        setSelectedScreens(prev =>
            prev.includes(screenId) ? prev.filter(id => id !== screenId) : [...prev, screenId]
        );
        if (calculatedCost !== null) {
            setCalculatedCost(null);
            setCostDetails(null);
            setForm(p => ({ ...p, total_cost: '' }));
        }
    };

    const handleCalculateCost = async () => {
        if (!form.category_id || selectedScreens.length === 0 || !form.start_date || !form.end_date || !form.interval_minutes) {
            addToast('يرجى التأكد من تعبئة: التصنيف، الشاشات، جدول العرض التاريخي، وباقة التكرار قبل حاسبة التكلفة', 'warning');
            return;
        }
        setCostLoading(true);
        try {
            const payload = {
                category_id: form.category_id,
                screen_ids: selectedScreens,
                start_date: form.start_date,
                end_date: form.end_date,
                interval_minutes: form.interval_minutes
            };
            if (form.target_start_time) payload.target_start_time = form.target_start_time;
            if (form.target_end_time) payload.target_end_time = form.target_end_time;

            const res = await axiosClient.post(ENDPOINTS.ADS.CALCULATE_COST, payload);
            const data = res.data.data;
            setCalculatedCost(data.total_cost);
            setCostDetails(data);
            setForm(p => ({ ...p, total_cost: data.total_cost }));
            addToast('تم استخراج التسعيرة المستهدفة بنجاح', 'success');
        } catch (e) {
            addToast(e.response?.data?.message || 'فشلت عملية تقييم التكلفة مالياً', 'error');
        } finally {
            setCostLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedScreens.length === 0) {
            addToast('عملية مرفوضة: يجب اسناد الحملة إلى شاشة عرض في قائمة الأهداف (الخطوة 4)', 'warning');
            return;
        }
        if (calculatedCost === null) {
            addToast('خطوة مفقودة: يرجى تنفيذ حاسبة التكلفة قبل اعتماد التقديم النهائي', 'warning');
            return;
        }

        setLoading(true);
        setUploadProgress(0);
        const formData = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            if (val !== '' && val !== null) {
                if (['duration', 'interval_minutes', 'total_cost'].includes(key)) {
                    formData.append(key, Number(val));
                } else {
                    formData.append(key, val);
                }
            }
        });
        selectedScreens.forEach(id => formData.append('screen_ids[]', id));

        try {
            await axiosClient.post(ENDPOINTS.ADS.CREATE, formData, {
                timeout: 180000, 
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            addToast('تمت الأرشفة بنجاح، ملف الحملة الآن قيد الانتظار والمعالجة.', 'success');
            navigate('/dashboard/ads');
        } catch (e) {
            console.error('تفاصيل الخطأ القادم من الباك إند:', e.response?.data);
            const detailedErrors = e.response?.data?.errors;
            if (detailedErrors && typeof detailedErrors === 'object') {
                const firstError = Object.values(detailedErrors)[0]?.[0];
                if (firstError) {
                    addToast(firstError, 'error');
                    setLoading(false);
                    setUploadProgress(0);
                    return;
                }
            }
            addToast(e.response?.data?.message || 'تعرقل رفع الحملة، يرجى المحاولة بوقت لاحق.', 'error');
        } finally { 
            setLoading(false); 
        }
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-dark-turquoise)] focus:border-transparent transition-all";
    const labelClass = "text-[12px] font-black text-slate-700 uppercase tracking-wider mb-2 block px-1";

    const steps = [
        { id: 1, title: 'المعلومات الأساسية', icon: Info, subtitle: 'التعريف والتصنيف' },
        { id: 2, title: 'الجدولة والتكرار', icon: Calendar, subtitle: 'التاريخ وكثافة البث' },
        { id: 3, title: 'الاستهداف المكاني', icon: MapPin, subtitle: 'تحديد الشاشات' },
        { id: 4, title: 'المحتوى المرئي', icon: ImageIcon, subtitle: 'رفع الملفات' },
        { id: 5, title: 'التسعير والاعتماد', icon: Calculator, subtitle: 'مراجعة ختامية' }
    ];

    const nextStep = () => {
        if (currentStep < 5) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const isStepDone = (stepNum) => currentStep > stepNum;
    const isStepCurrent = (stepNum) => currentStep === stepNum;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans" dir="rtl">
            <div className="sticky top-0 bg-[#f8fafc]/90 z-30 pt-4 pb-4 border-b border-gray-200/50 mb-8 backdrop-blur-xl">
                <button onClick={() => navigate('/dashboard/ads')} className="text-gray-500 hover:text-gray-900 text-sm font-black flex items-center gap-1.5 mb-3 transition-colors px-1">
                    <ArrowRight className="w-4 h-4 rotate-180" /> الرجوع للإدارة
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title={
                            <span className="flex items-center gap-3">
                                <span className="bg-gradient-to-br from-[var(--color-dark-turquoise)] to-[#0c4c58] text-white p-2.5 rounded-xl shadow-lg ring-4 ring-[var(--color-dark-turquoise)]/10">
                                    <Layers className="w-6 h-6 shrink-0" />
                                </span>
                                <span className="text-3xl font-black tracking-tight text-slate-900">إنشاء حملة احترافية</span>
                            </span>
                        }
                        description="بناء وتخصيص حملتك الإعلانية باستهداف ذكي ومحاكي تسعير متقدم مدمج."
                    />
                    
                    {/* Compact Status Indicator for high-level insight */}
                    <div className="flex gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-end justify-center shadow-sm">
                            <span className="text-[10px] uppercase font-black text-slate-400">التكلفة التقديرية</span>
                            <span className="text-lg font-black text-[var(--color-dark-turquoise)] font-mono">{calculatedCost ? `$${calculatedCost.toFixed(2)}` : '---'}</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex flex-col items-end justify-center shadow-sm">
                            <span className="text-[10px] uppercase font-black text-slate-400">تغطية الشاشات</span>
                            <span className="text-lg font-black text-slate-800 font-mono">{selectedScreens.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* WIZARD NAVIGATION - SIDEBAR */}
                <div className="lg:w-1/4 shrink-0">
                    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-100 sticky top-40">
                        <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Flag className="w-4 h-4 text-[var(--color-dark-turquoise)]" /> مسار الحملة
                        </h3>
                        <div className="space-y-4">
                            {steps.map((step, index) => {
                                const current = isStepCurrent(step.id);
                                const done = isStepDone(step.id);
                                const Icon = step.icon;
                                return (
                                    <div key={step.id} className="relative">
                                        {/* Connector Line */}
                                        {index !== steps.length - 1 && (
                                            <div className={`absolute top-10 right-5 bottom-[-16px] w-[2px] ${done ? 'bg-[var(--color-dark-turquoise)]' : 'bg-slate-100'}`} />
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => setCurrentStep(step.id)}
                                            className={`w-full flex items-center gap-4 p-2 rounded-xl transition-all text-right group outline-none
                                                ${current ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black transition-all shadow-sm z-10
                                                ${done ? 'bg-[var(--color-dark-turquoise)] text-white' : 
                                                  current ? 'bg-white border-2 border-[var(--color-dark-turquoise)] text-[var(--color-dark-turquoise)] shadow-md shadow-[var(--color-dark-turquoise)]/20' : 
                                                  'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300'}`}>
                                                {done ? <Check className="w-5 h-5" /> : step.id}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-black transition-colors ${current ? 'text-[var(--color-dark-turquoise)]' : done ? 'text-slate-800' : 'text-slate-500'}`}>
                                                    {step.title}
                                                </h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{step.subtitle}</p>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* FORM CONTENT */}
                <div className="lg:w-3/4">
                    <form onSubmit={handleSubmit} className="relative">
                        <AnimatePresence mode="wait">
                            
                            {/* STEP 1: CAMPAIGN INFORMATION */}
                            {currentStep === 1 && (
                                <motion.div 
                                    key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-100"
                                >
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <Info className="w-6 h-6 text-[var(--color-dark-turquoise)]" /> المعلومات الأساسية للتصنيف
                                        </h2>
                                        <p className="text-slate-500 font-bold text-sm mt-2">تعريف هوية الحملة وتحديد القطاع الإعلاني المستهدف.</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {can('manage_all') && (
                                            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                                                <label className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-3 block px-1 flex items-center gap-1.5">
                                                    <ShieldCheck className="w-5 h-5 text-indigo-600" /> إسناد الحملة لمعلن (صلاحية إدارية عليا)
                                                </label>
                                                <div className="relative">
                                                    <select value={form.advertiser_id} onChange={(e) => setForm(p => ({ ...p, advertiser_id: e.target.value }))} className="w-full bg-white border border-indigo-200 rounded-xl py-4 px-4 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-sm appearance-none">
                                                        <option value="">-- إصدار تحت حساب الإدارة (افتراضي) --</option>
                                                        {advertisers.map(adv => <option key={adv.user_id} value={adv.user_id}>{adv.full_name} ({adv.email})</option>)}
                                                    </select>
                                                    <ChevronDown className="w-5 h-5 text-indigo-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                                <p className="text-[11px] text-indigo-600 font-bold px-1 mt-2">باختيارك لمعلن، سيشاهد هذه الحملة في لوحته وتصدر الفاتورة باسمه.</p>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <label className={labelClass}>عنوان الحملة الترويجي <span className="text-red-500">*</span></label>
                                                <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: إطلاق منتج صيف 2026..." className={inputClass} />
                                                <p className="text-[10px] text-slate-400 font-bold px-1 mt-1.5">الاسم المرجعي الداخلي للحملة (لن يظهر للجمهور).</p>
                                            </div>
                                            <div>
                                                <label className={labelClass}>تصنيف القطاع الإعلاني <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select value={form.category_id} onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))} className={`${inputClass} appearance-none cursor-pointer pr-4 pl-10`}>
                                                        <option value="">-- اختر التصنيف التسعيري المناسب --</option>
                                                        {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name} - {c.price}$ (معامل تصنيف)</option>)}
                                                    </select>
                                                    <ChevronDown className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: SCHEDULING & FREQUENCY */}
                            {currentStep === 2 && (
                                <motion.div 
                                    key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-100"
                                >
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <Calendar className="w-6 h-6 text-[var(--color-dark-turquoise)]" /> الجدولة الزمنية وكثافة البث
                                        </h2>
                                        <p className="text-slate-500 font-bold text-sm mt-2">تحديد المواصفات الزمنية لعمر الحملة، وفترات البث خلال اليوم.</p>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className={labelClass}>طول المادة الإعلانية <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input type="number" min="1" value={form.duration} onChange={(e) => { setForm(p => ({ ...p, duration: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} placeholder="مثال: 15" className={`${inputClass} pl-12 font-mono`} />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">ثانية</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>تاريخ الانطلاق <span className="text-red-500">*</span></label>
                                                <input type="date" value={form.start_date} onChange={(e) => { setForm(p => ({ ...p, start_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>تاريخ الانتهاء <span className="text-red-500">*</span></label>
                                                <input type="date" value={form.end_date} onChange={(e) => { setForm(p => ({ ...p, end_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <h4 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                                                <Crosshair className="w-4 h-4 text-slate-500" /> توجيه البث النهاري/الليلي (اختياري)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={labelClass}>يبدأ البث في الساعة</label>
                                                    <input type="time" value={form.target_start_time} onChange={(e) => { setForm(p => ({ ...p, target_start_time: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} className={`${inputClass} bg-white shadow-sm font-mono`} />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>يتوقف البث في الساعة</label>
                                                    <input type="time" value={form.target_end_time} onChange={(e) => { setForm(p => ({ ...p, target_end_time: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} className={`${inputClass} bg-white shadow-sm font-mono`} />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 mt-3 px-1">بإمكانك حصر ساعات البث في فترات الذروة المحددة. يترك فارغاً للبث على مدار 24 ساعة.</p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-[var(--color-dark-turquoise)]" /> باقات التكرار وكثافة البث
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {frequencyPackages.map(pkg => {
                                                    const isSelected = form.interval_minutes == pkg.display_interval;
                                                    return (
                                                        <div 
                                                            key={pkg.id || pkg.display_interval}
                                                            onClick={() => {
                                                                setForm(p => ({ ...p, interval_minutes: pkg.display_interval, package_name: pkg.name }));
                                                                if (calculatedCost) setCalculatedCost(null);
                                                            }}
                                                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group
                                                                ${isSelected ? 'border-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/5 shadow-md' : 'border-slate-200 bg-white hover:border-[var(--color-dark-turquoise)]/40 hover:bg-slate-50'}`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--color-dark-turquoise)]/10 rounded-bl-[40px] flex items-start justify-end p-2">
                                                                    <CheckCircle2 className="w-5 h-5 text-[var(--color-dark-turquoise)]" />
                                                                </div>
                                                            )}
                                                            <div className="mb-2">
                                                                <span className={`text-base font-black ${isSelected ? 'text-[var(--color-dark-turquoise)]' : 'text-slate-900'}`}>{pkg.name}</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                                                <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--color-dark-turquoise)]' : 'text-slate-400'}`} /> يعرض كل {pkg.display_interval} دقيقة
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <input type="hidden" value={form.package_name} readOnly />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: SCREEN TARGETING */}
                            {currentStep === 3 && (
                                <motion.div 
                                    key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-100"
                                >
                                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                                <MapPin className="w-6 h-6 text-[var(--color-dark-turquoise)]" /> الاستهداف المكاني
                                            </h2>
                                            <p className="text-slate-500 font-bold text-sm mt-2">قم بتمكين الشاشات المستهدفة لبث الحملة عليها.</p>
                                        </div>
                                        <div className="bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] font-black text-sm px-4 py-2 rounded-xl flex items-center gap-2">
                                            <Monitor className="w-4 h-4" /> تم اختيار {selectedScreens.length} شاشات
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="p-1">
                                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-3">
                                                {screens.length === 0 ? (
                                                    <div className="text-center py-16">
                                                        <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                                        <p className="text-base font-black text-slate-500 mb-2">لا تتوفر شاشات في النظام</p>
                                                        <p className="text-xs font-bold text-slate-400">يرجى إضافة شاشات جديدة من قسم إدارة الشاشات.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {screens.map(screen => {
                                                            const isSelected = selectedScreens.includes(screen.screen_id);
                                                            return (
                                                                <div key={screen.screen_id} 
                                                                    onClick={() => toggleScreen(screen.screen_id)}
                                                                    className={`flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer relative group
                                                                        ${isSelected ? 'border-[var(--color-dark-turquoise)] bg-white shadow-md' : 'border-slate-200 bg-white hover:border-[var(--color-dark-turquoise)]/40'}`}>
                                                                    
                                                                    <div className="flex justify-between items-start mb-3">
                                                                        <div className="flex-1 pr-1">
                                                                            <h5 className={`text-sm font-black mb-1 truncate ${isSelected ? 'text-[var(--color-dark-turquoise)]' : 'text-slate-800'}`} title={screen.screen_name}>
                                                                                {screen.screen_name}
                                                                            </h5>
                                                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate">
                                                                                <MapPin className="w-3 h-3 shrink-0" /> {screen.street?.name || 'موقع غير محدد'}
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); setAvailabilityScreen(screen); }}
                                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                                                                ${isSelected ? 'bg-[var(--color-dark-turquoise)]/10 text-[var(--color-dark-turquoise)] hover:bg-[var(--color-dark-turquoise)] hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                                            title="التأكد من توفر المساحة الزمنية"
                                                                        >
                                                                            <Info className="w-4 h-4" />
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">الحالة</span>
                                                                        {isSelected ? (
                                                                            <span className="flex items-center gap-1.5 text-xs font-black text-[var(--color-dark-turquoise)]">
                                                                                <CheckCircle2 className="w-3.5 h-3.5" /> مستهدفة
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-slate-400">تخطي</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 4: MEDIA UPLOAD EXPERIENCE */}
                            {currentStep === 4 && (
                                <motion.div 
                                    key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-100"
                                >
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                            <ImageIcon className="w-6 h-6 text-[var(--color-dark-turquoise)]" /> الإنتاج الإعلاني
                                        </h2>
                                        <p className="text-slate-500 font-bold text-sm mt-2">رفع المادة المرئية ومستندات الاعتماد المالي.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                                    <Upload className="w-4 h-4 text-[var(--color-dark-turquoise)]" /> المادة الإعلانية <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative group">
                                                    <input type="file" accept="video/*,image/*" onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all bg-slate-50 
                                                        ${form.file ? 'border-[var(--color-dark-turquoise)] bg-[var(--color-dark-turquoise)]/5' : 'border-slate-300 group-hover:border-[var(--color-dark-turquoise)] group-hover:bg-slate-100/50'}`}>
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors shadow-sm
                                                            ${form.file ? 'bg-[var(--color-dark-turquoise)] text-white' : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-[var(--color-dark-turquoise)] group-hover:text-[var(--color-dark-turquoise)]'}`}>
                                                            <Upload className="w-6 h-6" />
                                                        </div>
                                                        <p className="text-sm font-black text-slate-900 mb-1">
                                                            {form.file ? form.file.name : 'انقر أو اسحب الملف هنا للرفع'}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-slate-500">MP4, MOV, JPEG, PNG (الحد الأقصى 50MB)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                                                    <FileText className="w-4 h-4 text-emerald-600" /> إيصال الدفع <span className="text-slate-400 font-bold ml-2">(اختياري)</span>
                                                </label>
                                                <div className="relative group">
                                                    <input type="file" accept="image/*,.pdf" onChange={(e) => setForm(p => ({ ...p, receipt: e.target.files[0] }))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className={`p-4 rounded-xl border-2 border-dashed flex items-center gap-4 transition-all bg-slate-50 
                                                        ${form.receipt ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 group-hover:border-emerald-500'}`}>
                                                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors shadow-sm
                                                            ${form.receipt ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black text-slate-900 truncate">{form.receipt ? form.receipt.name : 'إرفاق المستند المالي'}</p>
                                                            {!form.receipt && <p className="text-[10px] font-bold text-slate-500">JPG, PNG, PDF</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Media Preview Box */}
                                        <div className="rounded-2xl bg-black overflow-hidden flex items-center justify-center relative min-h-[300px] shadow-2xl ring-1 ring-white/10 group">
                                            {previewUrl ? (
                                                <>
                                                    {form.file?.type.startsWith('video/') ? (
                                                        <video src={previewUrl} controls className="w-full h-full object-contain absolute inset-0 z-0" autoPlay muted loop />
                                                    ) : (
                                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain absolute inset-0 z-0" />
                                                    )}
                                                    <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                                        <span className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> معاينة العرض
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6 z-10">
                                                    <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                                                    <p className="text-sm font-bold text-white/40">نافذة المعاينة المباشرة</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: COST REVIEW & SUBMISSION */}
                            {currentStep === 5 && (
                                <motion.div 
                                    key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-dark-turquoise)] to-transparent opacity-50"></div>
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                            <Calculator className="w-6 h-6 text-[var(--color-dark-turquoise)]" /> التسعير والاعتماد النهائي
                                        </h2>
                                        <p className="text-slate-400 font-bold text-sm mt-2">استعراض التكلفة واعتماد تقديم البيانات للخادم.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                        <div className="space-y-6 z-10">
                                            <button type="button" onClick={handleCalculateCost} disabled={costLoading} 
                                                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group outline-none">
                                                <Calculator className="w-5 h-5 text-[var(--color-gold)] group-hover:rotate-12 transition-transform" />
                                                {costLoading ? 'جاري المحاكاة...' : 'حساب التكلفة الإجمالية'}
                                            </button>

                                            <AnimatePresence>
                                                {calculatedCost !== null && costDetails && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                                                        <div className="bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
                                                            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                                                                <span className="text-sm font-bold text-slate-400">الإجمالي النهائي المستقطب:</span>
                                                                <span className="font-black text-5xl text-[var(--color-gold)] tracking-tighter">${calculatedCost.toFixed(2)}</span>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-3 mb-6">
                                                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">الرسوم</span>
                                                                    <span className="font-black text-slate-200">${costDetails.base_price}</span>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">المدة</span>
                                                                    <span className="font-black text-slate-200">{costDetails.days} يوم</span>
                                                                </div>
                                                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                                                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">الانتشار</span>
                                                                    <span className="font-black text-slate-200">{costDetails.screens?.length} موقع</span>
                                                                </div>
                                                            </div>

                                                            {costDetails.screens && costDetails.screens.length > 0 && (
                                                                <div className="max-h-40 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl bg-black/30 p-2 space-y-1">
                                                                    {costDetails.screens.map(s => (
                                                                        <div key={s.screen_id} className="flex justify-between items-center text-xs px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                                            <span className="font-bold text-slate-300 truncate" title={s.screen_name}>{s.screen_name}</span>
                                                                            <div className="flex items-center gap-3 shrink-0">
                                                                                <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">{s.multiplier}x معامل</span>
                                                                                <span className="font-black text-white bg-[var(--color-dark-turquoise)]/20 text-[var(--color-dark-turquoise)] px-2 py-0.5 rounded">${s.screen_total}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="z-10 bg-black/20 p-6 rounded-3xl border border-white/5">
                                            {/* Upload Progress Display */}
                                            {loading && uploadProgress > 0 && (
                                                <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-5 shadow-lg mb-6 backdrop-blur-md">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-black text-emerald-400 flex items-center gap-2">
                                                            <Upload className="w-4 h-4 animate-bounce" /> جاري التشفير والرفع...
                                                        </span>
                                                        <span className="text-sm font-black text-white bg-emerald-500/20 px-2 py-1 rounded-lg">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
                                                        <div 
                                                            className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out" 
                                                            style={{ width: `${uploadProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                                    <ShieldCheck className="w-8 h-8 text-[var(--color-dark-turquoise)]" />
                                                    {calculatedCost !== null && (
                                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-300">يجب استخراج التسعيرة قبل تفعيل الإرسال النهائي.</p>
                                            </div>

                                            <button type="submit" disabled={loading || calculatedCost === null}
                                                className="w-full bg-[var(--color-dark-turquoise)] hover:bg-[#0c4c58] text-white font-black py-4 rounded-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2 group border border-transparent">
                                                {loading ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span>جاري المعالجة {uploadProgress > 0 ? `(${uploadProgress}%)` : ''}</span>
                                                    </>
                                                ) : (
                                                    <>اعتماد النظام ورفع المعاملة <CheckCircle2 className="w-5 h-5" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons Footer */}
                        <div className="mt-8 flex justify-between items-center border-t border-slate-200 pt-6">
                            <button 
                                type="button" 
                                onClick={prevStep} 
                                disabled={currentStep === 1 || loading}
                                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowRight className="w-4 h-4" /> الخطوة السابقة
                            </button>

                            {currentStep < 5 && (
                                <button 
                                    type="button" 
                                    onClick={nextStep}
                                    className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                >
                                    التالي <ArrowRight className="w-4 h-4 rotate-180" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <ScreenAvailabilityModal
                isOpen={!!availabilityScreen}
                onClose={() => setAvailabilityScreen(null)}
                screen={availabilityScreen}
                selectedDate={form.start_date}
            />
        </div>
    );
};

export default CreateAdPage;
