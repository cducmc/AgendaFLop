/**
 * =============================================================================
 * APP - Componente Principal de la Aplicación
 * =============================================================================
 * 
 * Sistema de rutas con autenticación JWT:
 * - /login : Inicio de sesión
 * - /register : Registro de negocio
 * - / : Dashboard (protegido)
 * - /appointments : Lista de citas (protegido)
 * - /calendar : Calendario visual (protegido)
 * 
 * AuthProvider envuelve toda la app para manejar estado global
 * =============================================================================
 */

import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  LogOut,
  Users,
  Briefcase,
  Settings as SettingsIcon,
  BarChart3,
  Clock3,
  Link as LinkIcon,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  UserCircle2,
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppointmentsList from './pages/AppointmentsList';
import CalendarView from './pages/CalendarView';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Professionals from './pages/Professionals';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Availability from './pages/Availability';
import PublicBooking from './pages/PublicBooking';
import PlatformDashboard from './pages/PlatformDashboard';
import Footer from './components/Footer';
import NotificationBell from './components/NotificationBell';
import OnboardingWizard from './components/OnboardingWizard';

/**
 * Componente de navegación con resaltado de ruta activa
 * Solo visible cuando el usuario está autenticado
 */
/**
 * =============================================================================
 * NAVIGATION - Componente de navegación principal
 * =============================================================================
 * 
 * Barra de navegación con:
 * - Links a todas las secciones principales
 * - Resaltado de ruta activa con gradiente de colores personalizados
 * - Hover effects con color secundario
 * - Información del usuario y botón de logout
 * 
 * =============================================================================
 */
function SidebarNav({ collapsed = false, onNavigate }) {
  const location = useLocation();
  const { user, business } = useAuth();

  const canAccessCatalog = ['business_owner', 'manager'].includes(user?.role);
  const canAccessClients = ['business_owner', 'manager', 'receptionist'].includes(user?.role);
  const canAccessReports = ['business_owner', 'manager'].includes(user?.role);
  const canAccessSettings = ['business_owner', 'manager'].includes(user?.role);
  const canAccessAvailability = ['business_owner', 'manager'].includes(user?.role);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  if (user?.role === 'super_admin') {
    return null;
  }

  const sections = [
    {
      title: 'GENERAL',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
        { path: '/appointments', label: 'Citas', icon: Calendar, show: true },
        { path: '/calendar', label: 'Calendario', icon: CalendarDays, show: true },
      ],
    },
    {
      title: 'NEGOCIO',
      items: [
        { path: '/services', label: 'Servicios', icon: Briefcase, show: canAccessCatalog },
        { path: '/clients', label: 'Clientes', icon: Users, show: canAccessClients },
        { path: '/professionals', label: 'Profesionales', icon: Users, show: canAccessCatalog },
      ],
    },
    {
      title: 'ANALITICA',
      items: [{ path: '/reports', label: 'Reportes', icon: BarChart3, show: canAccessReports }],
    },
    {
      title: 'CONFIGURACION',
      items: [
        { path: '/availability', label: 'Disponibilidad', icon: Clock3, show: canAccessAvailability },
        { path: '/settings', label: 'Ajustes', icon: SettingsIcon, show: canAccessSettings },
      ],
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className={`border-b border-slate-200 px-4 py-4 ${collapsed ? 'items-center' : ''}`}>
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          {business?.logo ? (
            <img
              src={`http://127.0.0.1:8000${business.logo}`}
              alt={business.name}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">{business?.name?.charAt(0) || 'A'}</span>
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{business?.name || 'AgendaFlop'}</p>
              <p className="truncate text-xs text-slate-500">Panel de gestion</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-5">
              {!collapsed && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      title={collapsed ? item.label : ''}
                      className={`group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        collapsed ? 'justify-center' : 'gap-2.5'
                      } ${
                        active
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function TopbarActions() {
  const { business } = useAuth();

  const publicBookingUrl = business?.slug
    ? `${window.location.origin}/book/${business.slug}`
    : '';

  const handleOpenPublicBooking = async () => {
    if (!publicBookingUrl) return;
    await navigator.clipboard.writeText(publicBookingUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(`Hola, puedes agendar tu cita aquí: ${publicBookingUrl}`)}`, '_blank', 'noopener,noreferrer');
  };

  if (!business?.slug) {
    return null;
  }

  return (
    <button
      onClick={handleOpenPublicBooking}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
      title="Compartir link publico"
    >
      <LinkIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Link publico</span>
    </button>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (user?.role === 'super_admin') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 transition hover:bg-slate-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <UserCircle2 className="h-5 w-5" />
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[140px] truncate text-sm font-semibold text-slate-800">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-slate-500">Mi cuenta</p>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg" role="menu">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
            role="menuitem"
          >
            Mi cuenta
          </button>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
            role="menuitem"
          >
            Ajustes
          </Link>
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            role="menuitem"
          >
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Layout para páginas protegidas (con header y footer)
 */
function ProtectedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const contentOffsetClass = sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72';
  
  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          onNavigate={() => setMobileSidebarOpen(false)}
        />
      </aside>

      {mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          aria-label="Cerrar sidebar"
        />
      )}

      <div className={`transition-all duration-300 ${contentOffsetClass}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
                aria-label="Colapsar sidebar"
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
              <span className="text-sm font-semibold text-slate-700">Panel de gestion</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <TopbarActions />
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] p-4 sm:p-6">
          {children}
        </main>

        <Footer />
      </div>

      <button
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed right-4 top-4 z-[60] rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow transition lg:hidden ${
          mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Cerrar menu"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Home redirect - Redirige según el rol del usuario
 */
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // super_admin va a /platform, otros roles van a /dashboard
  if (user?.role === 'super_admin') {
    return <Navigate to="/platform" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas (auth) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Home redirect - Redirige según rol */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            }
          />

          {/* Platform Dashboard - Solo para super_admin */}
          <Route
            path="/platform"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <PlatformDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dashboard de Negocio - Para todos excepto super_admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager', 'professional', 'receptionist']}>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager', 'professional', 'receptionist']}>
                <ProtectedLayout>
                  <AppointmentsList />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager', 'professional', 'receptionist']}>
                <ProtectedLayout>
                  <CalendarView />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <ProtectedLayout>
                  <Services />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager', 'receptionist']}>
                <ProtectedLayout>
                  <Clients />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/professionals"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <ProtectedLayout>
                  <Professionals />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <ProtectedLayout>
                  <Reports />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/availability"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <ProtectedLayout>
                  <Availability />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          {/* Onboarding Wizard - Para nuevos usuarios */}
          <Route
            path="/onboarding-wizard"
            element={
              <ProtectedRoute allowedRoles={['business_owner', 'manager']}>
                <OnboardingWizard 
                  onComplete={() => window.location.href = '/dashboard'}
                  onDismiss={() => window.location.href = '/dashboard'}
                />
              </ProtectedRoute>
            }
          />

          {/* Ruta pública: Portal de reservas */}
          <Route path="/book/:businessSlug" element={<PublicBooking />} />

          {/* Ruta por defecto: redirect a home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
