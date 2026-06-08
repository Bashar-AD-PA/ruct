import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, PlayCircle, DollarSign, Users, AlertCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosClient from '../../core/api/axiosClient';
import { ENDPOINTS } from '../../core/api/endpoints';
import useToastStore from '../../store/useToastStore';

/* ── Colour palette matching the reference image ── */
const C = {
  darkGreen : '#1c3a2d',
  midGreen  : '#2e5e45',
  cream     : '#f7f2e8',
  cardBg    : '#faf6ec',
  gold      : '#c8a84b',
  goldLight : '#e6d08a',
  goldDark  : '#9a7b2e',
  border    : '#d4c07a',
  textDark  : '#1e2a1a',
  textMid   : '#4a6340',
  textLight : '#8a9e7a',
  white     : '#ffffff',
};

/* ══════════════════════════════════════════════════════
   KPI CARD  (matches the gold-bordered cards in image)
══════════════════════════════════════════════════════ */
const KpiCard = ({ label, sublabel, value, valueSmall, note, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay: index * 0.08 }}
    whileHover={{ y: -4, boxShadow: '0 16px 40px -8px rgba(200,168,75,0.30)' }}
    className="relative flex flex-col justify-between rounded-2xl overflow-hidden cursor-default select-none"
    style={{
      background : `linear-gradient(145deg, ${C.cardBg} 0%, #f0e8d0 100%)`,
      border     : `1.5px solid ${C.border}`,
      boxShadow  : '0 4px 18px -4px rgba(200,168,75,0.18)',
      padding    : '18px 22px 16px',
      minHeight  : '110px',
    }}
  >
    {/* top gold accent strip */}
    <div
      style={{
        position : 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg,${C.goldDark},${C.gold},${C.goldLight},${C.gold},${C.goldDark})`,
      }}
    />
    {/* label row */}
    <div className="flex items-center justify-between">
      <p style={{ fontSize: '11px', fontWeight: 700, color: C.textMid, letterSpacing: '0.03em', direction: 'rtl' }}>
        {label}
      </p>
      {sublabel && (
        <p style={{ fontSize: '10px', color: C.textLight, fontStyle: 'italic' }}>{sublabel}</p>
      )}
    </div>

    {/* big number */}
    <div className="flex items-baseline gap-1" style={{ direction: 'ltr' }}>
      <span style={{ fontSize: '30px', fontWeight: 900, color: C.darkGreen, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </span>
      {valueSmall && (
        <span style={{ fontSize: '15px', fontWeight: 700, color: C.goldDark }}>{valueSmall}</span>
      )}
    </div>

    {/* note */}
    {note && (
      <p style={{ fontSize: '10px', color: C.textLight, marginTop: '2px', direction: 'rtl' }}>{note}</p>
    )}

    {/* decorative circle */}
    <div
      style={{
        position: 'absolute', bottom: '-20px', right: '-20px',
        width: '70px', height: '70px', borderRadius: '50%',
        background: `radial-gradient(circle,${C.gold}22,transparent 70%)`,
      }}
    />
  </motion.div>
);

/* ══════════════════════════════════════════════════════
   WEEKLY REVENUE SVG CHART
══════════════════════════════════════════════════════ */
const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WeeklyChart = ({ weeklyRevenue = [] }) => {
  const svgRef = useRef(null);
  const [tip, setTip] = useState(null);

  const W = 580, H = 200, pL = 52, pR = 16, pT = 16, pB = 32;
  const iW = W - pL - pR, iH = H - pT - pB;

  // API returns [{day, amount}] objects — normalise to {label, value}
  const pts = weeklyRevenue.length > 0
    ? weeklyRevenue.map(item => ({
        label : item.day   ?? item.label ?? '',
        value : Number(item.amount ?? item.value ?? item ?? 0),
      }))
    : WEEK_DAYS.map(d => ({ label: d, value: 0 }));

  const maxV  = Math.max(...pts.map(p => p.value), 1);
  const xOf   = i => pL + (i / (pts.length - 1)) * iW;
  const yOf   = v => pT + iH - (v / maxV) * iH;
  const coords = pts.map((p, i) => [xOf(i), yOf(p.value)]);

  /* smooth bezier */
  const makePath = (arr) => {
    if (arr.length < 2) return '';
    let d = `M ${arr[0][0]} ${arr[0][1]}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const mx = (arr[i][0] + arr[i + 1][0]) / 2;
      d += ` C ${mx} ${arr[i][1]}, ${mx} ${arr[i + 1][1]}, ${arr[i + 1][0]} ${arr[i + 1][1]}`;
    }
    return d;
  };

  const linePath  = makePath(coords);
  const areaPath  = `${linePath} L ${coords[coords.length-1][0]} ${pT+iH} L ${coords[0][0]} ${pT+iH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    v : maxV * r,
    y : pT + iH - r * iH,
  }));

  const onMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) * (W / rect.width);
    let best = 0;
    coords.forEach((c, i) => { if (Math.abs(c[0] - mx) < Math.abs(coords[best][0] - mx)) best = i; });
    setTip({ x: coords[best][0], y: coords[best][1], label: pts[best].label, value: pts[best].value });
  };

  return (
    <div style={{ direction: 'ltr', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', overflow: 'visible' }}
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      >
        <defs>
          <linearGradient id="wkArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={C.midGreen}  stopOpacity="0.6" />
            <stop offset="60%"  stopColor={C.midGreen}  stopOpacity="0.25" />
            <stop offset="100%" stopColor={C.cream}      stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wkLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={C.goldDark} />
            <stop offset="50%"  stopColor={C.midGreen} />
            <stop offset="100%" stopColor={C.goldDark} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pL} y1={t.y} x2={W-pR} y2={t.y}
              stroke={C.border} strokeOpacity="0.3" strokeDasharray="4 4" strokeWidth="1" />
            <text x={pL-6} y={t.y+4} textAnchor="end" fontSize="9.5" fill={C.textLight} fontFamily="'Segoe UI',sans-serif">
              {t.v >= 1000 ? `$${(t.v/1000).toFixed(1)}k` : `$${Math.round(t.v)}`}
            </text>
          </g>
        ))}

        {/* area */}
        <path d={areaPath} fill="url(#wkArea)" />

        {/* line */}
        <path d={linePath} fill="none" stroke="url(#wkLine)" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />

        {/* dots */}
        {coords.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6"  fill={C.cardBg}  stroke={C.gold} strokeWidth="2.5" />
            <circle cx={x} cy={y} r="2.8" fill={C.gold} />
          </g>
        ))}

        {/* x labels */}
        {pts.map((p, i) => (
          <text key={i} x={xOf(i)} y={H-4} textAnchor="middle" fontSize="10" fill={C.textMid} fontFamily="'Segoe UI',sans-serif">
            {p.label}
          </text>
        ))}

        {/* tooltip */}
        {tip && (
          <g>
            <line x1={tip.x} y1={pT} x2={tip.x} y2={pT+iH}
              stroke={C.gold} strokeOpacity="0.45" strokeDasharray="4 3" />
            <circle cx={tip.x} cy={tip.y} r="8" fill={C.gold} fillOpacity="0.2" />
            <circle cx={tip.x} cy={tip.y} r="4" fill={C.gold} />
            <rect x={tip.x-36} y={tip.y-34} width="72" height="22" rx="6"
              fill={C.darkGreen} stroke={C.gold} strokeWidth="1" />
            <text x={tip.x} y={tip.y-19} textAnchor="middle" fontSize="11"
              fill={C.white} fontWeight="bold" fontFamily="'Segoe UI',sans-serif">
              ${tip.value.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DONUT CHART  (Screens by Governorate)
══════════════════════════════════════════════════════ */
const GOV_COLORS = [C.midGreen, C.gold, C.goldLight, '#8fbc8f', '#a08c4a'];

const DonutChart = ({ data = [] }) => {
  const [hov, setHov] = useState(null);
  const cx = 90, cy = 90, R = 68, r = 40;
  const total = data.reduce((s, d) => s + (d.count || 0), 0) || 1;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const pct  = d.count / total;
    const a1   = angle;
    const a2   = angle + pct * 2 * Math.PI;
    const R2   = hov === i ? R + 7 : R;
    const lrg  = pct > 0.5 ? 1 : 0;
    const x1=cx+R2*Math.cos(a1), y1=cy+R2*Math.sin(a1);
    const x2=cx+R2*Math.cos(a2), y2=cy+R2*Math.sin(a2);
    const xi1=cx+r*Math.cos(a1), yi1=cy+r*Math.sin(a1);
    const xi2=cx+r*Math.cos(a2), yi2=cy+r*Math.sin(a2);
    angle = a2;
    return {
      path  : `M ${xi1} ${yi1} L ${x1} ${y1} A ${R2} ${R2} 0 ${lrg} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${lrg} 0 ${xi1} ${yi1} Z`,
      color : GOV_COLORS[i % GOV_COLORS.length],
      name  : d.name,
      pct   : Math.round(pct * 100),
    };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 180 180" style={{ width: '150px', height: '150px', direction: 'ltr' }}>
        <defs>
          <filter id="ds"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={C.darkGreen} floodOpacity="0.18"/></filter>
        </defs>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
            filter="url(#ds)"
            style={{ cursor:'pointer', transition:'all 0.2s', opacity: hov === null || hov === i ? 1 : 0.5 }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          />
        ))}
        {/* center */}
        <text x={cx} y={cy-5} textAnchor="middle" fontSize="18" fontWeight="900" fill={C.darkGreen} fontFamily="sans-serif">
          {total > 1 ? `${slices[hov ?? 0]?.pct ?? ''}%` : ''}
        </text>
        {total === 1 && (
          <text x={cx} y={cy+5} textAnchor="middle" fontSize="14" fontWeight="900" fill={C.darkGreen}>100%</text>
        )}
        {hov === null && (
          <text x={cx} y={cy+6} textAnchor="middle" fontSize="10" fill={C.textLight} fontFamily="sans-serif">إجمالي</text>
        )}
        {hov !== null && (
          <text x={cx} y={cy+14} textAnchor="middle" fontSize="9" fill={C.textLight} fontFamily="sans-serif">
            {slices[hov]?.name}
          </text>
        )}
      </svg>

      {/* legend list */}
      <div className="flex flex-col gap-1.5 w-full px-1">
        {slices.map((s, i) => (
          <div key={i}
            className="flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer transition-all"
            style={{ background: hov === i ? `${s.color}22` : 'transparent' }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          >
            <span style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
            <span style={{ fontSize:'11px', color:C.textDark, flex:1, direction:'rtl' }}>{s.name}</span>
            <span style={{ fontSize:'11px', fontWeight:700, color:s.color }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   SKELETON
══════════════════════════════════════════════════════ */
const DashboardSkeleton = () => (
  <div style={{ direction: 'rtl', padding: '8px' }}>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'16px' }}>
      {[...Array(4)].map((_,i) => (
        <div key={i} className="animate-pulse rounded-2xl"
          style={{ height:'110px', background:`${C.border}44`, border:`1.5px solid ${C.border}` }} />
      ))}
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'16px' }}>
      <div className="animate-pulse rounded-2xl" style={{ height:'260px', background:`${C.border}44` }} />
      <div className="animate-pulse rounded-2xl" style={{ height:'260px', background:`${C.border}44` }} />
    </div>
    <div className="animate-pulse rounded-2xl" style={{ height:'200px', background:`${C.border}44` }} />
  </div>
);

/* ══════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  /* table */
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const PER = 8;

  /* gov filter dropdown */
  const [govSel, setGovSel] = useState('all');

  const addToast = useToastStore(s => s.addToast);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const res = await axiosClient.get(ENDPOINTS.DASHBOARD.OVERVIEW);
      setData(res.data.data || res.data);
    } catch (e) {
      console.error(e);
      addToast('لم نتمكن من جلب بيانات لوحة التحكم', 'error');
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <DashboardSkeleton />;

  if (error && !data) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 16px', direction:'rtl', gap:'16px', textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:20, background:`${C.gold}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <AlertCircle style={{ width:36, height:36, color:C.goldDark }} />
      </div>
      <h3 style={{ fontSize:18, fontWeight:900, color:C.darkGreen }}>تعذر تحميل بيانات اللوحة</h3>
      <p  style={{ fontSize:13, color:C.textMid }}>يرجى التحقق من الاتصال والمحاولة مرة أخرى.</p>
      <button onClick={load}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 28px', borderRadius:12, background:C.darkGreen, color:'#fff', fontSize:13, fontWeight:700, border:'none', cursor:'pointer' }}>
        <RefreshCw style={{ width:16, height:16 }} /> إعادة المحاولة
      </button>
    </div>
  );

  /* Derived */
  const kpis         = data?.kpis                    || {};
  const totalRevenue  = kpis.total_revenue            ?? 0;
  const activeScreens = kpis.active_screens           ?? 0;
  const totalScreens  = kpis.total_screens            ?? 0;
  const pendingAds    = kpis.pending_ads              ?? 0;
  const activeUsers   = kpis.active_users             ?? 0;

  // API nests chart data inside data.charts
  const charts       = data?.charts                          || {};
  const weeklyRevenue  = charts.weekly_revenue               || data?.weekly_revenue          || [];
  const screensByGov   = charts.screens_by_governorate       || data?.screens_by_governorate  || [];

  const rawLogs = data?.recent_logs || [];
  const filtered = rawLogs.filter(l =>
    !search ||
    l.ad_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.screen_name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageLogs   = filtered.slice((page - 1) * PER, page * PER);

  /* Panel styles */
  const panelStyle = {
    background  : `linear-gradient(145deg,${C.cardBg},${C.cream})`,
    border      : `1.5px solid ${C.border}`,
    borderRadius: '16px',
    boxShadow   : '0 4px 20px -4px rgba(200,168,75,0.16)',
    padding     : '18px 20px',
  };

  const headStyle = {
    fontSize  : '14px',
    fontWeight: 800,
    color     : C.darkGreen,
    direction : 'rtl',
    marginBottom: '12px',
    fontFamily: "'Georgia', 'Amiri', serif",
  };

  return (
    <div style={{ direction:'rtl', paddingBottom:'40px', fontFamily:"'Segoe UI',Tahoma,sans-serif" }}>

      {/* ── Page title ── */}
      <motion.div
        initial={{ opacity:0, x:20 }}
        animate={{ opacity:1, x:0 }}
        transition={{ duration:0.4 }}
        style={{ marginBottom:'20px' }}
      >
        <h1 style={{ fontSize:'22px', fontWeight:900, color:C.darkGreen, margin:0, fontFamily:"'Georgia',serif" }}>
          نظرة عامة على لوحة التحكم
        </h1>
        <p style={{ fontSize:'12px', fontStyle:'italic', color:C.gold, margin:'2px 0 0', letterSpacing:'0.05em' }}>
          Dashboard Overview
        </p>
        <div style={{ marginTop:'6px', height:'2px', width:'60px', borderRadius:'99px',
          background:`linear-gradient(90deg,${C.gold},${C.goldLight})` }} />
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'16px' }}>
        <KpiCard
          index={0}
          label="إجمالي الأرباح"
          sublabel="Free Revenue"
          value={`$${Number(totalRevenue).toLocaleString()}`}
        />
        <KpiCard
          index={1}
          label="الشاشات النشطة"
          value={`${activeScreens} / ${totalScreens}`}
          note="شاشة / Connected"
        />
        <KpiCard
          index={2}
          label="إعلانات قيد المراجعة"
          value={pendingAds}
          note="للمراجعة / for review"
        />
        <KpiCard
          index={3}
          label="المستخدمون النشطون"
          value={activeUsers}
          note="Active Users"
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px', marginBottom:'16px' }}>

        {/* Weekly Revenue */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, delay:0.35 }}
          style={panelStyle}
        >
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <p style={headStyle}>الأرباح الأسبوعية الكلية</p>
            <select
              value={govSel}
              onChange={e => setGovSel(e.target.value)}
              style={{
                fontSize:'11px', fontWeight:600, color:C.textDark,
                border:`1px solid ${C.border}`, borderRadius:'8px',
                padding:'4px 10px', background:C.cream, outline:'none', cursor:'pointer',
                direction:'rtl',
              }}
            >
              <option value="all">كل المحافظات</option>
              {screensByGov.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <WeeklyChart weeklyRevenue={weeklyRevenue} />
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, delay:0.45 }}
          style={panelStyle}
        >
          <p style={headStyle}>الشاشات حسب المحافظة</p>
          {screensByGov.length > 0 ? (
            <DonutChart data={screensByGov} />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'160px', gap:'8px' }}>
              <Monitor style={{ width:36, height:36, color:C.textLight, opacity:0.4 }} />
              <p style={{ fontSize:'12px', color:C.textLight }}>لا توجد بيانات</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── RECENT PLAY LOGS ── */}
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, delay:0.55 }}
        style={{ ...panelStyle, padding:0, overflow:'hidden' }}
      >
        {/* Table toolbar */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 18px',
          background:`linear-gradient(90deg,${C.darkGreen}0a,${C.gold}0a)`,
          borderBottom:`1px solid ${C.border}`,
        }}>
          <p style={{ fontSize:'14px', fontWeight:800, color:C.darkGreen, margin:0, direction:'rtl' }}>
            سجلات التشغيل الحديثة
          </p>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', direction:'ltr' }}>
            {/* pagination */}
            <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                style={{
                  width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`,
                  background:C.cream, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', opacity: page === 1 ? 0.35 : 1,
                }}
              >
                <ChevronRight style={{ width:14, height:14, color:C.textDark }} />
              </button>
              <span style={{
                width:28, height:28, borderRadius:8, background:C.darkGreen,
                color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'12px', fontWeight:800,
              }}>{page}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                style={{
                  width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`,
                  background:C.cream, display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', opacity: page === totalPages ? 0.35 : 1,
                }}
              >
                <ChevronLeft style={{ width:14, height:14, color:C.textDark }} />
              </button>
            </div>

            {/* search */}
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              border:`1px solid ${C.border}`, borderRadius:8,
              padding:'5px 10px', background:C.cream,
            }}>
              <Search style={{ width:13, height:13, color:C.textLight }} />
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  background:'transparent', border:'none', outline:'none',
                  fontSize:'12px', width:'110px', color:C.textDark,
                  direction:'rtl',
                }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', whiteSpace:'nowrap', minWidth:'600px' }}>
            <thead>
              <tr style={{ background:`${C.gold}1a`, borderBottom:`1px solid ${C.border}` }}>
                {[
                  { label:'اسم الإعلان',    sub:'AD NAME'      },
                  { label:'اسم الشاشة',     sub:'SCREEN NAME'  },
                  { label:'المدة (الثاني)', sub:'Duration (s)' },
                  { label:'وقت التشغيل',    sub:'TIMESTAMP'    },
                ].map((h, i) => (
                  <th key={i} style={{
                    padding:'10px 18px', textAlign:'right', direction:'rtl',
                    fontSize:'11px', fontWeight:800, color:C.goldDark,
                    letterSpacing:'0.04em',
                  }}>
                    <div>{h.label}</div>
                    <div style={{ fontSize:'9px', fontWeight:600, color:C.textLight, marginTop:'1px' }}>{h.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {pageLogs.length > 0 ? pageLogs.map((log, idx) => (
                  <motion.tr
                    key={`${log.ad_name}-${idx}-${page}`}
                    initial={{ opacity:0, x:8 }}
                    animate={{ opacity:1, x:0 }}
                    exit={{ opacity:0 }}
                    transition={{ duration:0.18, delay: idx * 0.025 }}
                    style={{
                      borderBottom:`1px solid ${C.border}44`,
                      background: idx % 2 === 0 ? 'transparent' : `${C.gold}08`,
                      cursor:'default',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${C.gold}18`}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : `${C.gold}08`}
                  >
                    <td style={{ padding:'10px 18px', fontSize:'13px', fontWeight:600, color:C.darkGreen, direction:'rtl' }}>
                      {log.ad_name || '—'}
                    </td>
                    <td style={{ padding:'10px 18px', fontSize:'12px', color:C.textMid, direction:'rtl' }}>
                      {log.screen_name || '—'}
                    </td>
                    <td style={{ padding:'10px 18px' }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        padding:'3px 10px', borderRadius:'99px',
                        background:`${C.midGreen}18`, color:C.midGreen,
                        border:`1px solid ${C.midGreen}30`,
                        fontSize:'12px', fontWeight:700,
                      }}>
                        {log.duration ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 18px', fontSize:'12px', color:C.textMid, direction:'ltr' }}>
                      {log.playback_timestamp
                        ? new Date(log.playback_timestamp).toLocaleString('en-US', {
                            year:'numeric', month:'2-digit', day:'2-digit',
                            hour:'2-digit', minute:'2-digit', hour12:true,
                          })
                        : '—'}
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding:'48px 16px', textAlign:'center' }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                        <PlayCircle style={{ width:36, height:36, color:C.textLight, opacity:0.4 }} />
                        <p style={{ fontSize:'13px', color:C.textMid }}>
                          {search ? 'لا توجد نتائج للبحث' : 'لا يوجد نشاط مسجل حتى الآن'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 18px', borderTop:`1px solid ${C.border}`,
            fontSize:'11px', color:C.textLight, direction:'rtl',
          }}>
            <span>عرض {pageLogs.length} من {filtered.length} سجل</span>
            <span>صفحة {page} / {totalPages}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
