import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Quiz, Question } from '@/types';
import { AddQuestion } from './AddQuestion';
import { ConfirmModal } from './ConfirmModal';
import { API_URL } from '@/config';
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  Check,
  Clock,
  Star,
  Sparkles,
  Loader2,
  EyeOff,
  Eye,
  Zap,
  Play
} from 'lucide-react';

interface CreateQuizProps {
  quiz?: Quiz;
  onBack: () => void;
  onQuizCreated: (quiz: Quiz) => void;
  onHost?: (quizId: string) => void;
}

export function CreateQuiz({ quiz: existingQuiz, onBack, onQuizCreated, onHost }: CreateQuizProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(existingQuiz?.name || '');
  const [hideResults, setHideResults] = useState(existingQuiz?.hide_results || false);
  const [quiz, setQuiz] = useState<Quiz | null>(existingQuiz || null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [replaceQuestions, setReplaceQuestions] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deletingQuestionIndex, setDeletingQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (existingQuiz) {
      fetchQuiz(existingQuiz.id);
    }
  }, [existingQuiz]);

  const fetchQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQuiz(data);
        setHideResults(data.hide_results || false);
      }
    } catch (err) {
      console.error('Failed to fetch quiz:', err);
    }
  };

  const handleToggleHideResults = async () => {
    if (!quiz) return;
    const newValue = !hideResults;
    setHideResults(newValue);

    try {
      const response = await fetch(`${API_URL}/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hide_results: newValue }),
      });
      if (!response.ok) {
        setHideResults(!newValue);
      }
    } catch {
      setHideResults(!newValue);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, hide_results: hideResults }),
      });

      if (response.ok) {
        const newQuiz = await response.json();
        showToast('Quiz created successfully!', 'success');
        setQuiz(newQuiz);
        onQuizCreated(newQuiz);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to create quiz');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async (questionData: Omit<Question, 'id'>) => {
    if (!quiz) return;

    try {
      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questionData),
      });

      if (response.ok) {
        fetchQuiz(quiz.id);
        setShowAddQuestion(false);
      }
    } catch (err) {
      console.error('Failed to add question:', err);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!quiz || deletingQuestionIndex === null) return;

    try {
      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/questions/${deletingQuestionIndex}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        showToast('Question deleted successfully', 'success');
        fetchQuiz(quiz.id);
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
      showToast('Failed to delete question', 'error');
    } finally {
      setDeletingQuestionIndex(null);
    }
  };

  const handleImport = async () => {
    if (!quiz) return;
    setError('');

    try {
      const parsed = JSON.parse(importJson);
      const questions = parsed.questions || parsed;

      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/questions/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questions, replace: replaceQuestions }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || 'Questions imported successfully', 'success');
        fetchQuiz(quiz.id);
        setShowImport(false);
        setImportJson('');
        setReplaceQuestions(false);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to import questions');
      }
    } catch {
      setError('Invalid JSON format');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportJson(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAIGenerate = async () => {
    if (!quiz || !aiPrompt.trim()) return;
    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt, replace: replaceQuestions }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message || 'Questions generated successfully', 'success');
        fetchQuiz(quiz.id);
        setShowAIGenerate(false);
        setAiPrompt('');
        setReplaceQuestions(false);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to generate questions');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Create Quiz Form
  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] p-6 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#1E1E2E]/50 dark:text-white/50 hover:text-[#1E1E2E] dark:hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-8 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm dark:shadow-black/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Create New Quiz
              </h1>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                  Quiz Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter quiz name"
                  required
                  className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
                />
              </div>

              <div
                className="flex items-center justify-between p-4 rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 cursor-pointer hover:bg-[#FFFBF7] dark:hover:bg-white/5 transition-colors"
                onClick={() => setHideResults(!hideResults)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1E1E2E] dark:text-white">Hide Results from Players</p>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                      Players won't see correct answers or scores
                    </p>
                  </div>
                </div>
                <div
                  className={`w-12 h-7 rounded-full transition-colors ${
                    hideResults ? 'bg-[#FF6B4A]' : 'bg-[#1E1E2E]/20 dark:bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-1 ${
                      hideResults ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Quiz'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Add Question View
  if (showAddQuestion) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] p-6 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <AddQuestion onAdd={handleAddQuestion} onCancel={() => setShowAddQuestion(false)} />
        </div>
      </div>
    );
  }

  // Import JSON View
  if (showImport) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] p-6 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-8 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm dark:shadow-black/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Import Questions from JSON
              </h1>
            </div>

            <div className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                  Upload JSON file
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl text-[#1E1E2E] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                  Or paste JSON
                </label>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40 font-mono text-sm"
                  placeholder={`{
  "questions": [
    {
      "text": "Question text",
      "type": "single",
      "options": ["A", "B", "C", "D"],
      "correct": [0],
      "time_limit": 30,
      "points": 100
    }
  ]
}`}
                />
              </div>

              {/* Replace existing questions toggle */}
              {quiz && quiz.questions.length > 0 && (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 cursor-pointer hover:bg-[#FFFBF7] dark:hover:bg-white/5 transition-colors"
                  onClick={() => setReplaceQuestions(!replaceQuestions)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1E1E2E] dark:text-white">Replace existing questions</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                        Delete all {quiz.questions.length} current questions before importing
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full transition-colors ${
                      replaceQuestions ? 'bg-red-500' : 'bg-[#1E1E2E]/20 dark:bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-1 ${
                        replaceQuestions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowImport(false); setReplaceQuestions(false); }}
                  className="flex-1 py-3 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importJson}
                  className="flex-1 py-3 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] font-medium rounded-xl hover:bg-[#2E2E3E] dark:hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {replaceQuestions ? 'Replace & Import' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AI Generate View
  if (showAIGenerate) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] p-6 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-8 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm dark:shadow-black/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Generate with AI
              </h1>
            </div>

            <div className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                  Describe your quiz
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
                  placeholder="e.g., Generate 10 medium difficulty JavaScript questions about arrays and functions, all single choice"
                  disabled={isGenerating}
                />
              </div>

              <div className="p-4 bg-violet-50 dark:bg-violet-500/20 rounded-xl">
                <p className="text-sm font-medium text-violet-800 dark:text-violet-300 mb-2">Tips for better results:</p>
                <ul className="text-sm text-violet-700 dark:text-violet-400 space-y-1">
                  <li>• Specify the topic (e.g., "JavaScript", "React hooks")</li>
                  <li>• Mention the number of questions</li>
                  <li>• Include difficulty level (easy, medium, hard)</li>
                  <li>• Specify question type (single or multiple choice)</li>
                </ul>
              </div>

              {/* Replace existing questions toggle */}
              {quiz && quiz.questions.length > 0 && (
                <div
                  className="flex items-center justify-between p-4 rounded-xl border border-[#1E1E2E]/10 dark:border-white/10 cursor-pointer hover:bg-[#FFFBF7] dark:hover:bg-white/5 transition-colors"
                  onClick={() => !isGenerating && setReplaceQuestions(!replaceQuestions)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1E1E2E] dark:text-white">Replace existing questions</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                        Delete all {quiz.questions.length} current questions before generating
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full transition-colors ${
                      replaceQuestions ? 'bg-red-500' : 'bg-[#1E1E2E]/20 dark:bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-1 ${
                        replaceQuestions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAIGenerate(false);
                    setError('');
                    setReplaceQuestions(false);
                  }}
                  disabled={isGenerating}
                  className="flex-1 py-3 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim() || aiPrompt.length < 10 || isGenerating}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {replaceQuestions ? 'Replace & Generate' : 'Generate'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Editor View
  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] p-6 transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#1E1E2E]/50 dark:text-white/50 hover:text-[#1E1E2E] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {quiz.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowAddQuestion(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import JSON
            </button>
            <button
              onClick={() => setShowAIGenerate(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-violet-300 dark:border-violet-400 text-violet-600 dark:text-violet-400 font-medium rounded-xl hover:bg-violet-50 dark:hover:bg-violet-500/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              AI Generate
            </button>
            {onHost && (
              <button
                onClick={() => onHost(quiz.id)}
                disabled={quiz.questions.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <Play className="w-4 h-4" />
                Host
              </button>
            )}
          </div>
        </div>

        {/* Hide Results Toggle */}
        <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-[#1E1E2E]/5 dark:border-white/10">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={handleToggleHideResults}
          >
            <div className="flex items-center gap-3">
              {hideResults ? (
                <EyeOff className="w-5 h-5 text-[#FF6B4A]" />
              ) : (
                <Eye className="w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" />
              )}
              <div>
                <p className="font-medium text-[#1E1E2E] dark:text-white">Hide Results from Players</p>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                  {hideResults
                    ? 'Players will not see correct answers or detailed scores'
                    : 'Players will see correct answers and scores after each question'}
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-7 rounded-full transition-colors ${
                hideResults ? 'bg-[#FF6B4A]' : 'bg-[#1E1E2E]/20 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-1 ${
                  hideResults ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Questions List */}
        {quiz.questions.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-12 border border-[#1E1E2E]/5 dark:border-white/10 text-center">
            <div className="w-16 h-16 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-[#1E1E2E]/20 dark:text-white/20" />
            </div>
            <p className="text-[#1E1E2E]/50 dark:text-white/50">No questions yet</p>
            <p className="text-sm text-[#1E1E2E]/40 dark:text-white/40">Add some questions to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <div key={index} className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] text-xs font-medium rounded-lg">
                      Q{index + 1}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      question.type === 'single' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                    }`}>
                      {question.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-lg">
                      <Star className="w-3 h-3" />
                      {question.points}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-[#1E1E2E]/5 dark:bg-white/10 text-[#1E1E2E]/60 dark:text-white/60 text-xs font-medium rounded-lg">
                      <Clock className="w-3 h-3" />
                      {question.time_limit}s
                    </span>
                  </div>
                  <button
                    onClick={() => setDeletingQuestionIndex(index)}
                    className="p-2 text-[#1E1E2E]/40 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-lg text-[#1E1E2E] dark:text-white mb-4">{question.text}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-xl border-2 ${
                        question.correct.includes(optIndex)
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/20'
                          : 'border-[#1E1E2E]/10 dark:border-white/10 bg-[#FFFBF7] dark:bg-[#0D0D0F]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {question.correct.includes(optIndex) && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span className={question.correct.includes(optIndex) ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-[#1E1E2E] dark:text-white'}>
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Question Confirmation Modal */}
        <ConfirmModal
          isOpen={deletingQuestionIndex !== null}
          title="Delete Question"
          message={`Are you sure you want to delete Question ${deletingQuestionIndex !== null ? deletingQuestionIndex + 1 : ''}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeleteQuestion}
          onCancel={() => setDeletingQuestionIndex(null)}
        />
      </div>
    </div>
  );
}
