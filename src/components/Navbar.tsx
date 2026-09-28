import React from 'react';
import { ActiveTab } from '../types';
import { 
  Trophy, 
  PlusCircle, 
  MapPin, 
  BookOpen, 
  ShieldCheck, 
  Waves,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminLoggedIn: boolean;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn
}) => {
  const navItems: NavItem[] = [
    { id: 'record', label: '기록 등록', icon: PlusCircle },
    { id: 'leaderboard', label: '랭킹 & 통계', icon: Trophy },
    { id: 'gps', label: 'GPS 트래커', icon: MapPin },
    { id: 'guide', label: '훈련 가이드', icon: BookOpen },
    { 
      id: 'admin', 
      label: isAdminLoggedIn ? '관리자 (인증됨)' : '교사 관리자', 
      icon: ShieldCheck,
      badge: isAdminLoggedIn ? 'ON' : undefined
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-cyan-100/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & School Header */}
          <div 
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <Waves className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-500" />
                  전남 신안군
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                  사제동행 건강마일리지
                </span>
              </div>
              <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 bg-clip-text text-transparent leading-tight">
                신안해양과학고 러닝
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-sm shadow-slate-200'
                      : 'text-slate-600 hover:text-blue-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Badge */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-200/50 text-xs font-medium text-cyan-900">
              <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
              <span>사제동행 함께 달리기 On-Air</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-cyan-600 bg-cyan-50/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="truncate max-w-[58px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
