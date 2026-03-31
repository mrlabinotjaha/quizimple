import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Zap,
  Users as UsersIcon,
  Store,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface AppHeaderProps {
  onHome?: () => void;
  onTemplateMarket?: () => void;
  onGroups?: () => void;
  onJoinQuiz?: () => void;
  onSettings?: () => void;
  onCreateQuiz?: () => void;
}

export function AppHeader({ onHome, onTemplateMarket, onGroups, onJoinQuiz, onSettings, onCreateQuiz }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={onHome} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#1E1E2E] dark:text-white hidden md:block" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Quizimple
            </span>
          </button>

          {/* Center Nav */}
          <nav className="flex items-center gap-1">
            {onJoinQuiz && (
              <button onClick={onJoinQuiz} className="flex items-center gap-1.5 px-3 py-2 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors rounded-lg hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10">
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Join Quiz</span>
              </button>
            )}
            {onTemplateMarket && (
              <button onClick={onTemplateMarket} className="flex items-center gap-1.5 px-3 py-2 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors rounded-lg hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </button>
            )}
            {onGroups && (
              <button onClick={onGroups} className="flex items-center gap-1.5 px-3 py-2 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors rounded-lg hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10">
                <UsersIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Groups</span>
              </button>
            )}
          </nav>

          {/* Right: Create Quiz + Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onCreateQuiz && (
              <button
                onClick={onCreateQuiz}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium text-sm rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Quiz</span>
              </button>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-[#1E1E2E]/70 dark:text-white/70 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="max-w-[80px] truncate hidden sm:block">{user?.username}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1A1A1F] rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 shadow-xl dark:shadow-black/30 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1E1E2E]/10 dark:border-white/10">
                      <p className="font-medium text-[#1E1E2E] dark:text-white truncate">{user?.username || 'User'}</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      {/* Theme toggle */}
                      <button
                        onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[#1E1E2E]/70 dark:text-white/70 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors text-sm"
                      >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      {onSettings && (
                        <button onClick={() => { setShowProfileMenu(false); onSettings(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[#1E1E2E]/70 dark:text-white/70 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors text-sm">
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                      )}
                      <button onClick={() => { setShowProfileMenu(false); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm">
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
