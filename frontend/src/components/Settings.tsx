import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ThemeToggle } from './ThemeToggle';
import { API_URL } from '@/config';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Palette,
  Bell,
  Clock,
  Settings2
} from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { user, token, logout, updateUser } = useAuth();
  const { showToast } = useToast();

  // Profile state
  const [username, setUsername] = useState(user?.username || '');
  const email = user?.email || '';
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Quiz defaults state (stored in localStorage)
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(() => {
    const saved = localStorage.getItem('quizimple_default_time_limit');
    return saved ? parseInt(saved, 10) : 30;
  });
  const [defaultPoints, setDefaultPoints] = useState(() => {
    const saved = localStorage.getItem('quizimple_default_points');
    return saved ? parseInt(saved, 10) : 100;
  });

  // Active section
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'quiz-defaults' | 'appearance' | 'notifications'>('profile');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      showToast('Username is required', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        showToast('Profile updated successfully', 'success');
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast('Current password is required', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('New password must be at least 4 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`${API_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to change password', 'error');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      showToast('Failed to change password', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showToast('Password is required to delete account', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (response.ok) {
        showToast('Account deleted successfully', 'success');
        logout();
      } else {
        const error = await response.json();
        showToast(error.detail || 'Failed to delete account', 'error');
      }
    } catch (err) {
      console.error('Failed to delete account:', err);
      showToast('Failed to delete account', 'error');
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  const handleSaveQuizDefaults = () => {
    localStorage.setItem('quizimple_default_time_limit', defaultTimeLimit.toString());
    localStorage.setItem('quizimple_default_points', defaultPoints.toString());
    showToast('Quiz defaults saved', 'success');
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'quiz-defaults' as const, label: 'Quiz Defaults', icon: Settings2 },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Settings
                </h1>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Manage your account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-[#FF6B4A]/10 text-[#FF6B4A]'
                      : 'text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#1E1E2E]/5 dark:border-white/10">
                  <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Profile Information
                  </h2>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-1">
                    Update your personal information
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1E1E2E] dark:text-white">{user?.username || 'User'}</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">{user?.email}</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                        placeholder="Your username"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-[#1E1E2E]/5 dark:bg-white/5 border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl text-[#1E1E2E]/50 dark:text-white/50 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-[#1E1E2E]/40 dark:text-white/40 mt-1.5">
                      Email cannot be changed
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile || username === user?.username}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <>
                {/* Change Password */}
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#1E1E2E]/5 dark:border-white/10">
                    <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      Change Password
                    </h2>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-1">
                      Update your password to keep your account secure
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E2E]/30 dark:text-white/30 hover:text-[#1E1E2E]/60 dark:hover:text-white/60"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1E1E2E]/30 dark:text-white/30 hover:text-[#1E1E2E]/60 dark:hover:text-white/60"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                          placeholder="Confirm new password"
                        />
                      </div>
                      {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] font-medium rounded-xl hover:bg-[#2E2E3E] dark:hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className="w-4 h-4" />
                      {isUpdatingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      Danger Zone
                    </h2>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                      Irreversible actions that affect your account
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-[#1E1E2E] dark:text-white">Delete Account</h3>
                        <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-0.5">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium text-sm rounded-xl hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quiz Defaults Section */}
            {activeSection === 'quiz-defaults' && (
              <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#1E1E2E]/5 dark:border-white/10">
                  <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Quiz Defaults
                  </h2>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-1">
                    Set default values for new quiz questions
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Default Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                      Default Time Limit (seconds)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                        <input
                          type="number"
                          min={5}
                          max={300}
                          value={defaultTimeLimit}
                          onChange={(e) => setDefaultTimeLimit(Math.max(5, Math.min(300, parseInt(e.target.value) || 30)))}
                          className="w-full pl-12 pr-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        {[15, 30, 60].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setDefaultTimeLimit(time)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              defaultTimeLimit === time
                                ? 'bg-[#FF6B4A] text-white'
                                : 'bg-[#1E1E2E]/5 dark:bg-white/10 text-[#1E1E2E]/70 dark:text-white/70 hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20'
                            }`}
                          >
                            {time}s
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#1E1E2E]/40 dark:text-white/40 mt-1.5">
                      Time allowed to answer each question (5-300 seconds)
                    </p>
                  </div>

                  {/* Default Points */}
                  <div>
                    <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                      Default Points per Question
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/30 dark:text-white/30" />
                        <input
                          type="number"
                          min={10}
                          max={1000}
                          step={10}
                          value={defaultPoints}
                          onChange={(e) => setDefaultPoints(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
                          className="w-full pl-12 pr-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        {[50, 100, 200].map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setDefaultPoints(pts)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              defaultPoints === pts
                                ? 'bg-[#FF6B4A] text-white'
                                : 'bg-[#1E1E2E]/5 dark:bg-white/10 text-[#1E1E2E]/70 dark:text-white/70 hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20'
                            }`}
                          >
                            {pts}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#1E1E2E]/40 dark:text-white/40 mt-1.5">
                      Points awarded for correct answers (10-1000)
                    </p>
                  </div>

                  <button
                    onClick={handleSaveQuizDefaults}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Defaults
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === 'appearance' && (
              <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#1E1E2E]/5 dark:border-white/10">
                  <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Appearance
                  </h2>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-1">
                    Customize how Quizimple looks
                  </p>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-[#1E1E2E] dark:text-white">Theme</h3>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-0.5">
                        Switch between light and dark mode
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#1E1E2E]/5 dark:border-white/10">
                  <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Notifications
                  </h2>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mt-1">
                    Manage your notification preferences
                  </p>
                </div>

                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-[#1E1E2E]/20 dark:text-white/20" />
                    </div>
                    <p className="text-[#1E1E2E]/50 dark:text-white/50">
                      Notification settings coming soon
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setDeletePassword('');
            }}
          />
          <div className="relative bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 w-full max-w-md border border-[#1E1E2E]/10 dark:border-white/10 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Delete Account
            </h2>
            <p className="text-[#1E1E2E]/60 dark:text-white/60 mb-4">
              This action cannot be undone. All your quizzes and data will be permanently deleted.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all text-[#1E1E2E] dark:text-white"
                placeholder="Your password"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                className="flex-1 py-3 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeletingAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
