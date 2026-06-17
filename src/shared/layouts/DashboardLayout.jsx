import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, Menu, LogOut, Grid } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePermission from '../../hooks/usePermission';
import { getNavItems } from '../../core/routes/navigation';

/* ─── Stitch colour tokens ─── */
const S = {
    primary: '#004ac6',
    primaryContainer: '#2563eb',
    surface: '#f9f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f3ff',
    surfaceContainer: '#e9edff',
    surfaceContainerHigh: '#e1e8fd',
    surfaceContainerHighest: '#dce2f7',
    onBackground: '#141b2b',
    onSurface: '#141b2b',
    onSurfaceVariant: '#434655',
    outline: '#737686',
    outlineVariant: '#c3c6d7',
    error: '#ba1a1a',
    sidebarBg: '#141b2b',   /* on-background used as dark sidebar */
    sidebarText: 'rgba(220,226,247,0.85)',
    sidebarTextActive: '#ffffff',
    sidebarActiveAccent: '#2563eb',
};

const DashboardLayout = () => {
    const { user, logout } = useAuthStore();
    const { roleName } = usePermission();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = getNavItems(roleName);

    /* ── Sidebar inner content (shared by desktop + mobile drawer) ── */
    const SidebarInner = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* ── Brand header: centred SC circle + title ── */}
            <div style={{
                padding: '28px 16px 20px',
                borderBottom: '1px solid rgba(220,226,247,0.12)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
            }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: '#dce2f7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '2px',
                }}>
                    <img
                        src="/src/assets/images/Main_app_logo.png"
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML =
                                '<span style="color:#004ac6;font-size:22px;font-weight:800;font-family:sans-serif">SC</span>';
                        }}
                    />
                </div>
                <h1 style={{
                    margin: 0, fontSize: '22px', fontWeight: 700,
                    color: '#ffffff', textAlign: 'center',
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}>SabaControl</h1>
                <p style={{
                    margin: 0, fontSize: '13px',
                    color: 'rgba(220,226,247,0.65)', textAlign: 'center',
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}>لوحة تحكم سبأ</p>
            </div>

            {/* ── Nav links ── */}
            <nav style={{
                flex: 1, overflowY: 'auto',
                padding: '16px 0',
                display: 'flex', flexDirection: 'column', gap: '1px',
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: '14px',
                            padding: '14px 24px',
                            fontSize: '16px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#ffffff' : 'rgba(220,226,247,0.75)',
                            background: isActive ? 'rgba(220,226,247,0.10)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                            direction: 'rtl',
                            borderRight: isActive ? '4px solid #2563eb' : '4px solid transparent',
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        })}
                        onMouseEnter={e => {
                            const el = e.currentTarget;
                            if (el.style.fontWeight === '700') return;
                            el.style.background = 'rgba(220,226,247,0.07)';
                            el.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget;
                            if (el.style.fontWeight === '700') return;
                            el.style.background = 'transparent';
                            el.style.color = 'rgba(220,226,247,0.75)';
                        }}
                    >
                        <item.icon style={{ width: 22, height: 22, flexShrink: 0 }} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* ── Logout ── */}
            <div style={{ padding: '12px 16px 20px', borderTop: '1px solid rgba(220,226,247,0.10)' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', padding: '9px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(195,198,215,0.25)',
                        background: 'transparent',
                        color: 'rgba(220,226,247,0.65)',
                        fontSize: '15px', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        direction: 'rtl',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,226,247,0.08)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(220,226,247,0.65)'; }}
                >
                    <LogOut style={{ width: 18, height: 18 }} />
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            minHeight: '100svh',
            background: S.surface,
            direction: 'rtl',
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        }}>
            {/* ════ Desktop Sidebar ════ */}
            <aside
                className="ds-sidebar"
                style={{
                    width: '250px',
                    flexShrink: 0,
                    background: S.sidebarBg,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'sticky',
                    top: 0,
                    height: '100svh',
                    overflowY: 'auto',
                    boxShadow: '-2px 0 20px rgba(0,0,0,0.18)',
                    zIndex: 50,
                }}
            >
                <SidebarInner />
            </aside>

            {/* ════ Main column: header + content ════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, direction: 'ltr' }}>

                {/* ── Top Header ── */}
                <header style={{
                    height: '64px',
                    background: S.surfaceContainerLowest,
                    borderBottom: `1px solid ${S.outlineVariant}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    direction: 'rtl',
                }}>
                    {/* Right: mobile hamburger */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="mob-toggle"
                        style={{
                            background: S.surfaceContainerLow,
                            border: `1px solid ${S.outlineVariant}`,
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Menu style={{ width: 18, height: 18, color: S.onSurfaceVariant }} />
                    </button>

                    {/* Center logo (mobile) / App brand (desktop show) */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <div style={{
                            width: 38, height: 38,
                            borderRadius: '10px',
                            background: S.primaryContainer,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.30)',
                        }}>
                            <img
                                src="/src/assets/images/Main_app_logo.png"
                                alt="Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '<span style="color:#fff;font-size:13px;font-weight:800">SC</span>';
                                }}
                            />
                        </div>
                        <div>
                            <p style={{
                                margin: 0,
                                fontSize: '15px', fontWeight: 700,
                                color: S.primary,
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                lineHeight: 1.1,
                            }}>
                                SabaControl
                            </p>
                            <p style={{
                                margin: 0, fontSize: '9px',
                                color: S.outline, textTransform: 'uppercase', letterSpacing: '0.12em',
                                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                            }}>
                                Smart Advertising
                            </p>
                        </div>
                    </div>

                    {/* Left: action icons + profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', direction: 'ltr' }}>

                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/dashboard/notifications')}
                            title="الإشعارات"
                            style={{
                                position: 'relative',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                width: 38, height: 38,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                color: S.onSurfaceVariant,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Bell style={{ width: 20, height: 20 }} />
                            {/* red dot */}
                            <span style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 7, height: 7, borderRadius: '50%',
                                background: S.error,
                                border: `1.5px solid ${S.surfaceContainerLowest}`,
                            }} />
                        </button>

                        {/* Grid / apps */}
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                width: 38, height: 38,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                color: S.onSurfaceVariant,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <Grid style={{ width: 18, height: 18 }} />
                        </button>

                        {/* Divider */}
                        <div style={{
                            width: 1, height: 28,
                            background: S.outlineVariant,
                            margin: '0 4px',
                        }} />

                        {/* Profile chip */}
                        <button
                            onClick={() => navigate('/dashboard/profile')}
                            title="الملف الشخصي"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'transparent',
                                border: `1px solid ${S.outlineVariant}`,
                                borderRadius: '999px',
                                padding: '4px 14px 4px 4px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                direction: 'rtl',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = S.surfaceContainerLow}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {/* text */}
                            <div style={{ textAlign: 'right' }}>
                                <p style={{
                                    margin: 0, fontSize: '13px', fontWeight: 600,
                                    color: S.onSurface,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                    lineHeight: 1.2,
                                }}>
                                    {user?.full_name || 'مدير النظام'}
                                </p>
                                <p style={{
                                    margin: 0, fontSize: '10px',
                                    color: S.onSurfaceVariant,
                                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                                }}>
                                    {roleName || 'Admin'}
                                </p>
                            </div>
                            {/* avatar */}
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: S.surfaceContainerHigh,
                                border: `1.5px solid ${S.outlineVariant}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <UserIcon style={{ width: 16, height: 16, color: S.primary }} />
                            </div>
                        </button>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <main
                    className="custom-scrollbar"
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px 28px 56px',
                        direction: 'rtl',
                        background: S.surface,
                    }}
                >
                    <div style={{ maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* ════ Mobile Overlay ════ */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* ════ Mobile Drawer ════ */}
            <div style={{
                position: 'fixed',
                top: 0, right: 0, bottom: 0,
                width: '250px',
                background: S.sidebarBg,
                zIndex: 110,
                transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isMobileMenuOpen ? '-4px 0 24px rgba(0,0,0,0.25)' : 'none',
            }}>
                <SidebarInner />
            </div>

            {/* ════ Mobile Bottom Nav ════ */}
            <div
                className="mob-bottom"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '60px',
                    background: S.sidebarBg,
                    borderTop: `1px solid rgba(220,226,247,0.12)`,
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    zIndex: 90,
                }}
            >
                {navItems.slice(0, 5).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        style={({ isActive }) => ({
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            textDecoration: 'none',
                            color: isActive ? S.primaryContainer : 'rgba(220,226,247,0.5)',
                            fontSize: '9px',
                            fontWeight: isActive ? 700 : 400,
                            borderTop: isActive ? `2px solid ${S.primaryContainer}` : '2px solid transparent',
                            padding: '6px 0',
                            transition: 'all 0.15s',
                            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        })}
                    >
                        <item.icon style={{ width: 20, height: 20 }} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Responsive CSS */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');
                @media (min-width: 768px) {
                    .ds-sidebar   { display: flex !important; }
                    .mob-toggle   { display: none !important; }
                    .mob-bottom   { display: none !important; }
                }
                @media (max-width: 767px) {
                    .ds-sidebar   { display: none !important; }
                    .mob-bottom   { display: flex !important; }
                    main { padding-bottom: 72px !important; }
                    .mob-toggle   { display: flex !important; }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
