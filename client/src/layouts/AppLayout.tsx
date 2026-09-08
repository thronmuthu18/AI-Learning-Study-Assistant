import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Files,
  MessageSquare,
  Map,
  HelpCircle,
  TrendingUp,
  Settings,
  Flame,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/materials', label: 'Course Materials', icon: Files },
    { to: '/chat', label: 'AI Study Chat', icon: MessageSquare, badge: 'RAG' },
    { to: '/learning-plans', label: 'Learning Plans', icon: Map },
    { to: '/quizzes', label: 'Quizzes', icon: HelpCircle },
    { to: '/progress', label: 'Progress & Analytics', icon: TrendingUp },
    { to: '/settings', label: 'Settings & Memory', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-panel bg-slate-950/80 border-r border-slate-800/80 p-5 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 ring-1 ring-violet-400/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-tight">
              StudyAssistant<span className="text-violet-400">.AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Personalized AI Tutor</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: active }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active || isActive
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile card */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] bg-slate-950 border-r border-slate-800 p-5 flex flex-col h-full z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-violet-400" />
                <span className="font-bold text-white text-base">StudyAssistant.AI</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-slate-400 hover:text-white lg:hidden rounded-xl hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>Study Space</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-slate-200 capitalize font-medium">
                {location.pathname.replace('/', '') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Study Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold shadow-sm">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Active Streak</span>
            </div>

            {/* Quick Ask AI button */}
            <button
              onClick={() => navigate('/chat')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 border border-violet-500/30 text-xs font-medium transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Ask AI Tutor</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
