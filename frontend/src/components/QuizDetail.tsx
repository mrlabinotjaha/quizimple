import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  BarChart3,
  Clock,
  Trophy,
  Target,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play
} from 'lucide-react';
import { Quiz, QuizSession, QuizAnalytics, QuestionStat } from '../types';
import { API_URL } from '../config';

interface QuizDetailProps {
  quiz: Quiz;
  token: string;
  onBack: () => void;
  onPlay: (quizId: string) => void;
}

export function QuizDetail({ quiz, token, onBack, onPlay }: QuizDetailProps) {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'questions'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, [quiz.id]);

  const fetchData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        fetch(`${API_URL}/quizzes/${quiz.id}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/quizzes/${quiz.id}/sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return diffMins > 0 ? `${diffMins}m ${diffSecs}s` : `${diffSecs}s`;
  };

  const toggleQuestion = (index: number) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQuestions(newExpanded);
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (accuracy >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-100 dark:bg-emerald-500/20';
    if (accuracy >= 50) return 'bg-amber-100 dark:bg-amber-500/20';
    return 'bg-red-100 dark:bg-red-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] flex items-center justify-center transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B4A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#1E1E2E] dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {quiz.name}
                </h1>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                  {quiz.questions.length} questions • Created by you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPlay(quiz.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
              >
                <Play className="w-4 h-4" />
                Host Quiz
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{analytics?.total_participants || 0}</p>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Total Participants</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{analytics?.total_sessions || 0}</p>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Total Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{analytics?.average_accuracy || 0}%</p>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Avg. Accuracy</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{analytics?.average_score || 0}</p>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Avg. Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-[#1A1A1F] rounded-xl p-1.5 border border-[#1E1E2E]/5 dark:border-white/10 w-fit">
          {(['overview', 'sessions', 'questions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab
                  ? 'bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E]'
                  : 'text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
              <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Recent Sessions
              </h3>
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        setActiveTab('sessions');
                      }}
                      className="w-full p-4 rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#FF6B4A]/30 hover:bg-[#FF6B4A]/5 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#1E1E2E] dark:text-white">
                          Room: {session.room_code}
                        </span>
                        <span className="text-xs text-[#1E1E2E]/50 dark:text-white/50">
                          {formatDate(session.ended_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#1E1E2E]/60 dark:text-white/60">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {session.participants.length}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(session.started_at, session.ended_at)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-[#1E1E2E]/50 dark:text-white/50">No sessions yet</p>
                  <p className="text-sm text-[#1E1E2E]/40 dark:text-white/40">Host a quiz to see session data</p>
                </div>
              )}
            </div>

            {/* Question Performance */}
            <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
              <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Question Performance
              </h3>
              {quiz.questions.length > 0 ? (
                <div className="space-y-3">
                  {quiz.questions.slice(0, 5).map((question, idx) => {
                    // Calculate aggregate stats from all sessions
                    let totalAttempts = 0;
                    let correctAttempts = 0;
                    sessions.forEach(session => {
                      const stat = session.question_stats.find((s: QuestionStat) => s.question_index === idx);
                      if (stat) {
                        totalAttempts += stat.total_attempts;
                        correctAttempts += stat.correct_attempts;
                      }
                    });
                    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

                    return (
                      <div key={idx} className="p-4 rounded-xl bg-[#FFFBF7] dark:bg-[#0D0D0F]">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-[#1E1E2E] dark:text-white flex-1 line-clamp-2">
                            {idx + 1}. {question.text}
                          </p>
                          {totalAttempts > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getAccuracyBg(accuracy)} ${getAccuracyColor(accuracy)}`}>
                              {accuracy}%
                            </span>
                          )}
                        </div>
                        {totalAttempts > 0 && (
                          <div className="w-full bg-[#1E1E2E]/10 dark:bg-white/10 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${accuracy >= 80 ? 'bg-emerald-500' : accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${accuracy}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-[#1E1E2E]/50 dark:text-white/50">No questions yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1 bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
              <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
                All Sessions
              </h3>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedSession?.id === session.id
                          ? 'border-[#FF6B4A] bg-[#FF6B4A]/5'
                          : 'border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#1E1E2E] dark:text-white">
                          {session.room_code}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-[#1E1E2E]/50 dark:text-white/50">
                          <Users className="w-3 h-3" />
                          {session.participants.length}
                        </span>
                      </div>
                      <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">
                        {formatDate(session.ended_at)}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-3" />
                  <p className="text-[#1E1E2E]/50 dark:text-white/50">No sessions yet</p>
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="lg:col-span-2">
              {selectedSession ? (
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                        Session: {selectedSession.room_code}
                      </h3>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                        {formatDate(selectedSession.started_at)} • Duration: {formatDuration(selectedSession.started_at, selectedSession.ended_at)}
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#1E1E2E]/60 dark:text-white/60 uppercase tracking-wide mb-3">
                      Leaderboard
                    </h4>
                    <div className="space-y-2">
                      {selectedSession.participants.map((participant, idx) => (
                        <div
                          key={participant.user_id}
                          className={`flex items-center gap-4 p-4 rounded-xl ${
                            idx === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/20 border border-amber-200 dark:border-amber-500/30' :
                            idx === 1 ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-500/20 dark:to-slate-500/20 border border-gray-200 dark:border-gray-500/30' :
                            idx === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/20 dark:to-amber-500/20 border border-orange-200 dark:border-orange-500/30' :
                            'bg-[#FFFBF7] dark:bg-[#0D0D0F]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            idx === 0 ? 'bg-amber-400 text-white' :
                            idx === 1 ? 'bg-gray-400 text-white' :
                            idx === 2 ? 'bg-orange-400 text-white' :
                            'bg-[#1E1E2E]/10 dark:bg-white/10 text-[#1E1E2E]/60 dark:text-white/60'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-[#1E1E2E] dark:text-white">{participant.username}</p>
                            <div className="flex items-center gap-3 text-xs text-[#1E1E2E]/50 dark:text-white/50">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {participant.correct_answers} correct
                              </span>
                              <span className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-red-500" />
                                {participant.wrong_answers} wrong
                              </span>
                              {participant.tab_switches > 0 && (
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="w-3 h-3" />
                                  {participant.tab_switches} tab switches
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#1E1E2E] dark:text-white">{participant.score}</p>
                            <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Stats */}
                  <div>
                    <h4 className="text-sm font-semibold text-[#1E1E2E]/60 dark:text-white/60 uppercase tracking-wide mb-3">
                      Question Analysis
                    </h4>
                    <div className="space-y-2">
                      {selectedSession.question_stats.map((stat: QuestionStat, idx: number) => (
                        <div key={idx} className="border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleQuestion(idx)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[#FFFBF7] dark:hover:bg-[#0D0D0F] transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${getAccuracyBg(stat.accuracy_percentage)} ${getAccuracyColor(stat.accuracy_percentage)}`}>
                                {stat.accuracy_percentage}%
                              </span>
                              <span className="text-sm font-medium text-[#1E1E2E] dark:text-white line-clamp-1">
                                Q{idx + 1}: {stat.question_text}
                              </span>
                            </div>
                            {expandedQuestions.has(idx) ? (
                              <ChevronUp className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" />
                            )}
                          </button>
                          {expandedQuestions.has(idx) && (
                            <div className="px-4 pb-4 pt-2 bg-[#FFFBF7] dark:bg-[#0D0D0F] border-t border-[#1E1E2E]/5 dark:border-white/5">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-[#1E1E2E]/50 dark:text-white/50 mb-1">Attempts</p>
                                  <p className="font-medium text-[#1E1E2E] dark:text-white">{stat.total_attempts}</p>
                                </div>
                                <div>
                                  <p className="text-[#1E1E2E]/50 dark:text-white/50 mb-1">Correct</p>
                                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{stat.correct_attempts}</p>
                                </div>
                              </div>
                              {Object.keys(stat.answer_distribution).length > 0 && (
                                <div className="mt-4">
                                  <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm mb-2">Answer Distribution</p>
                                  <div className="space-y-1">
                                    {Object.entries(stat.answer_distribution).map(([optIdx, count]) => {
                                      const isCorrect = stat.correct_answers.includes(parseInt(optIdx));
                                      const percentage = stat.total_attempts > 0
                                        ? Math.round((count as number / stat.total_attempts) * 100)
                                        : 0;
                                      return (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <span className={`text-xs font-medium w-16 ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1E1E2E]/60 dark:text-white/60'}`}>
                                            Option {parseInt(optIdx) + 1}
                                          </span>
                                          <div className="flex-1 bg-[#1E1E2E]/10 dark:bg-white/10 rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-[#1E1E2E]/30 dark:bg-white/30'}`}
                                              style={{ width: `${percentage}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-[#1E1E2E]/50 dark:text-white/50 w-12 text-right">
                                            {count} ({percentage}%)
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-12 border border-[#1E1E2E]/5 dark:border-white/10 text-center">
                  <BarChart3 className="w-16 h-16 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-4" />
                  <p className="text-[#1E1E2E]/50 dark:text-white/50">Select a session to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
            <h3 className="text-lg font-semibold text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
              All Questions Performance
            </h3>
            <div className="space-y-4">
              {quiz.questions.map((question, idx) => {
                let totalAttempts = 0;
                let correctAttempts = 0;
                const answerDist: Record<number, number> = {};

                sessions.forEach(session => {
                  const stat = session.question_stats.find((s: QuestionStat) => s.question_index === idx);
                  if (stat) {
                    totalAttempts += stat.total_attempts;
                    correctAttempts += stat.correct_attempts;
                    Object.entries(stat.answer_distribution).forEach(([optIdx, count]) => {
                      answerDist[parseInt(optIdx)] = (answerDist[parseInt(optIdx)] || 0) + (count as number);
                    });
                  }
                });
                const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

                return (
                  <div key={idx} className="border border-[#1E1E2E]/10 dark:border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className="w-full p-5 flex items-start justify-between hover:bg-[#FFFBF7] dark:hover:bg-[#0D0D0F] transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2.5 py-1 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] text-xs font-medium rounded-lg">
                            Q{idx + 1}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            question.type === 'single' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                          }`}>
                            {question.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                          </span>
                          {totalAttempts > 0 && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getAccuracyBg(accuracy)} ${getAccuracyColor(accuracy)}`}>
                              {accuracy}% accuracy
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-[#1E1E2E] dark:text-white">{question.text}</p>
                      </div>
                      {expandedQuestions.has(idx) ? (
                        <ChevronUp className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40 flex-shrink-0 ml-4" />
                      )}
                    </button>
                    {expandedQuestions.has(idx) && (
                      <div className="px-5 pb-5 bg-[#FFFBF7] dark:bg-[#0D0D0F] border-t border-[#1E1E2E]/5 dark:border-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                          <div>
                            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">Time Limit</p>
                            <p className="font-medium text-[#1E1E2E] dark:text-white">{question.time_limit}s</p>
                          </div>
                          <div>
                            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">Points</p>
                            <p className="font-medium text-[#1E1E2E] dark:text-white">{question.points}</p>
                          </div>
                          <div>
                            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">Total Attempts</p>
                            <p className="font-medium text-[#1E1E2E] dark:text-white">{totalAttempts}</p>
                          </div>
                          <div>
                            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">Correct Answers</p>
                            <p className="font-medium text-emerald-600 dark:text-emerald-400">{correctAttempts}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[#1E1E2E]/60 dark:text-white/60">Options</p>
                          {question.options.map((option, optIdx) => {
                            const isCorrect = question.correct.includes(optIdx);
                            const count = answerDist[optIdx] || 0;
                            const percentage = totalAttempts > 0 ? Math.round((count / totalAttempts) * 100) : 0;

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl ${
                                  isCorrect ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30' : 'bg-white dark:bg-[#1A1A1F] border border-[#1E1E2E]/10 dark:border-white/10'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    {isCorrect ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-[#1E1E2E]/20 dark:border-white/20" />
                                    )}
                                    <span className={`text-sm ${isCorrect ? 'font-medium text-emerald-700 dark:text-emerald-300' : 'text-[#1E1E2E] dark:text-white'}`}>
                                      {option}
                                    </span>
                                  </div>
                                  {totalAttempts > 0 && (
                                    <span className="text-xs text-[#1E1E2E]/50 dark:text-white/50">
                                      {count} selections ({percentage}%)
                                    </span>
                                  )}
                                </div>
                                {totalAttempts > 0 && (
                                  <div className="ml-6 mt-2">
                                    <div className="w-full bg-[#1E1E2E]/10 dark:bg-white/10 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-[#1E1E2E]/30 dark:bg-white/30'}`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
