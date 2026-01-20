import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Quiz } from '@/types';
import { PublishTemplate } from './PublishTemplate';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmModal } from './ConfirmModal';
import { API_URL } from '@/config';
import {
  LogOut,
  Plus,
  Play,
  Pencil,
  Trash2,
  Store,
  Share2,
  BarChart3,
  Zap,
  Users,
  Clock,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';

interface HomeProps {
  onEnterRoom: (roomCode: string) => void;
  onTemplateMarket?: () => void;
  onViewQuizDetail?: (quiz: Quiz) => void;
  onCreateQuiz?: () => void;
  onEditQuiz?: (quiz: Quiz) => void;
  onJoinQuiz?: () => void;
  onSettings?: () => void;
}

export function Home({ onEnterRoom, onTemplateMarket, onViewQuizDetail, onCreateQuiz, onEditQuiz, onJoinQuiz, onSettings }: HomeProps) {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [publishingQuiz, setPublishingQuiz] = useState<Quiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_URL}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (quizId: string) => {
    try {
      const response = await fetch(`${API_URL}/rooms?quiz_id=${quizId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        onEnterRoom(data.room_code);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      showToast('Failed to create room', 'error');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;

    try {
      const response = await fetch(`${API_URL}/quizzes/${deletingQuiz.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setQuizzes(quizzes.filter(q => q.id !== deletingQuiz.id));
        showToast('Quiz deleted successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      showToast('Failed to delete quiz', 'error');
    } finally {
      setDeletingQuiz(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B4A]/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Quizimple
              </span>
            </div>
            <div className="flex items-center gap-4">
              {onJoinQuiz && (
                <button
                  onClick={onJoinQuiz}
                  className="flex items-center gap-2 px-4 py-2.5 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Join Quiz
                </button>
              )}
              {onTemplateMarket && (
                <button
                  onClick={onTemplateMarket}
                  className="flex items-center gap-2 px-4 py-2.5 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors"
                >
                  <Store className="w-4 h-4" />
                  Templates
                </button>
              )}
              <ThemeToggle />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-[#1E1E2E]/70 dark:text-white/70 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="max-w-[120px] truncate">{user?.username || user?.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <>
                    {/* Backdrop to close menu */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1A1A1F] rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 shadow-xl dark:shadow-black/30 z-20 overflow-hidden animate-scale-in">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-[#1E1E2E]/10 dark:border-white/10">
                        <p className="font-medium text-[#1E1E2E] dark:text-white truncate">
                          {user?.username || 'User'}
                        </p>
                        <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onSettings?.();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[#1E1E2E]/70 dark:text-white/70 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors text-sm"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm"
                        >
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* My Quizzes */}
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm dark:shadow-black/20 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-[#1E1E2E]/5 dark:border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                My Quizzes
              </h2>
              <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Create and manage your quizzes</p>
            </div>
            <button
              onClick={onCreateQuiz}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Quiz
            </button>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-[#FF6B4A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[#1E1E2E]/50 dark:text-white/50">Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-[#1E1E2E]/20 dark:text-white/20" />
                </div>
                <p className="text-[#1E1E2E]/50 dark:text-white/50 mb-2">No quizzes yet</p>
                <p className="text-sm text-[#1E1E2E]/40 dark:text-white/40">Create your first quiz or browse templates</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-5 rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-black/20 transition-all bg-[#FFFBF7] dark:bg-[#0D0D0F] group"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onViewQuizDetail?.(quiz)}
                    >
                      <h3 className="font-semibold text-[#1E1E2E] dark:text-white group-hover:text-[#FF6B4A] transition-colors">
                        {quiz.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm text-[#1E1E2E]/50 dark:text-white/50">
                          <Clock className="w-3 h-3" />
                          {quiz.questions.length} questions
                        </span>
                        {quiz.hide_results && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                            Hidden Results
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onViewQuizDetail && (
                        <button
                          onClick={() => onViewQuizDetail(quiz)}
                          className="p-2.5 text-[#1E1E2E]/40 dark:text-white/40 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setPublishingQuiz(quiz)}
                        className="p-2.5 text-[#1E1E2E]/40 dark:text-white/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/20 rounded-lg transition-colors"
                        title="Publish as Template"
                        disabled={quiz.questions.length === 0}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditQuiz?.(quiz)}
                        className="p-2.5 text-[#1E1E2E]/40 dark:text-white/40 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit Quiz"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCreateRoom(quiz.id)}
                        disabled={quiz.questions.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] font-medium text-sm rounded-lg hover:bg-[#2E2E3E] dark:hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Play className="w-4 h-4" />
                        Host
                      </button>
                      <button
                        onClick={() => setDeletingQuiz(quiz)}
                        className="p-2.5 text-[#1E1E2E]/40 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Template Modal */}
      {publishingQuiz && token && (
        <PublishTemplate
          quiz={publishingQuiz}
          token={token}
          onClose={() => setPublishingQuiz(null)}
          onPublished={() => {
            setPublishingQuiz(null);
            showToast('Template published successfully!', 'success');
          }}
        />
      )}

      {/* Delete Quiz Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingQuiz}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${deletingQuiz?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteQuiz}
        onCancel={() => setDeletingQuiz(null)}
      />
    </div>
  );
}
