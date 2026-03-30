import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Quiz, QuizTemplate } from '@/types';
import { PublishTemplate } from './PublishTemplate';
import { ConfirmModal } from './ConfirmModal';
import { API_URL } from '@/config';
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  Share2,
  BarChart3,
  Zap,
  Clock,
  Users,
  Lock,
  Globe
} from 'lucide-react';

interface HomeProps {
  onEnterRoom: (roomCode: string) => void;
  onTemplateMarket?: () => void;
  onViewQuizDetail?: (quiz: Quiz) => void;
  onCreateQuiz?: () => void;
  onEditQuiz?: (quiz: Quiz) => void;
  onJoinQuiz?: () => void;
  onSettings?: () => void;
  onGroups?: () => void;
}

export function Home({ onEnterRoom, onViewQuizDetail, onCreateQuiz, onEditQuiz }: HomeProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [publishingQuiz, setPublishingQuiz] = useState<Quiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTemplates, setUserTemplates] = useState<QuizTemplate[]>([]);

  useEffect(() => {
    fetchQuizzes();
    fetchUserTemplates();
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

  const fetchUserTemplates = async () => {
    try {
      const response = await fetch(`${API_URL}/templates/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setUserTemplates(await response.json());
      }
    } catch (err) {
      console.error('Failed to fetch user templates:', err);
    }
  };

  // Map quiz_id -> template for quick lookup
  const templateByQuizId = userTemplates.reduce<Record<string, QuizTemplate>>((acc, t) => {
    acc[t.quiz_id] = t;
    return acc;
  }, {});

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
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
                        {templateByQuizId[quiz.id] && (() => {
                          const vis = templateByQuizId[quiz.id].visibility || (templateByQuizId[quiz.id].is_private ? 'private' : 'public');
                          if (vis === 'private') return (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                              <Lock className="w-3 h-3" />
                              Private
                            </span>
                          );
                          if (vis === 'group') return (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium rounded-full">
                              <Users className="w-3 h-3" />
                              {templateByQuizId[quiz.id].group_name || 'Group'}
                            </span>
                          );
                          return (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                              <Globe className="w-3 h-3" />
                              Public
                            </span>
                          );
                        })()}
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
          existingTemplate={templateByQuizId[publishingQuiz.id] || null}
          onClose={() => setPublishingQuiz(null)}
          onPublished={() => {
            setPublishingQuiz(null);
            fetchUserTemplates();
            showToast(templateByQuizId[publishingQuiz.id] ? 'Template updated!' : 'Template published!', 'success');
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
