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
import ScreenMapView from '../screens/components/ScreenMapView';

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
        title: '', start_date: '', end_date: '', target_start_time: '00:00', target_end_time: '23:59', daily_shift: '24h',
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

    // ── Step-3 search & geo filter state ─────────────────────────────────
    const [screenSearch, setScreenSearch] = useState('');
    const [filterGov, setFilterGov] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [filterStreet, setFilterStreet] = useState('');
    const [govList, setGovList] = useState([]);
    const [regionList, setRegionList] = useState([]);
    const [streetList, setStreetList] = useState([]);
    const [geoFilterLoading, setGeoFilterLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [screensRes, categoriesRes, freqRes, advRes, govRes] = await Promise.all([
                    axiosClient.get(ENDPOINTS.SCREENS.ALL),
                    axiosClient.get(ENDPOINTS.LOOKUPS.CATEGORIES),
                    axiosClient.get(ENDPOINTS.FREQUENCY_PACKAGES.ALL),
                    can('manage_all') ? axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('Advertiser')) : Promise.resolve({ data: [] }),
                    axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES)
                ]);
                setScreens(screensRes.data || []);
                setCategories(categoriesRes.data || []);
                setFrequencyPackages(freqRes.data?.data || freqRes.data || []);
                setAdvertisers(advRes.data || []);
                setGovList(govRes.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, []);

    // ── Geo-filter cascade handlers ───────────────────────────────────────
    const handleFilterGovChange = async (govId) => {
        setFilterGov(govId);
        setFilterRegion('');
        setFilterStreet('');
        setRegionList([]);
        setStreetList([]);
        if (!govId) return;
        try {
            setGeoFilterLoading(true);
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
            setRegionList(res.data || []);
        } catch (e) { console.error(e); }
        finally { setGeoFilterLoading(false); }
    };

    const handleFilterRegionChange = async (regionId) => {
        setFilterRegion(regionId);
        setFilterStreet('');
        setStreetList([]);
        if (!regionId) return;
        try {
            setGeoFilterLoading(true);
            const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
            setStreetList(res.data || []);
        } catch (e) { console.error(e); }
        finally { setGeoFilterLoading(false); }
    };

    const clearGeoFilters = () => {
        setScreenSearch('');
        setFilterGov('');
        setFilterRegion('');
        setFilterStreet('');
        setRegionList([]);
        setStreetList([]);
    };

    // ── Derived: screens visible in Step 3 ───────────────────────────────
    const filteredScreensForAd = React.useMemo(() => {
        return screens.filter(s => {
            // text search (name, street, region)
            if (screenSearch.trim()) {
                const q = screenSearch.trim().toLowerCase();
                const hit =
                    s.screen_name?.toLowerCase().includes(q) ||
                    s.street?.name?.toLowerCase().includes(q) ||
                    s.street?.region?.name?.toLowerCase().includes(q);
                if (!hit) return false;
            }
            // cascading geo filter
            if (filterStreet)  return String(s.street_id) === String(filterStreet);
            if (filterRegion)  return String(s.street?.region_id) === String(filterRegion);
            if (filterGov)     return String(s.street?.region?.gov_id) === String(filterGov);
            return true;
        });
    }, [screens, screenSearch, filterGov, filterRegion, filterStreet]);

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

    const addDays = (days) => {
        if (!form.start_date) {
            addToast('الرجاء تحديد تاريخ الانطلاق أولاً', 'warning');
            return;
        }
        const start = new Date(form.start_date);
        start.setDate(start.getDate() + days - 1);
        
        const y = start.getFullYear();
        const m = String(start.getMonth() + 1).padStart(2, '0');
        const d = String(start.getDate()).padStart(2, '0');
        const formattedDate = `${y}-${m}-${d}`;
        
        setForm(p => ({ ...p, end_date: formattedDate }));
        if (calculatedCost) setCalculatedCost(null);
    };

    const handleCalculateCost = async () => {
        if (selectedScreens.length === 0 || !form.start_date || !form.end_date || !form.interval_minutes) {
            addToast('يرجى التأكد من تعبئة: الشاشات، جدول العرض التاريخي، وباقة التكرار قبل حاسبة التكلفة', 'warning');
            return;
        }
        setCostLoading(true);
        try {
            let sd = '', ed = '';
            if (form.start_date) sd = form.start_date.split('T')[0];
            if (form.end_date) ed = form.end_date.split('T')[0];

            const payload = {
                screen_ids: selectedScreens,
                start_date: sd,
                target_start_time: form.target_start_time,
                end_date: ed,
                target_end_time: form.target_end_time,
                interval_minutes: form.interval_minutes
            };

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
            if (val !== '' && val !== null && !['start_date', 'end_date'].includes(key)) {
                if (['interval_minutes', 'total_cost'].includes(key)) {
                    formData.append(key, Number(val));
                } else {
                    formData.append(key, val);
                }
            }
        });
        
        let sd = '', ed = '';
        if (form.start_date) sd = form.start_date.split('T')[0];
        if (form.end_date) ed = form.end_date.split('T')[0];

        formData.append('start_date', sd);
        formData.append('end_date', ed);
        formData.append('target_start_time', form.target_start_time);
        formData.append('target_end_time', form.target_end_time);

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

    const inputClass = "w-full border border-border-color rounded-lg px-4 py-3 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors";
    const labelClass = "block font-label-md text-label-md text-on-background mb-2";

    const steps = [
        { id: 1, title: 'المعلومات الأساسية', subtitle: 'التعريف والتصنيف' },
        { id: 2, title: 'الجدولة والتكرار', subtitle: 'التاريخ وكثافة البث' },
        { id: 3, title: 'الاستهداف المكاني', subtitle: 'تحديد الشاشات' },
        { id: 4, title: 'المحتوى المرئي', subtitle: 'رفع الملفات' },
        { id: 5, title: 'التسعير والاعتماد', subtitle: 'مراجعة ختامية' }
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
        <div className="flex-1 md:mr-64 flex flex-col min-h-screen bg-background">
            <header className="bg-surface/95 backdrop-blur-md border-b border-border-color fixed top-0 left-0 w-full md:w-[calc(100%-16rem)] z-30">
                <div className="flex items-center justify-between px-5 md:px-6 h-13 gap-3" style={{height:'52px'}}>
                    {/* Right: back + step dots */}
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => navigate('/dashboard/ads')} className="group flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                            <span className="hidden md:block font-label-md text-label-md">الإعلانات</span>
                        </button>
                        <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
                        <div className="hidden sm:flex items-center gap-1">
                            {steps.map(s => (
                                <div key={s.id} className={`transition-all duration-300 rounded-full ${
                                    s.id < currentStep ? 'w-4 h-1.5 bg-secondary' :
                                    s.id === currentStep ? 'w-6 h-1.5 bg-primary' :
                                    'w-1.5 h-1.5 bg-outline-variant'
                                }`} />
                            ))}
                        </div>
                    </div>
                    {/* Center: title */}
                    <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold hidden sm:block">إطلاق حملة</span>
                        <span className="font-caption text-caption text-outline hidden md:block">· {steps[currentStep - 1]?.title}</span>
                    </div>
                    {/* Left: KPI badges */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-border-color">
                            <span className="material-symbols-outlined text-[14px] text-outline">payments</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold" dir="ltr">{calculatedCost ? `$${calculatedCost.toFixed(2)}` : '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1 rounded-lg border border-border-color">
                            <span className="material-symbols-outlined text-[14px] text-outline">desktop_windows</span>
                            <span className="font-label-md text-label-md text-on-surface font-bold">{selectedScreens.length}</span>
                        </div>
                    </div>
                </div>
                {/* Animated gradient progress bar */}
                <div className="h-[2px] w-full bg-outline-variant/20 relative overflow-hidden">
                    <motion.div
                        className="absolute top-0 right-0 h-full bg-gradient-to-l from-primary via-primary/80 to-secondary rounded-full"
                        animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                    />
                </div>
            </header>

            <main className="flex-1 p-3 md:p-5 max-w-[1440px] mx-auto w-full font-sans" style={{marginTop:'54px'}} dir="rtl">
                {/* Slim compact title row */}
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-container to-primary/20 text-primary flex items-center justify-center border border-primary/10 shadow-sm flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                        </div>
                        <div>
                            <h2 className="font-title-md text-title-md text-on-background font-bold leading-snug">إطلاق حملة إعلانية جديدة</h2>
                            <p className="font-caption text-caption text-on-surface-variant">{steps[currentStep - 1]?.title} · الخطوة {currentStep} من {steps.length}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/ads')}
                        className="group flex items-center gap-2 px-4 py-2 bg-surface-container-lowest hover:bg-error-container/20 border border-border-color hover:border-error/30 text-error rounded-xl transition-all font-label-md shadow-sm flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[17px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                        <span className="hidden sm:block">إلغاء</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-3 items-start">
                    {/* MAIN FORM CARD - Left side */}
                    <div className="flex-1 flex flex-col gap-4 order-2 lg:order-1 min-w-0">
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 md:p-7 flex flex-col gap-6 flex-1 shadow-sm">
                        <form onSubmit={handleSubmit} className="relative">
                            <AnimatePresence mode="wait">
                            
                            {/* STEP 1: CAMPAIGN INFORMATION */}
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-xl">info</span>
                                            <h3 className="font-title-lg text-title-lg text-on-background">المعلومات الأساسية للتصنيف</h3>
                                        </div>
                                        <p className="font-body-md text-body-md text-on-surface-variant">تعريف هوية الحملة وتحديد القطاع الإعلاني المستهدف.</p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {can('manage_all') && (
                                            <div className="bg-surface-container-low p-6 rounded-xl border border-border-color">
                                                <label className="font-label-md text-label-md text-primary mb-3 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined">admin_panel_settings</span> إسناد الحملة لمعلن (صلاحية إدارية عليا)
                                                </label>
                                                <div className="relative">
                                                    <select value={form.advertiser_id} onChange={(e) => setForm(p => ({ ...p, advertiser_id: e.target.value }))} className="w-full bg-white border border-border-color rounded-lg py-3 px-4 text-on-background focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors cursor-pointer shadow-sm appearance-none font-body-md">
                                                        <option value="">-- إصدار تحت حساب الإدارة (افتراضي) --</option>
                                                        {advertisers.map(adv => <option key={adv.user_id} value={adv.user_id}>{adv.full_name} ({adv.email})</option>)}
                                                    </select>
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_content</span>
                                                </div>
                                                <p className="font-caption text-caption text-on-surface-variant mt-2 px-1">باختيارك لمعلن، سيشاهد هذه الحملة في لوحته وتصدر الفاتورة باسمه.</p>
                                            </div>
                                        )}
                                        
                                        <div className="grid grid-cols-1 gap-8">
                                            <div>
                                                <label className={labelClass}>عنوان الحملة الترويجي <span className="text-error">*</span></label>
                                                <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: إطلاق منتج صيف 2026..." className={inputClass} />
                                                <p className="font-caption text-caption text-on-surface-variant mt-1.5 px-1">الاسم المرجعي الداخلي للحملة (لن يظهر للجمهور).</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: SCHEDULING & FREQUENCY */}
                            {currentStep === 2 && (
                                <motion.div 
                                    key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-white rounded-2xl border border-border-color p-6 md:p-8 shadow-sm"
                                >
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                                            <h3 className="font-title-lg text-title-lg text-on-background">الجدولة الزمنية وكثافة البث</h3>
                                        </div>
                                        <p className="font-body-md text-body-md text-on-surface-variant">تحديد المواصفات الزمنية لعمر الحملة، وفترات البث خلال اليوم.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10 bg-surface-container-low/50 p-6 rounded-2xl border border-border-color">
                                        <div>
                                            <label className="block font-title-sm text-title-sm text-on-background mb-3">
                                                تاريخ الانطلاق <span className="text-error">*</span>
                                            </label>
                                            <div className="relative">
                                                <input 
                                                    type="date" 
                                                    value={form.start_date} 
                                                    onChange={(e) => { setForm(p => ({ ...p, start_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} 
                                                    className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-14 text-left shadow-sm" 
                                                    dir="ltr" 
                                                />
                                                <span className="material-symbols-outlined text-[26px] absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">calendar_month</span>
                                            </div>
                                            <p className="font-caption text-caption text-on-surface-variant mt-2 px-1">حدد تاريخ بدء انطلاق الحملة الإعلانية.</p>
                                        </div>
                                        <div>
                                            <label className="block font-title-sm text-title-sm text-on-background mb-3 flex items-center justify-between">
                                                <span>تاريخ الانتهاء <span className="text-error">*</span></span>
                                                {form.start_date && (
                                                    <span className="font-caption text-caption text-primary bg-primary/10 px-2 py-0.5 rounded-md">خيار سريع متاح</span>
                                                )}
                                            </label>
                                            <div className="relative mb-5">
                                                <input 
                                                    type="date" 
                                                    value={form.end_date} 
                                                    onChange={(e) => { setForm(p => ({ ...p, end_date: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} 
                                                    className="w-full border border-border-color bg-white rounded-xl px-5 py-4 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-14 text-left shadow-sm" 
                                                    dir="ltr" 
                                                />
                                                <span className="material-symbols-outlined text-[26px] absolute right-4 top-1/2 -translate-y-1/2 text-error pointer-events-none">event_busy</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={() => addDays(7)} className="px-4 py-2.5 bg-primary-container/30 text-primary hover:bg-primary hover:text-white text-sm font-bold rounded-xl transition-all border border-primary/20 shadow-sm flex-1 text-center break-keep min-w-[70px]">أسبوع</button>
                                                <button type="button" onClick={() => addDays(14)} className="px-4 py-2.5 bg-primary-container/30 text-primary hover:bg-primary hover:text-white text-sm font-bold rounded-xl transition-all border border-primary/20 shadow-sm flex-1 text-center break-keep min-w-[70px]">أسبوعين</button>
                                                <button type="button" onClick={() => addDays(30)} className="px-4 py-2.5 bg-primary-container/30 text-primary hover:bg-primary hover:text-white text-sm font-bold rounded-xl transition-all border border-primary/20 shadow-sm flex-1 text-center break-keep min-w-[70px]">شهر</button>
                                                <button type="button" onClick={() => addDays(60)} className="px-4 py-2.5 bg-primary-container/30 text-primary hover:bg-primary hover:text-white text-sm font-bold rounded-xl transition-all border border-primary/20 shadow-sm flex-1 text-center break-keep min-w-[70px]">شهرين</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily Shift Buttons */}
                                    <div className="bg-surface-container-low border border-border-color rounded-2xl p-6 mb-10 text-center shadow-sm">
                                        <h4 className="font-title-sm text-title-sm text-on-background mb-2 flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-outline">schedule</span>
                                            ساعات العرض اليومية (نطاق البث)
                                        </h4>
                                        <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                                            اختر في أي الأوقات سيظهر إعلانك يومياً على الشاشات المستهدفة
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-4">
                                            <button type="button" 
                                                onClick={() => { setForm(p => ({ ...p, target_start_time: '08:00', target_end_time: '18:00', daily_shift: 'day' })); if (calculatedCost) setCalculatedCost(null); }}
                                                className={`px-6 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-sm ${form.daily_shift === 'day' ? 'bg-primary text-white border-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                <span className="material-symbols-outlined text-[24px]">light_mode</span>
                                                <span className="font-bold text-[15px]">بث نهاري (8ص - 6م)</span>
                                            </button>
                                            <button type="button" 
                                                onClick={() => { setForm(p => ({ ...p, target_start_time: '18:00', target_end_time: '23:59', daily_shift: 'night' })); if (calculatedCost) setCalculatedCost(null); }}
                                                className={`px-6 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-sm ${form.daily_shift === 'night' ? 'bg-primary text-white border-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                                                <span className="font-bold text-[15px]">بث مسائي (6م - 12ص)</span>
                                            </button>
                                            <button type="button" 
                                                onClick={() => { setForm(p => ({ ...p, target_start_time: '00:00', target_end_time: '23:59', daily_shift: '24h' })); if (calculatedCost) setCalculatedCost(null); }}
                                                className={`px-6 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-sm ${form.daily_shift === '24h' ? 'bg-primary text-white border-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                <span className="material-symbols-outlined text-[24px]">all_inclusive</span>
                                                <span className="font-bold text-[15px]">على مدار 24 ساعة</span>
                                            </button>
                                            <button type="button" 
                                                onClick={() => { setForm(p => ({ ...p, daily_shift: 'custom' })); if (calculatedCost) setCalculatedCost(null); }}
                                                className={`px-6 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all shadow-sm ${form.daily_shift === 'custom' ? 'bg-primary text-white border-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-white text-on-surface-variant border-border-color hover:bg-primary-container/20 hover:text-primary hover:border-primary/40'}`}>
                                                <span className="material-symbols-outlined text-[24px]">tune</span>
                                                <span className="font-bold text-[15px]">تحديد مخصص</span>
                                            </button>
                                        </div>

                                        {form.daily_shift === 'custom' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-6 border-t border-border-color">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                                                    <div>
                                                        <label className="block font-title-sm text-title-sm text-on-background mb-3 text-right">يبدأ العرض الساعة <span className="text-error">*</span></label>
                                                        <div className="relative">
                                                            <input 
                                                                type="time" 
                                                                value={form.target_start_time} 
                                                                onChange={(e) => { setForm(p => ({ ...p, target_start_time: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} 
                                                                className="w-full border border-border-color bg-white rounded-xl px-4 py-3 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 text-left shadow-sm" 
                                                                dir="ltr" 
                                                            />
                                                            <span className="material-symbols-outlined text-[24px] absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">schedule</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block font-title-sm text-title-sm text-on-background mb-3 text-right">ينتهي العرض الساعة <span className="text-error">*</span></label>
                                                        <div className="relative">
                                                            <input 
                                                                type="time" 
                                                                value={form.target_end_time} 
                                                                onChange={(e) => { setForm(p => ({ ...p, target_end_time: e.target.value })); if (calculatedCost) setCalculatedCost(null); }} 
                                                                className="w-full border border-border-color bg-white rounded-xl px-4 py-3 font-title-sm text-[16px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12 text-left shadow-sm" 
                                                                dir="ltr" 
                                                            />
                                                            <span className="material-symbols-outlined text-[24px] absolute right-3 top-1/2 -translate-y-1/2 text-error pointer-events-none">schedule</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="h-px bg-border-color w-full mb-8"></div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="material-symbols-outlined text-primary text-xl">insights</span>
                                            <h3 className="font-title-lg text-title-lg text-on-background">باقات التكرار وكثافة البث</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {frequencyPackages.map(pkg => {
                                                const isSelected = form.interval_minutes == pkg.display_interval;
                                                return (
                                                    <label key={pkg.id || pkg.display_interval} className="cursor-pointer relative block">
                                                        <input 
                                                            type="radio" 
                                                            name="package" 
                                                            className="peer sr-only"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                setForm(p => ({ ...p, interval_minutes: pkg.display_interval, package_name: pkg.name }));
                                                                if (calculatedCost) setCalculatedCost(null);
                                                            }}
                                                        />
                                                        <div className={`rounded-xl p-6 text-center transition-all duration-200 hover:shadow-md ${isSelected ? 'border border-primary-container ring-1 ring-primary-container bg-surface-container' : 'border border-border-color bg-white'}`}>
                                                            <h4 className="font-headline-md text-headline-md text-on-background mb-2">{pkg.name}</h4>
                                                            <div className="flex items-center justify-center gap-1 text-on-surface-variant">
                                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                                <span className="font-body-md text-body-md">يعرض كل {pkg.display_interval} دقيقة</span>
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <input type="hidden" value={form.package_name} readOnly />
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 3: SCREEN TARGETING */}
                            {currentStep === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                    {/* Header */}
                                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                                <h3 className="font-title-lg text-title-lg text-on-background">الاستهداف المكاني</h3>
                                            </div>
                                            <p className="font-body-md text-body-md text-on-surface-variant">ابحث عن الشاشات أو صفّها حسب الموقع الجغرافي.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedScreens.length > 0 && (
                                                <span className="bg-primary text-white font-label-md text-label-md px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                                                    {selectedScreens.length} شاشة مختارة
                                                </span>
                                            )}
                                            <div className="bg-surface-container-low border border-border-color text-on-surface-variant font-label-md px-4 py-2 rounded-lg flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                                                {filteredScreensForAd.length} / {screens.length}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Search + Geo Filters ── */}
                                    <div className="bg-surface-container-low border border-border-color rounded-2xl p-4 mb-4 flex flex-col gap-3">
                                        {/* Text search */}
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">search</span>
                                            <input
                                                type="text"
                                                value={screenSearch}
                                                onChange={e => setScreenSearch(e.target.value)}
                                                placeholder="ابحث باسم الشاشة أو الشارع أو المنطقة..."
                                                className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"
                                            />
                                            {screenSearch && (
                                                <button type="button" onClick={() => setScreenSearch('')}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-outline hover:text-error transition-colors">
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Cascade dropdowns */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {/* المحافظة */}
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">map</span>
                                                <select
                                                    value={filterGov}
                                                    onChange={e => handleFilterGovChange(e.target.value)}
                                                    className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer"
                                                >
                                                    <option value="">كل المحافظات</option>
                                                    {govList.map(g => <option key={g.gov_id} value={g.gov_id}>{g.name}</option>)}
                                                </select>
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                            </div>

                                            {/* المنطقة */}
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">location_city</span>
                                                <select
                                                    value={filterRegion}
                                                    onChange={e => handleFilterRegionChange(e.target.value)}
                                                    disabled={!filterGov || geoFilterLoading}
                                                    className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">{geoFilterLoading ? 'جاري التحميل...' : 'كل المناطق'}</option>
                                                    {regionList.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                                                </select>
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                            </div>

                                            {/* الشارع */}
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">fork_right</span>
                                                <select
                                                    value={filterStreet}
                                                    onChange={e => setFilterStreet(e.target.value)}
                                                    disabled={!filterRegion || geoFilterLoading}
                                                    className="w-full bg-white border border-border-color rounded-xl pr-10 pl-4 py-2.5 font-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">{geoFilterLoading ? 'جاري التحميل...' : 'كل الشوارع'}</option>
                                                    {streetList.map(s => <option key={s.street_id} value={s.street_id}>{s.name}</option>)}
                                                </select>
                                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[16px]">expand_more</span>
                                            </div>
                                        </div>

                                        {/* Clear filters */}
                                        {(screenSearch || filterGov || filterRegion || filterStreet) && (
                                            <button type="button" onClick={clearGeoFilters}
                                                className="self-start flex items-center gap-1.5 text-error font-label-md text-label-md hover:bg-error-container/20 px-3 py-1.5 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                                                مسح جميع الفلاتر
                                            </button>
                                        )}
                                    </div>

                                    {/* ── Screens Layout (Map + Cards) ── */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        
                                        {/* Map View */}
                                        <div className="h-[580px] bg-surface-container-lowest border border-border-color rounded-xl overflow-hidden shadow-sm relative z-0">
                                            <ScreenMapView
                                                screens={screens}
                                                selectedGov={filterGov}
                                                selectedRegion={filterRegion}
                                                selectedStreet={filterStreet}
                                                governorates={govList}
                                                regions={regionList}
                                                streets={streetList}
                                            />
                                        </div>

                                        {/* Screen Cards Grid */}
                                        <div className="h-[580px] bg-surface-container-lowest border border-border-color rounded-xl overflow-hidden p-4 shadow-sm flex flex-col">
                                            <div className="h-full overflow-y-auto custom-scrollbar">
                                                {screens.length === 0 ? (
                                                    <div className="text-center py-16">
                                                        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">desktop_windows</span>
                                                        <p className="font-title-lg text-title-lg text-on-surface-variant mb-2">لا تتوفر شاشات في النظام</p>
                                                        <p className="font-body-md text-body-md text-outline">يرجى إضافة شاشات جديدة من قسم إدارة الشاشات.</p>
                                                    </div>
                                                ) : filteredScreensForAd.length === 0 ? (
                                                    <div className="text-center py-16">
                                                        <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">search_off</span>
                                                        <p className="font-title-md text-title-md text-on-surface-variant mb-1">لا توجد شاشات مطابقة</p>
                                                        <p className="font-body-md text-body-md text-outline">جرّب تعديل كلمة البحث أو الفلاتر الجغرافية.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                                                        {filteredScreensForAd.map(screen => {
                                                        const isSelected = selectedScreens.includes(screen.screen_id);
                                                        return (
                                                            <div key={screen.screen_id}
                                                                onClick={() => toggleScreen(screen.screen_id)}
                                                                className={`flex flex-col p-5 rounded-xl border transition-all cursor-pointer relative
                                                                    ${isSelected ? 'border-primary-container bg-surface-container shadow-sm ring-1 ring-primary-container' : 'border-border-color bg-white hover:border-primary-container/40 hover:shadow-sm'}`}>

                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex-1 pr-1 min-w-0">
                                                                        <h5 className={`font-label-md text-label-md mb-1 truncate ${isSelected ? 'text-primary' : 'text-on-background'}`} title={screen.screen_name}>
                                                                            {screen.screen_name}
                                                                        </h5>
                                                                        {screen.street?.region?.name && (
                                                                            <p className="font-caption text-caption text-outline flex items-center gap-1 truncate">
                                                                                <span className="material-symbols-outlined text-[12px]">map</span>
                                                                                {screen.street.region.name}
                                                                            </p>
                                                                        )}
                                                                        <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1 truncate mt-0.5">
                                                                            <span className="material-symbols-outlined text-[13px]">fork_right</span>
                                                                            {screen.street?.name || 'موقع غير محدد'}
                                                                        </p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); setAvailabilityScreen(screen); }}
                                                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
                                                                            ${isSelected ? 'bg-primary text-white hover:bg-on-primary-fixed-variant' : 'bg-surface-container text-on-surface-variant hover:bg-outline-variant'}`}
                                                                        title="التأكد من توفر المساحة الزمنية"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">info</span>
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-color">
                                                                    <span className="font-caption text-caption text-outline">الحالة</span>
                                                                    {isSelected ? (
                                                                        <span className="flex items-center gap-1 font-label-md text-label-md text-primary bg-primary-container/10 px-2 py-0.5 rounded">
                                                                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span> مستهدفة
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-label-md text-label-md text-outline">تخطي</span>
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
                                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-primary text-xl">image</span>
                                            <h3 className="font-title-lg text-title-lg text-on-background">الإنتاج الإعلاني</h3>
                                        </div>
                                        <p className="font-body-md text-body-md text-on-surface-variant">رفع المادة المرئية ومستندات الاعتماد المالي.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="font-label-md text-label-md font-bold text-on-background mb-3 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-primary">upload</span> المادة الإعلانية <span className="text-error">*</span>
                                                </label>
                                                <div className="relative group">
                                                    <input type="file" accept="video/*,image/*" onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center transition-all bg-surface-container-lowest 
                                                        ${form.file ? 'border-primary ring-1 ring-primary bg-primary-container/10' : 'border-outline group-hover:border-primary group-hover:bg-surface-container-low'}`}>
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors
                                                            ${form.file ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface-variant group-hover:bg-primary-container group-hover:text-primary'}`}>
                                                            <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                                        </div>
                                                        <p className="font-title-md text-title-md text-on-background mb-1 font-bold">
                                                            {form.file ? form.file.name : 'انقر أو اسحب الملف هنا للرفع'}
                                                        </p>
                                                        <p className="font-caption text-caption text-outline">MP4, MOV, JPEG, PNG (الحد الأقصى 50MB)</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="font-label-md text-label-md font-bold text-on-background mb-3 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[18px] text-outline">receipt_long</span> إيصال الدفع <span className="text-outline font-normal ml-2">(اختياري)</span>
                                                </label>
                                                <div className="relative group">
                                                    <input type="file" accept="image/*,.pdf" onChange={(e) => setForm(p => ({ ...p, receipt: e.target.files[0] }))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                    <div className={`p-4 rounded-xl border border-dashed flex items-center gap-4 transition-all bg-surface-container-lowest 
                                                        ${form.receipt ? 'border-secondary ring-1 ring-secondary bg-surface-container' : 'border-outline group-hover:border-secondary'}`}>
                                                        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center transition-colors shadow-sm
                                                            ${form.receipt ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                                                            <span className="material-symbols-outlined text-[20px]">description</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-label-md text-label-md font-bold text-on-background truncate">{form.receipt ? form.receipt.name : 'إرفاق المستند المالي'}</p>
                                                            {!form.receipt && <p className="font-caption text-caption text-outline mt-0.5">JPG, PNG, PDF</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Media Preview Box */}
                                        <div className="rounded-2xl bg-surface-container-low overflow-hidden flex items-center justify-center relative min-h-[300px] border border-border-color shadow-sm group">
                                            {previewUrl ? (
                                                <>
                                                    {form.file?.type.startsWith('video/') ? (
                                                        <video src={previewUrl} controls className="w-full h-full object-contain absolute inset-0 z-0 bg-black" autoPlay muted loop />
                                                    ) : (
                                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain absolute inset-0 z-0 bg-surface-container-lowest" />
                                                    )}
                                                    <div className="absolute top-4 right-4 z-10 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border-color shadow-sm">
                                                        <span className="font-caption text-caption font-bold text-on-background flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-[14px] text-primary">visibility</span> معاينة العرض
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6 z-10 bg-surface-container-lowest w-full h-full flex flex-col items-center justify-center rounded-2xl">
                                                    <span className="material-symbols-outlined text-6xl text-surface-container mb-4">image</span>
                                                    <p className="font-label-md text-label-md font-bold text-outline">نافذة المعاينة المباشرة</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: COST REVIEW & SUBMISSION */}
                            {currentStep === 5 && (
                                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                                    className="bg-surface-container border border-border-color rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
                                    <div className="mb-8 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
                                        <div>
                                            <h2 className="font-headline-sm text-headline-sm text-on-background font-bold">التسعير والاعتماد النهائي</h2>
                                            <p className="font-body-md text-body-md text-on-surface-variant mt-1">استعراض التكلفة واعتماد تقديم البيانات للخادم.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-6 z-10">
                                            <button type="button" onClick={handleCalculateCost} disabled={costLoading} 
                                                className="w-full bg-surface hover:bg-surface-container-low border border-border-color text-on-background font-label-lg py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group outline-none">
                                                <span className="material-symbols-outlined text-primary">calculate</span>
                                                {costLoading ? 'جاري المحاكاة...' : 'حساب التكلفة الإجمالية'}
                                            </button>

                                            <AnimatePresence>
                                                {calculatedCost !== null && costDetails && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                                                        <div className="bg-surface p-6 rounded-2xl border border-border-color shadow-sm">
                                                            <div className="flex justify-between items-center mb-6 border-b border-border-color pb-4">
                                                                <span className="font-label-md text-label-md text-outline">الإجمالي النهائي المستقطب:</span>
                                                                <span className="font-display-sm text-display-sm text-primary font-bold tracking-tighter" dir="ltr">${calculatedCost.toFixed(2)}</span>
                                                            </div>

                                                            {costDetails.discount_multiplier < 1.0 && (
                                                                <div className="mb-6 bg-green-50/50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                                                        <span className="material-symbols-outlined text-green-600">celebration</span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-label-md text-label-md font-bold text-green-800 mb-1">مكافأة المدة الطويلة!</h4>
                                                                        <p className="font-caption text-caption text-green-700">لقد تم تطبيق <strong>{costDetails.discount_label}</strong> على هذه التسعيرة بنجاح لإختيارك التعاقد معنا لمدة طويلة.</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-3 gap-3 mb-6">
                                                                <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                    <span className="block font-caption text-caption text-outline mb-1">الرسوم</span>
                                                                    <span className="font-headline-sm text-headline-sm text-on-background font-bold" dir="ltr">${costDetails.base_price}</span>
                                                                </div>
                                                                <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                    <span className="block font-caption text-caption text-outline mb-1">المدة</span>
                                                                    <span className="font-headline-sm text-headline-sm text-on-background font-bold">{costDetails.days} يوم</span>
                                                                </div>
                                                                <div className="bg-surface-container-lowest rounded-xl p-3 text-center border border-border-color">
                                                                    <span className="block font-caption text-caption text-outline mb-1">الانتشار</span>
                                                                    <span className="font-headline-sm text-headline-sm text-on-background font-bold">{costDetails.screens?.length} موقع</span>
                                                                </div>
                                                            </div>

                                                            {costDetails.screens && costDetails.screens.length > 0 && (
                                                                <div className="max-h-40 overflow-y-auto custom-scrollbar border border-border-color rounded-xl bg-surface-container-lowest p-2 space-y-1">
                                                                    {costDetails.screens.map(s => (
                                                                        <div key={s.screen_id} className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-surface hover:bg-surface-container transition-colors">
                                                                            <span className="font-label-md text-label-md text-on-background font-bold truncate" title={s.screen_name}>{s.screen_name}</span>
                                                                            <div className="flex items-center gap-3 shrink-0">
                                                                                <span className="font-caption text-caption text-outline bg-surface-container px-2 py-1 rounded-md">{s.multiplier}x معامل</span>
                                                                                <span className="font-label-md text-label-md text-primary bg-primary-container/20 px-2 py-1 rounded-md" dir="ltr">${s.screen_total}</span>
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

                                        <div className="z-10 bg-surface-container-low p-6 rounded-2xl border border-border-color flex flex-col justify-between h-full">
                                            {/* Upload Progress Display */}
                                            {loading && uploadProgress > 0 && (
                                                <div className="bg-surface border border-secondary/30 rounded-xl p-5 shadow-sm mb-6">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="font-label-md text-label-md text-secondary flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[18px] animate-bounce">cloud_upload</span> جاري التشفير والرفع...
                                                        </span>
                                                        <span className="font-label-md text-label-md text-on-background bg-secondary/10 px-2 py-1 rounded-lg font-bold">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden border border-border-color shadow-inner">
                                                        <div 
                                                            className="bg-secondary h-full rounded-full transition-all duration-300 ease-out" 
                                                            style={{ width: `${uploadProgress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-center mb-6 flex-1 flex flex-col items-center justify-center min-h-[140px]">
                                                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border-color relative shadow-sm">
                                                    <span className="material-symbols-outlined text-3xl text-outline">verified_user</span>
                                                    {calculatedCost !== null && (
                                                        <div className="absolute -bottom-1 -right-1 bg-secondary w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center shadow-sm">
                                                            <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-body-md text-body-md text-outline">يجب استخراج التسعيرة قبل تفعيل الإرسال النهائي.</p>
                                            </div>

                                            <button type="submit" disabled={loading || calculatedCost === null}
                                                className="w-full bg-primary hover:bg-on-primary-fixed-variant text-white font-label-lg py-4 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group outline-none">
                                                {loading ? (
                                                    <>
                                                        <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                                                        <span>جاري المعالجة {uploadProgress > 0 ? `(${uploadProgress}%)` : ''}</span>
                                                    </>
                                                ) : (
                                                    <>اعتماد النظام ورفع المعاملة <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>done_all</span></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Navigation Buttons Footer */}
                        {/* Footer Navigation - التالي left, السابقة right (Stitch layout) */}
                        <div className="flex items-center justify-between pt-4 border-t border-outline-variant mt-6">
                            {/* التالي - LEFT side (primary action) */}
                            {currentStep < 5 ? (
                                <button 
                                    type="button" 
                                    onClick={nextStep}
                                    className="bg-on-background text-white font-label-md text-label-md px-8 py-3 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition-colors shadow-sm"
                                >
                                    التالي <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                </button>
                            ) : (
                                <div className="px-8 py-3 w-1 opacity-0"></div>
                            )}

                            {/* الخطوة السابقة - RIGHT side */}
                            <button 
                                type="button" 
                                onClick={prevStep} 
                                disabled={currentStep === 1 || loading}
                                className="bg-surface-container-lowest border border-outline-variant text-on-background font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                الخطوة السابقة <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </button>
                        </div>
                    </form>
                    </div>
                    </div>

                    {/* CAMPAIGN STEPPER - Right side (order-2 on desktop) */}
                    <aside className="w-full lg:w-[300px] flex-shrink-0 order-1 lg:order-2">
                        <div className="bg-surface/60 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-sm sticky top-24 p-6 relative overflow-hidden">
                            {/* Decorative background glow inside stepper */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                            <h3 className="font-title-lg text-title-lg text-on-surface border-b border-border-color pb-4 mb-6 flex items-center gap-2 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center border border-border-color text-primary">
                                    <span className="material-symbols-outlined text-[18px]">flag</span>
                                </div>
                                مسار الحملة
                            </h3>

                            <div className="relative z-10">
                                {/* Static connector line */}
                                <div className="absolute right-[15px] top-4 bottom-4 w-px bg-outline-variant/50 -z-10"></div>

                                {/* Animated progress fill */}
                                <div className="absolute right-[15px] top-4 w-px -z-10 overflow-hidden" style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}>
                                    <motion.div
                                        className="w-full h-full bg-gradient-to-b from-primary to-secondary"
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        style={{ transformOrigin: 'top' }}
                                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                                    />
                                </div>

                                <ul className="space-y-8">
                                    {steps.map((step) => {
                                        const current = isStepCurrent(step.id);
                                        const done = isStepDone(step.id);
                                        return (
                                            <li
                                                key={step.id}
                                                onClick={() => { if (step.id < currentStep || done) setCurrentStep(step.id); }}
                                                className={`flex items-start gap-4 cursor-pointer transition-all duration-300 group
                                                    ${current ? 'bg-surface p-3 -m-3 rounded-xl border border-border-color shadow-sm' : ''}
                                                    ${!current && !done ? 'opacity-60 hover:opacity-100' : ''}`}
                                            >
                                                <div className="flex-shrink-0 relative">
                                                    {done ? (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform text-white">
                                                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                                                        </div>
                                                    ) : current ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                                                            <div className="w-8 h-8 rounded-full border-2 border-primary bg-surface flex items-center justify-center shadow-md relative z-10 text-primary">
                                                                <span className="font-label-md text-label-md font-bold">{step.id}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-outline group-hover:border-primary group-hover:text-primary transition-colors">
                                                            <span className="font-label-md text-label-md">{step.id}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-1 text-right min-w-0">
                                                    <h4 className={`font-label-md text-label-md font-bold truncate transition-colors ${current ? 'text-primary' : done ? 'text-on-surface' : 'text-outline group-hover:text-on-surface'}`}>
                                                        {step.title}
                                                    </h4>
                                                    <p className="font-caption text-caption text-on-surface-variant mt-0.5 truncate">{step.subtitle}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </aside>
                </div>

            <ScreenAvailabilityModal
                isOpen={!!availabilityScreen}
                onClose={() => setAvailabilityScreen(null)}
                screen={availabilityScreen}
                selectedDate={form.start_date}
            />
            </main>
        </div>
    );
};

export default CreateAdPage;
