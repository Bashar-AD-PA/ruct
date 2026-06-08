import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Bell, User as UserIcon, Menu } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import usePermission from '../../hooks/usePermission';
import { getNavItems } from '../../core/routes/navigation';

/* Original brand turquoise */
const TEAL = '#145D6A';
const TEAL_DARK = '#0e4450';
const GOLD = '#C4A052';

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

    const SidebarInner = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo/Brand header */}
            <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: '#fff',
                    border: `2px solid ${GOLD}`,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <img
                        src="/src/assets/images/Main_app_logo.png"
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                        SabaControl
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.5)', direction: 'rtl' }}>
                        {user?.full_name || 'لوحة التحكم'}
                    </p>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                            background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                            textDecoration: 'none',
                            transition: 'all 0.18s ease',
                            direction: 'rtl',
                            borderRight: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                        })}
                        onMouseEnter={e => {
                            if (!e.currentTarget.classList.contains('active')) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!e.currentTarget.style.borderRight.includes(GOLD)) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                            }
                        }}
                    >
                        <item.icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout button */}
            <div style={{
                padding: '12px 14px 16px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
            }}>
                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.65)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        direction: 'rtl',
                    }}
                    onMouseEnter={e => {
                        e.target.style.background = 'rgba(255,255,255,0.18)';
                        e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                        e.target.style.background = 'rgba(255,255,255,0.08)';
                        e.target.style.color = 'rgba(255,255,255,0.65)';
                    }}
                >
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );

    return (
        /* ── Outer wrapper: LTR so sidebar stays on LEFT ── */
        <div style={{
            display: 'flex',
            minHeight: '100svh',
            background: '#F9F9F9',
            direction: 'ltr',          /* sidebar LEFT, content RIGHT */
        }}>
            {/* ════ Desktop Sidebar (LEFT) ════ */}
            <aside style={{
                width: '230px',
                flexShrink: 0,
                background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100svh',
                overflowY: 'auto',
                boxShadow: '2px 0 16px rgba(0,0,0,0.15)',
                zIndex: 50,
            }} className="ds-sidebar">
                <SidebarInner />
            </aside>

            {/* ════ Right column: header + content ════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* ── Top Header ── */}
                <header style={{
                    height: '64px',
                    background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                    borderBottom: `2px solid rgba(255,255,255,0.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                }}>
                    {/* Left: mobile hamburger */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        className="mob-toggle"
                    >
                        <Menu style={{ width: 18, height: 18, color: '#fff' }} />
                    </button>

                    {/* Center: logo */}
                    <div
                        onClick={() => navigate('/dashboard')}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{
                            width: 46, height: 46, borderRadius: '50%',
                            background: '#fff',
                            border: `2.5px solid ${GOLD}`,
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        }}>
                            <img
                                src="/src/assets/images/Main_app_logo.png"
                                alt="Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
                            />
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Notifications */}
                        <button
                            onClick={() => navigate('/dashboard/notifications')}
                            style={{
                                position: 'relative',
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '10px',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                            }}
                            title="الإشعارات"
                        >
                            <Bell style={{ width: 18, height: 18, color: '#fff' }} />
                            <span style={{
                                position: 'absolute', top: 7, right: 8,
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#ff4d4d',
                                border: `1.5px solid ${TEAL}`,
                            }} />
                        </button>

                        {/* Profile avatar */}
                        <button
                            onClick={() => navigate('/dashboard/profile')}
                            style={{
                                width: 36, height: 36, borderRadius: '50%',
                                border: `2px solid ${GOLD}`,
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                            title="الملف الشخصي"
                        >
                            <UserIcon style={{ width: 17, height: 17, color: GOLD }} />
                        </button>
                    </div>
                </header>

                {/* ── Page Content ── */}
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px 24px 56px',
                    direction: 'rtl',   /* page content is RTL/Arabic */
                }} className="custom-scrollbar">
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* ════ Mobile Drawer (slides from LEFT) ════ */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, bottom: 0,
                width: '240px',
                background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                zIndex: 110,
                transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: isMobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.25)' : 'none',
            }}>
                <SidebarInner />
            </div>

            {/* ════ Mobile Bottom Nav ════ */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '60px',
                background: TEAL,
                borderTop: '1px solid rgba(255,255,255,0.15)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 90,
            }} className="mob-bottom">
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
                            color: isActive ? GOLD : 'rgba(255,255,255,0.55)',
                            fontSize: '9px',
                            fontWeight: isActive ? 700 : 400,
                            borderTop: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
                            padding: '6px 0',
                            transition: 'all 0.18s',
                        })}
                    >
                        <item.icon style={{ width: 20, height: 20 }} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Responsive rules */}
            <style>{`
                @media (min-width: 768px) {
                    .ds-sidebar   { display: flex !important; }
                    .mob-toggle   { display: none !important; }
                    .mob-bottom   { display: none !important; }
                }
                @media (max-width: 767px) {
                    .ds-sidebar   { display: none !important; }
                    .mob-bottom   { display: flex !important; }
                    main { padding-bottom: 72px !important; }
                }
            `}</style>
        </div>
    );
};

export default DashboardLayout;
