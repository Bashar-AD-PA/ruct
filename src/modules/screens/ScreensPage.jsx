import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  Monitor, Plus, Trash2, TerminalSquare, Edit2, Image as ImageIcon,
  Eye, Activity, Info, MapPin, UploadCloud, AlertCircle, Layers,
  ChevronDown, Wifi, WifiOff, Wrench, Navigation, Star, X, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import StatusBadge from '../../shared/components/StatusBadge';
import Modal from '../../shared/components/Modal';
import ConfirmDialog from '../../shared/components/ConfirmDialog';
import useToastStore from '../../store/useToastStore';
import ScreenCommandModal from './components/ScreenCommandModal';
import usePermission from '../../hooks/usePermission';

// Lazy load map mapping component
const ScreenMapView = lazy(() => import('./components/ScreenMapView'));

const STATUS_CFG = {
  Online:      { label: 'متصل',      dot: 'bg-[#166534]', text: 'text-[#166534]', ring: 'border-[#166534]', bg: 'bg-[#dcfce7]', icon: Wifi },
  Offline:     { label: 'غير متصل', dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', ring: 'border-[#ba1a1a]', bg: 'bg-[#ffdad6]', icon: WifiOff },
  Maintenance: { label: 'صيانة',    dot: 'bg-[#eab308]',   text: 'text-[#854d0e]',   ring: 'border-[#eab308]',   bg: 'bg-[#fef9c3]',   icon: Wrench },
};

const CascadingSelect = ({ label, value, onChange, options, placeholder, disabled, icon: Icon = null }) => (
  <div className="bg-[#ffffff] border border-[#c3c6d7] rounded px-3 py-1 flex items-center gap-2">
    {Icon && <Icon className="w-4 h-4 text-[#434655]" />}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-[#141b2b] outline-none max-w-[120px] truncate"
    >
      <option value="">{placeholder}</option>
      {options.map(op => (
        <option key={op.value} value={op.value}>{op.label}</option>
      ))}
    </select>
  </div>
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsModal, setDetailsModal] = useState({ open: false, screen: null });
  const [geoLoading, setGeoLoading] = useState(false);
  const { can } = usePermission();
  const addToast = useToastStore(state => state.addToast);

  // Geographic filter state
  const [governorates, setGovernorates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [streets, setStreets] = useState([]);
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  // Form Cascade State
  const [formGovId, setFormGovId] = useState('');
  const [formRegionId, setFormRegionId] = useState('');
  const [formRegions, setFormRegions] = useState([]);
  const [formStreets, setFormStreets] = useState([]);
  const [formGeoLoading, setFormGeoLoading] = useState(false);
  const [isNewLocation, setIsNewLocation] = useState(false);
  const [newLocation, setNewLocation] = useState({ governorate: '', region: '', street: '' });

  // Form state
  const [form, setForm] = useState({
    screen_name: '', mac_address: '', type_id: '', street_id: '',
    owner_id: '', status: 'Online', photo: null
  });

  useEffect(() => {
    fetchScreens();
    fetchLookups();
    fetchGovernorates();
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
      const [types, streetsRes, owners] = await Promise.all([
        axiosClient.get(ENDPOINTS.LOOKUPS.SCREEN_TYPES),
        axiosClient.get(ENDPOINTS.LOOKUPS.STREETS),
        axiosClient.get(ENDPOINTS.LOOKUPS.USERS_BY_ROLE('ScreenOwner')),
      ]);
      setLookups({ types: types.data, streets: streetsRes.data, owners: owners.data });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGovernorates = async () => {
    try {
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.GOVERNORATES);
      setGovernorates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGovChange = async (govId) => {
    setSelectedGov(govId);
    setSelectedRegion('');
    setSelectedStreet('');
    setRegions([]);
    setStreets([]);
    if (!govId) return;
    try {
      setGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      setRegions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGeoLoading(false);
    }
  };

  const handleRegionChange = async (regionId) => {
    setSelectedRegion(regionId);
    setSelectedStreet('');
    setStreets([]);
    if (!regionId) return;
    try {
      setGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
      setStreets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setGeoLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedGov('');
    setSelectedRegion('');
    setSelectedStreet('');
    setRegions([]);
    setStreets([]);
  };

  const filteredByGeo = useMemo(() => {
    if (!screens.length) return [];
    return screens.filter(s => {
      if (selectedStreet) return String(s.street_id) === String(selectedStreet);
      if (selectedRegion) return String(s.street?.region_id) === String(selectedRegion);
      if (selectedGov)    return String(s.street?.region?.gov_id) === String(selectedGov);
      return true;
    });
  }, [screens, selectedGov, selectedRegion, selectedStreet]);

  const featuredScreens = useMemo(() => {
    const statusOrder = { Online: 0, Maintenance: 1, Offline: 2 };
    const base = [...filteredByGeo]
      .sort((a, b) => {
        const so = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        if (so !== 0) return so;
        return new Date(b.linked_at || 0) - new Date(a.linked_at || 0);
      });
    return base;
  }, [filteredByGeo]);

  const filteredScreens = useMemo(() => {
    const base = filteredByGeo;
    if (statusFilter === 'all') return base;
    return base.filter(s => s.status === statusFilter || (statusFilter === 'pending_activation' && !s.status));
  }, [filteredByGeo, statusFilter]);

  const stats = useMemo(() => ({
    total:       screens.length,
    online:      screens.filter(s => s.status === 'Online').length,
    offline:     screens.filter(s => s.status === 'Offline').length,
    maintenance: screens.filter(s => s.status === 'Maintenance').length,
  }), [screens]);

  const fetchFormRegions = async (govId) => {
    try {
      setFormGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.REGIONS_BY_GOV(govId));
      setFormRegions(res.data);
    } catch {
      setFormRegions([]);
    } finally {
      setFormGeoLoading(false);
    }
  };

  const fetchFormStreets = async (regionId) => {
    try {
      setFormGeoLoading(true);
      const res = await axiosClient.get(ENDPOINTS.LOOKUPS.STREETS_BY_REGION(regionId));
      setFormStreets(res.data);
    } catch {
      setFormStreets([]);
    } finally {
      setFormGeoLoading(false);
    }
  };

  const handleFormGovChange = (govId) => {
    setFormGovId(govId);
    setFormRegionId('');
    setForm(p => ({ ...p, street_id: '' }));
    setFormRegions([]);
    setFormStreets([]);
    if (govId) fetchFormRegions(govId);
  };

  const handleFormRegionChange = (regionId) => {
    setFormRegionId(regionId);
    setForm(p => ({ ...p, street_id: '' }));
    setFormStreets([]);
    if (regionId) fetchFormStreets(regionId);
  };

  const handleOpenModal = (isEdit = false, screen = null) => {
    if (isEdit && screen) {
      setForm({
        screen_name: screen.screen_name || '',
        mac_address: screen.mac_address || '',
        type_id: screen.type_id || '',
        street_id: screen.street_id || '',
        owner_id: screen.owner_id || '',
        status: screen.status || 'Online',
        photo: null,
      });

      const initialRegionId = screen.street?.region_id || '';
      const initialGovId = screen.street?.region?.gov_id || '';
      setFormGovId(initialGovId);
      setFormRegionId(initialRegionId);
      if (initialGovId) fetchFormRegions(initialGovId);
      if (initialRegionId) fetchFormStreets(initialRegionId);
    } else {
      setForm({ screen_name: '', mac_address: '', type_id: '', street_id: '', owner_id: '', status: 'Online', photo: null });
      setFormGovId('');
      setFormRegionId('');
      setFormRegions([]);
      setFormStreets([]);
    }
    setIsNewLocation(false);
    setNewLocation({ governorate: '', region: '', street: '' });
    setModalConfig({ open: true, isEdit, screen });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNewLocation && (!newLocation.governorate || !newLocation.region || !newLocation.street)) {
      addToast('الرجاء تعبئة بيانات الموقع الجديد بالكامل', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      let finalStreetId = form.street_id;

      if (isNewLocation) {
        const locRes = await axiosClient.post(ENDPOINTS.LOOKUPS.FULL_LOCATION, {
          governorate: newLocation.governorate,
          city: newLocation.region,
          street: newLocation.street
        });
        finalStreetId = locRes.data.data.street.street_id;
        fetchLookups();
        fetchGovernorates();
      }

      const fd = new FormData();
      const payload = { ...form, street_id: finalStreetId };
      Object.entries(payload).forEach(([k, v]) => { if (v) fd.append(k, v); });

      if (modalConfig.isEdit) {
        fd.append('_method', 'PUT'); // Fallback logic
        await axiosClient.post(ENDPOINTS.SCREENS.UPDATE(modalConfig.screen.screen_id), fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        addToast('تم تحديث بيانات الشاشة بنجاح', 'success');
      } else {
        await axiosClient.post(ENDPOINTS.SCREENS.ALL, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        addToast('تمت إضافة الشاشة الجديدة بنجاح', 'success');
      }
      setModalConfig({ open: false, isEdit: false, screen: null });
      fetchScreens();
    } catch (e) {
      addToast(e.response?.data?.message || 'تعذر إتمام العملية', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosClient.delete(ENDPOINTS.SCREENS.DELETE(deleteTarget));
      addToast('تم إسقاط الشاشة من الشبكة', 'success');
      setDeleteTarget(null);
      fetchScreens();
    } catch {
      addToast('فشلت عملية الحذف. قد تكون الشاشة مرتبطة بإعلانات نشطة', 'error');
    }
  };

  const statusTabs = [
    { key: 'all', label: 'الكل' },
    { key: 'Online', label: 'متصلة', iconBg: 'bg-[#166534]' },
    { key: 'Offline', label: 'غير متصلة', iconBg: 'bg-[#ba1a1a]' },
    { key: 'Maintenance', label: 'صيانة', iconBg: 'bg-[#eab308]' },
    { key: 'pending_activation', label: 'بانتظار التفعيل', iconType: 'hourglass' },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto p-[24px] space-y-[32px] font-sans text-right" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[16px]">
        <div>
          <div className="flex items-center gap-[8px] text-[#004ac6] mb-1">
            <Monitor className="w-[28px] h-[28px]" />
            <h2 className="text-[32px] font-semibold text-[#141b2b] leading-[40px]">الشاشات والأجهزة</h2>
          </div>
          <p className="text-[16px] text-[#434655]">مراقبة شاشات العرض جغرافياً، وتتبع حالتها التشغيلية الفورية.</p>
        </div>
        {(can('manage_all') || can('manage_screens')) && (
          <button
            onClick={() => handleOpenModal(false)}
            className="flex items-center gap-[8px] bg-[#2563eb] text-[#ffffff] px-[24px] py-3 rounded-lg hover:bg-[#004ac6] transition-colors shadow-sm text-[14px] font-medium"
          >
            <Plus className="w-5 h-5" />
            إضافة شاشة جديدة
          </button>
        )}
      </div>

      {/* ── Stats Row ── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
          {/* Total */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl p-[16px] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[14px] font-medium text-[#434655] mb-1">إجمالي الشاشات</p>
              <p className="text-[48px] font-bold text-[#141b2b] leading-[60px]">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#dbe1ff] flex items-center justify-center text-[#004ac6]">
              <Monitor className="w-6 h-6" />
            </div>
          </div>
          {/* Active */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl p-[16px] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[14px] font-medium text-[#434655] mb-1">متصلة الآن</p>
              <p className="text-[48px] font-bold text-[#141b2b] leading-[60px]">{stats.online}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534]">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          {/* Disconnected */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] border-l-4 border-l-[#ba1a1a] rounded-xl p-[16px] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[14px] font-medium text-[#434655] mb-1">مقطوعة الاتصال</p>
              <p className="text-[48px] font-bold text-[#ba1a1a] leading-[60px]">{stats.offline}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          {/* Maintenance */}
          <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl p-[16px] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[14px] font-medium text-[#434655] mb-1">تحت الصيانة</p>
              <p className="text-[48px] font-bold text-[#141b2b] leading-[60px]">{stats.maintenance}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#fef9c3] flex items-center justify-center text-[#854d0e]">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ── Map & List Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] min-h-[600px] h-full lg:h-[600px]">
        {/* Screen List Sidebar */}
        <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl flex flex-col h-full overflow-hidden shadow-sm lg:col-span-1">
          <div className="p-[16px] border-b border-[#c3c6d7] bg-[#f1f3ff] flex justify-between items-center">
            <div className="flex items-center gap-[8px]">
              <Layers className="text-[#004ac6] w-5 h-5" />
              <h3 className="text-[20px] font-semibold text-[#141b2b]">جميع الشاشات المتوفرة</h3>
            </div>
            <span className="bg-[#2563eb] text-[#ffffff] px-2 py-1 rounded-full text-[12px] font-medium">
              {featuredScreens.length} شاشة
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-[8px] space-y-[8px] custom-scrollbar">
            {featuredScreens.length > 0 ? (
              featuredScreens.map(screen => {
                const cfg = STATUS_CFG[screen.status] || STATUS_CFG.Offline;
                const StatusIcon = cfg.icon;
                return (
                  <div key={screen.screen_id} className="border border-[#c3c6d7] rounded-lg p-[8px] bg-[#f9f9ff] hover:border-[#004ac6] transition-colors cursor-pointer" onClick={() => setDetailsModal({ open: true, screen })}>
                    <div className="flex justify-between items-start mb-[8px]">
                      <div className="min-w-0 pr-1 flex-1">
                        <h4 className="text-[20px] font-semibold text-[#141b2b] truncate">{screen.screen_name}</h4>
                        <div className={`flex items-center gap-[4px] mt-1 px-2 py-0.5 rounded-full inline-flex ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon className="w-[14px] h-[14px]" />
                          <span className="text-[12px] font-normal">{cfg.label}</span>
                        </div>
                      </div>
                      <div className="w-16 h-12 bg-[#e1e8fd] rounded overflow-hidden flex items-center justify-center shrink-0">
                        {screen.image_path ? (
                          <img src={screen.image_path} alt={screen.screen_name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="text-[#c3c6d7] w-6 h-6" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-[4px] text-[#434655] text-[12px] font-normal mb-[16px]">
                      <MapPin className="text-[16px] w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {screen.street ? `${screen.street.name}${screen.street.region ? ` - ${screen.street.region.name}` : ''}` : 'غير محدد'}
                      </span>
                    </div>
                    <div className="flex gap-[8px]">
                      <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, screen }); }} className="flex-1 py-1.5 border border-[#004ac6] text-[#004ac6] rounded text-[14px] hover:bg-[#004ac6] hover:text-[#ffffff] transition-colors">عرض الجداول</button>
                      <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, screen); }} className="flex-1 py-1.5 border border-[#c3c6d7] text-[#141b2b] rounded text-[14px] hover:bg-[#e1e8fd] transition-colors">تعديل الموقع</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center opacity-50">
                <Monitor className="w-10 h-10 mb-2" />
                <p>لا توجد شاشات مطابقة للبحث</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#E5E7EB] rounded-xl flex flex-col h-full overflow-hidden relative shadow-sm">
          {/* Filters Overlay */}
          <div className="p-[8px] border-b border-[#c3c6d7] bg-[#f9f9ff]/80 backdrop-blur-md absolute top-0 w-full z-10 flex gap-[8px] items-center flex-wrap">
            <CascadingSelect
              icon={Navigation}
              value={selectedGov}
              onChange={handleGovChange}
              placeholder="كافة المحافظات"
              options={governorates.map(g => ({ value: g.gov_id, label: g.name }))}
            />
            <CascadingSelect
              icon={Building}
              value={selectedRegion}
              onChange={handleRegionChange}
              placeholder="كافة المناطق"
              options={regions.map(r => ({ value: r.region_id, label: r.name }))}
              disabled={!selectedGov || geoLoading}
            />
            <CascadingSelect
              icon={MapPin}
              value={selectedStreet}
              onChange={setSelectedStreet}
              placeholder="كافة الشوارع"
              options={streets.map(s => ({ value: s.street_id, label: s.name }))}
              disabled={!selectedRegion || geoLoading}
            />
            {(selectedGov || selectedRegion || selectedStreet) && (
              <button
                onClick={clearFilters}
                className="bg-[#ffdad6] text-[#ba1a1a] px-[8px] py-1 rounded text-[12px] hover:bg-[#ba1a1a] hover:text-white transition-colors h-8 flex items-center"
              >
                مسح الفلاتر
              </button>
            )}
            <div className="mr-auto bg-[#f1f3ff] px-[8px] py-1 rounded text-[14px] font-medium flex items-center gap-[4px] h-8">
              <Layers className="text-[#004ac6] w-4 h-4" />
              خريطة الشاشات التفاعلية
            </div>
          </div>
          
          <div className="flex-1 bg-[#e1e8fd] relative w-full h-full pt-12">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <p className="text-sm font-bold text-gray-500">جاري تحميل الخريطة...</p>
              </div>
            }>
              <ScreenMapView
                screens={screens}
                selectedGov={selectedGov}
                selectedRegion={selectedRegion}
                selectedStreet={selectedStreet}
                governorates={governorates}
                regions={regions}
                streets={streets}
              />
            </Suspense>

            {/* Map Legend */}
            <div className="absolute bottom-4 right-4 bg-[#ffffff] border border-[#E5E7EB] rounded-lg p-[8px] shadow-sm z-10">
              <p className="text-[12px] font-normal text-[#434655] mb-2">حالة الشاشات</p>
              <div className="flex items-center gap-[4px] text-[14px] mb-1">
                <div className="w-3 h-3 rounded-full bg-[#166534]"></div> <span>متصل</span>
              </div>
              <div className="flex items-center gap-[4px] text-[14px] mb-1">
                <div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div> <span>غير متصل</span>
              </div>
              <div className="flex items-center gap-[4px] text-[14px]">
                <div className="w-3 h-3 rounded-full bg-[#eab308]"></div> <span>صيانة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full Device Table ── */}
      <div className="bg-[#ffffff] border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="p-[16px] border-b border-[#c3c6d7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] bg-[#f9f9ff]">
          <div>
            <h3 className="text-[20px] font-semibold text-[#141b2b]">جدول الشاشات الكامل</h3>
            <p className="text-[12px] text-[#434655]">عرض {filteredScreens.length} شاشة {(selectedGov || selectedRegion || selectedStreet) ? 'في التحديد الحالي' : 'في المنظومة بأكملها'}</p>
          </div>
          
          {/* Table Tabs */}
          <div className="flex gap-2 overflow-x-auto bg-[#f1f3ff] p-1 rounded-lg border border-[#c3c6d7]">
            {statusTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-[16px] py-1.5 rounded-md text-[14px] font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  statusFilter === tab.key
                    ? 'bg-[#141b2b] text-[#f9f9ff]'
                    : 'text-[#434655] hover:bg-[#e1e8fd]'
                }`}
              >
                {tab.iconBg && <div className={`w-2 h-2 rounded-full ${tab.iconBg}`}></div>}
                {tab.iconType === 'hourglass' && <TerminalSquare className="w-3 h-3" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[1000px]">
            <thead className="bg-[#F8FAFC] text-[#141b2b] text-[14px] font-medium border-b border-[#E5E7EB]">
              <tr>
                <th className="p-[8px] whitespace-nowrap">اسم الشاشة</th>
                <th className="p-[8px] whitespace-nowrap">MAC Address</th>
                <th className="p-[8px] whitespace-nowrap">كود الربط</th>
                <th className="p-[8px] whitespace-nowrap text-center">الحالة</th>
                <th className="p-[8px] whitespace-nowrap text-center">صورة</th>
                <th className="p-[8px] whitespace-nowrap text-center">النوع</th>
                <th className="p-[8px] whitespace-nowrap text-center">المالك</th>
                <th className="p-[8px] whitespace-nowrap text-center">الموقع</th>
                <th className="p-[8px] whitespace-nowrap text-center">آخر اتصال</th>
                <th className="p-[8px] whitespace-nowrap text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="text-[16px] text-[#141b2b] divide-y divide-[#c3c6d7] bg-[#ffffff]">
              {loading ? (
                 <tr>
                    <td colSpan="10" className="p-8 text-center text-[#434655]">جاري التحديث...</td>
                 </tr>
              ) : filteredScreens.length === 0 ? (
                 <tr>
                    <td colSpan="10" className="p-8 text-center text-[#434655]">لا توجد بيانات مطابقة</td>
                 </tr>
              ) : (
                filteredScreens.map((row) => (
                  <tr key={row.screen_id} className="hover:bg-[#ffffff] transition-colors">
                    <td className="p-[8px] font-medium whitespace-nowrap">{row.screen_name}</td>
                    <td className="p-[8px] whitespace-nowrap">
                        <span className="text-[#434655] font-mono text-sm border border-[#c3c6d7] rounded px-2 m-1 inline-block">{row.mac_address}</span>
                    </td>
                    <td className="p-[8px] text-[#434655] font-mono text-[14px]">{row.pairing_code || '—'}</td>
                    <td className="p-[8px] text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f1f3ff] text-[#434655] text-[12px] font-medium border border-[#c3c6d7]">
                         {row.status ? STATUS_CFG[row.status]?.label || row.status : 'بإنتظار التفعيل'}
                         {row.status ? <div className={`w-2 h-2 rounded-full ${STATUS_CFG[row.status]?.dot}`}></div> : <div className="w-2 h-2 rounded-full bg-[#737686]"></div>}
                      </span>
                    </td>
                    <td className="p-[8px] text-center">
                      <div className="w-10 h-8 bg-[#e1e8fd] rounded mx-auto flex items-center justify-center text-[#c3c6d7] overflow-hidden cursor-pointer hover:border-[#004ac6] border border-transparent" onClick={() => setShowImageModal(row.image_path)}>
                        {row.image_path ? <img src={row.image_path} className="w-full h-full object-cover" alt="img" /> : <ImageIcon className="w-[18px] h-[18px]" />}
                      </div>
                    </td>
                    <td className="p-[8px] text-center text-[#c3c6d7] whitespace-nowrap">{row.type?.type_name || '—'}</td>
                    <td className="p-[8px] text-center text-[#434655] truncate max-w-[120px]">{row.owner?.full_name || '—'}</td>
                    <td className="p-[8px] text-center text-[#434655] text-[14px]">
                       {row.street ? `${row.street.name}` : '—'}
                    </td>
                    <td className="p-[8px] text-center text-[#c3c6d7] whitespace-nowrap">
                       {row.linked_at ? new Date(row.linked_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="p-[8px]">
                      <div className="flex items-center justify-center gap-[4px]">
                        <button onClick={(e) => { e.stopPropagation(); setDetailsModal({ open: true, screen: row }); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#004ac6] hover:bg-[#2563eb] hover:text-[#eeefff] transition-colors" title="عرض">
                          <Eye className="w-[18px] h-[18px]" />
                        </button>
                        {(can('manage_all') || can('manage_screens')) && (
                            <button onClick={(e) => { e.stopPropagation(); setCommandTarget(row); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#434655] hover:bg-[#e1e8fd] transition-colors" title="إعدادات">
                              <TerminalSquare className="w-[18px] h-[18px]" />
                            </button>
                        )}
                        {(can('manage_all') || can('manage_screens')) && (
                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(true, row); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#434655] hover:bg-[#e1e8fd] transition-colors" title="تعديل">
                              <Edit2 className="w-[18px] h-[18px]" />
                            </button>
                        )}
                        {(can('manage_all') || can('manage_screens')) && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.screen_id); }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#ba1a1a] hover:bg-[#ffdad6] hover:text-[#93000a] transition-colors" title="حذف">
                              <Trash2 className="w-[18px] h-[18px]" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-[8px] border-t border-[#c3c6d7] bg-[#f1f3ff] text-center text-[14px] text-[#434655]">
          عرض {filteredScreens.length} من {screens.length} شاشة
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={modalConfig.open}
        onClose={() => setModalConfig({ open: false, isEdit: false, screen: null })}
        title={modalConfig.isEdit ? 'تحديث بيانات الشاشة' : 'تسجيل شاشة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-right w-full font-sans" dir="rtl">
          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-[#c3c6d7] space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-[#434655]" />
              <h4 className="text-[14px] font-semibold text-[#141b2b]">المعلومات الأساسية</h4>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#434655] mb-2 block">اسم الشاشة <span className="text-[#ba1a1a]">*</span></label>
              <input type="text" required value={form.screen_name}
                onChange={(e) => setForm(p => ({ ...p, screen_name: e.target.value }))}
                placeholder="مثال: شاشة مول السعيد 1" className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" />
            </div>
            {!modalConfig.isEdit && (
              <div>
                <label className="text-[12px] font-medium text-[#434655] mb-2 block">MAC Address <span className="text-[#ba1a1a]">*</span></label>
                <input type="text" required value={form.mac_address}
                  onChange={(e) => setForm(p => ({ ...p, mac_address: e.target.value }))}
                  placeholder="AA:BB:CC:DD:EE:FF" className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all text-left" dir="ltr" />
              </div>
            )}
            {modalConfig.isEdit && (
              <div>
                <label className="text-[12px] font-medium text-[#434655] mb-2 block">الحالة التشغيلية</label>
                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all">
                  <option value="Online">متصلة (Online)</option>
                  <option value="Offline">غير متصلة (Offline)</option>
                  <option value="Maintenance">تحت الصيانة (Maintenance)</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-[#f9f9ff] p-5 rounded-2xl border border-[#c3c6d7] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#434655]" />
                <h4 className="text-[14px] font-semibold text-[#141b2b]">الموقع والتصنيف</h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-[#ffffff] px-3 py-1.5 rounded-xl border border-[#c3c6d7] hover:border-[#004ac6] transition-all shadow-sm">
                <input type="checkbox" checked={isNewLocation} onChange={(e) => setIsNewLocation(e.target.checked)} className="w-4 h-4 text-[#004ac6] rounded border-[#c3c6d7] focus:ring-[#004ac6] cursor-pointer" />
                <span className="text-[12px] font-medium text-[#434655]">إضافة موقع جديد يدوياً</span>
              </label>
            </div>
            
            {isNewLocation ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#f1f3ff] p-4 rounded-xl border border-[#dce2f7]">
                <div className="sm:col-span-3">
                  <p className="text-[12px] font-medium text-[#004ac6] mb-2">سيتم إضافة هذا الموقع تلقائياً لقاعدة البيانات ليصبح متاحاً مستقبلاً.</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">اسم المحافظة</label>
                  <input type="text" value={newLocation.governorate} onChange={(e) => setNewLocation(p => ({ ...p, governorate: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" placeholder="مثال: صنعاء" required={isNewLocation} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">اسم المنطقة / المديرية</label>
                  <input type="text" value={newLocation.region} onChange={(e) => setNewLocation(p => ({ ...p, region: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" placeholder="مثال: السبعين" required={isNewLocation} />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">اسم الشارع الرئيسي</label>
                  <input type="text" value={newLocation.street} onChange={(e) => setNewLocation(p => ({ ...p, street: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" placeholder="مثال: شارع حدة" required={isNewLocation} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">المحافظة</label>
                  <select value={formGovId} onChange={(e) => handleFormGovChange(e.target.value)} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" required={!isNewLocation}>
                    <option value="">-- اختر المحافظة --</option>
                    {governorates.map(g => <option key={g.gov_id} value={g.gov_id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">المنطقة</label>
                  <select value={formRegionId} onChange={(e) => handleFormRegionChange(e.target.value)} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" disabled={formGeoLoading || (!formGovId && !formRegionId)} required={!isNewLocation}>
                    <option value="">-- اختر المنطقة --</option>
                    {formRegions.map(r => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#434655] mb-2 block">الشارع</label>
                  <select value={form.street_id} onChange={(e) => setForm(p => ({ ...p, street_id: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all" disabled={formGeoLoading || (!formRegionId && !form.street_id)} required={!isNewLocation}>
                    <option value="">-- اختر الشارع --</option>
                    {formStreets.map(s => <option key={s.street_id} value={s.street_id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#c3c6d7]">
              <div>
                <label className="text-[12px] font-medium text-[#434655] mb-2 block">طراز الشاشة</label>
                <select value={form.type_id} onChange={(e) => setForm(p => ({ ...p, type_id: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all">
                  <option value="">-- اختر التصنيف --</option>
                  {lookups.types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                </select>
              </div>
            </div>
            {!modalConfig.isEdit && (
              <div>
                <label className="text-[12px] font-medium text-[#434655] mb-2 block">مالك الشاشة</label>
                <select value={form.owner_id} onChange={(e) => setForm(p => ({ ...p, owner_id: e.target.value }))} className="w-full bg-[#ffffff] border border-[#c3c6d7] rounded-xl py-2 px-3 text-[14px] text-[#141b2b] placeholder-[#737686] focus:outline-none focus:border-[#004ac6] transition-all">
                  <option value="">-- تعيين مالك --</option>
                  {lookups.owners.map(o => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {!modalConfig.isEdit && (
            <div>
              <label className="text-[12px] font-medium text-[#434655] mb-2 block">صورة مرجعية <span className="text-[#ba1a1a]">*</span></label>
              <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-[#004ac6] rounded-xl cursor-pointer bg-[#f1f3ff] hover:bg-[#e1e8fd] transition-all">
                <div className="flex flex-col items-center justify-center">
                  {form.photo ? (
                    <div className="flex flex-col items-center text-[#004ac6]">
                      <ImageIcon className="w-7 h-7 mb-1.5" />
                      <p className="text-[14px] font-medium truncate max-w-xs px-4">{form.photo.name}</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-[#004ac6] mb-1.5" />
                      <p className="text-[14px] text-[#434655]">انقر للرفع أو اسحب هنا</p>
                      <p className="text-[12px] text-[#737686]">JPG · PNG · WEBP</p>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" required
                  onChange={(e) => setForm(p => ({ ...p, photo: e.target.files[0] }))} />
              </label>
            </div>
          )}

          <button type="submit" disabled={formLoading}
            className="w-full bg-[#004ac6] hover:bg-[#2563eb] text-[#ffffff] font-semibold text-[14px] py-4 rounded-xl transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
            {formLoading ? 'جاري التنفيذ...' : (modalConfig.isEdit ? 'اعتماد التحديثات' : 'حفظ وإضافة الشاشة')}
          </button>
        </form>
      </Modal>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="إزالة الشاشة من الشبكة"
        message="هل أنت متأكد من حذف هذه الشاشة؟ سيؤدي ذلك إلى إيقاف كافة الحملات المرتبطة بشكل فوري."
        confirmText="نعم، تنفيذ الإسقاط"
      />

      <ScreenCommandModal isOpen={!!commandTarget} onClose={() => setCommandTarget(null)} screen={commandTarget} />

      {/* ── Image Preview Modal ── */}
      <Modal isOpen={!!showImageModal} onClose={() => setShowImageModal(null)} title="استعراض الصورة">
        <div className="flex justify-center bg-[#f9f9ff] rounded-2xl border border-[#c3c6d7] overflow-hidden shadow-inner p-2">
          {showImageModal && (
            <img src={showImageModal} alt="Preview" className="max-w-full h-auto object-contain max-h-[60vh] rounded" />
          )}
        </div>
        <button onClick={() => setShowImageModal(null)}
          className="mt-4 w-full bg-[#f1f3ff] text-[#004ac6] font-semibold py-3 rounded-xl hover:bg-[#dce2f7] transition-colors border border-[#dce2f7]">
          إنهاء المعاينة
        </button>
      </Modal>
    </div>
  );
};

export default ScreensPage;
