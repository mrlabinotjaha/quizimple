import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Search,
  Star,
  Download,
  Sparkles,
  Code,
  BookOpen,
  Beaker,
  Globe,
  History,
  Heart,
  Briefcase,
  Gamepad2,
  MoreHorizontal,
  TrendingUp,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';
import { QuizTemplate, TemplateCategory, Question } from '../types';
import { API_URL } from '../config';

interface TemplateDetails extends QuizTemplate {
  questions: Question[];
}

interface TemplateMarketProps {
  token: string | null;
  onBack: () => void;
  onUseTemplate: (quiz: any) => void;
  onLogin: () => void;
}

const categoryConfig: Record<TemplateCategory, { label: string; icon: any; color: string }> = {
  programming: { label: 'Programming', icon: Code, color: 'from-blue-500 to-indigo-600' },
  education: { label: 'Education', icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
  science: { label: 'Science', icon: Beaker, color: 'from-purple-500 to-violet-600' },
  languages: { label: 'Languages', icon: Globe, color: 'from-pink-500 to-rose-600' },
  history: { label: 'History', icon: History, color: 'from-amber-500 to-orange-600' },
  healthcare: { label: 'Healthcare', icon: Heart, color: 'from-red-500 to-rose-600' },
  business: { label: 'Business', icon: Briefcase, color: 'from-slate-500 to-gray-600' },
  entertainment: { label: 'Entertainment', icon: Gamepad2, color: 'from-cyan-500 to-blue-600' },
  other: { label: 'Other', icon: MoreHorizontal, color: 'from-gray-500 to-slate-600' }
};

export function TemplateMarket({ token, onBack, onUseTemplate, onLogin }: TemplateMarketProps) {
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<QuizTemplate[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);
  const [sortBy, setSortBy] = useState<'uses' | 'rating' | 'recent'>('uses');
  const [selectedTemplate, setSelectedTemplate] = useState<QuizTemplate | null>(null);
  const [templateDetails, setTemplateDetails] = useState<TemplateDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTemplate) {
        setSelectedTemplate(null);
        setTemplateDetails(null);
        setExpandedQuestions(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTemplate]);

  // Fetch template details when modal opens
  useEffect(() => {
    if (selectedTemplate) {
      fetchTemplateDetails(selectedTemplate.id);
    } else {
      setTemplateDetails(null);
      setExpandedQuestions(new Set());
    }
  }, [selectedTemplate]);

  const fetchTemplateDetails = async (templateId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/templates/${templateId}`);
      if (res.ok) {
        const data = await res.json();
        setTemplateDetails(data);
      }
    } catch (error) {
      console.error('Failed to fetch template details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleQuestion = useCallback((index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchData = async () => {
    try {
      const [featuredRes, categoriesRes] = await Promise.all([
        fetch(`${API_URL}/templates/featured`),
        fetch(`${API_URL}/templates/categories`)
      ]);

      if (featuredRes.ok) {
        setFeaturedTemplates(await featuredRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      params.set('sort_by', sortBy);

      const res = await fetch(`${API_URL}/templates?${params}`);
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleUseTemplate = async (template: QuizTemplate) => {
    if (!token) {
      onLogin();
      return;
    }

    setUsingTemplate(template.id);
    try {
      const res = await fetch(`${API_URL}/templates/${template.id}/use`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const quiz = await res.json();
        onUseTemplate(quiz);
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    } finally {
      setUsingTemplate(null);
    }
  };

  const handleRateTemplate = async (templateId: string, rating: number) => {
    if (!token) {
      onLogin();
      return;
    }

    try {
      await fetch(`${API_URL}/templates/${templateId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to rate template:', error);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
      <header className="bg-white dark:bg-[#1A1A1F] border-b border-[#1E1E2E]/10 dark:border-white/10 sticky top-0 z-20">
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
                  Template Market
                </h1>
                <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                  Discover and use community-created quiz templates
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1E1E2E]/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1A1A1F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
            />
          </div>
          <div className="flex gap-2">
            {(['uses', 'rating', 'recent'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                  sortBy === sort
                    ? 'bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E]'
                    : 'bg-white dark:bg-[#1A1A1F] text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white border border-[#1E1E2E]/10 dark:border-white/10'
                }`}
              >
                {sort === 'uses' && <TrendingUp className="w-4 h-4" />}
                {sort === 'rating' && <Star className="w-4 h-4" />}
                {sort === 'recent' && <Clock className="w-4 h-4" />}
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E]'
                  : 'bg-white dark:bg-[#1A1A1F] text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white border border-[#1E1E2E]/10 dark:border-white/10'
              }`}
            >
              All Templates
            </button>
            {categories.map((cat) => {
              const config = categoryConfig[cat.category as TemplateCategory];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category as TemplateCategory)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedCategory === cat.category
                      ? 'bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E]'
                      : 'bg-white dark:bg-[#1A1A1F] text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white border border-[#1E1E2E]/10 dark:border-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                  <span className="text-xs opacity-60">({cat.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Templates */}
        {!selectedCategory && !searchQuery && featuredTemplates.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Featured Templates
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTemplates.map((template) => {
                const config = categoryConfig[template.category];
                const Icon = config?.icon || Sparkles;
                return (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 hover:shadow-xl dark:hover:shadow-black/30 transition-all cursor-pointer group"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400" fill="#fbbf24" />
                        <span className="text-sm font-medium text-[#1E1E2E] dark:text-white">{template.rating.toFixed(1)}</span>
                        <span className="text-xs text-[#1E1E2E]/40 dark:text-white/40">({template.ratings_count})</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-[#1E1E2E] dark:text-white mb-1 group-hover:text-[#FF6B4A] transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between text-sm text-[#1E1E2E]/40 dark:text-white/40">
                      <span>{template.questions_count} questions</span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {template.uses_count} uses
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <h2 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
            {selectedCategory ? categoryConfig[selectedCategory]?.label : 'All'} Templates
          </h2>
          {templates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const config = categoryConfig[template.category];
                const Icon = config?.icon || Sparkles;
                return (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-6 border border-[#1E1E2E]/5 dark:border-white/10 hover:shadow-lg dark:hover:shadow-black/30 transition-all cursor-pointer group"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${config?.color || 'from-gray-400 to-gray-500'} text-white`}>
                        {config?.label || 'Other'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1E1E2E] dark:text-white mb-1 group-hover:text-[#FF6B4A] transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-3 text-sm text-[#1E1E2E]/40 dark:text-white/40 mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" fill="#fbbf24" />
                        {template.rating.toFixed(1)}
                      </span>
                      <span>{template.questions_count} questions</span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {template.uses_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#1E1E2E]/40 dark:text-white/40">by {template.author_name}</span>
                      <ChevronRight className="w-4 h-4 text-[#1E1E2E]/30 dark:text-white/30 group-hover:text-[#FF6B4A] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#1A1A1F] rounded-2xl border border-[#1E1E2E]/5 dark:border-white/10">
              <Sparkles className="w-16 h-16 text-[#1E1E2E]/20 dark:text-white/20 mx-auto mb-4" />
              <p className="text-[#1E1E2E]/50 dark:text-white/50 text-lg">No templates found</p>
              <p className="text-[#1E1E2E]/40 dark:text-white/40 text-sm">Be the first to publish a template in this category!</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setSelectedTemplate(null);
              setTemplateDetails(null);
              setExpandedQuestions(new Set());
            }}
          />
          <div className="relative bg-white dark:bg-[#1A1A1F] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setTemplateDetails(null);
                setExpandedQuestions(new Set());
              }}
              className="absolute top-4 right-4 p-2 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-[#1E1E2E] dark:text-white" />
            </button>

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${categoryConfig[selectedTemplate.category]?.color || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const Icon = categoryConfig[selectedTemplate.category]?.icon || Sparkles;
                    return <Icon className="w-8 h-8 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">
                    by {selectedTemplate.author_name} • {formatDate(selectedTemplate.created_at)}
                  </p>
                </div>
              </div>

              <p className="text-[#1E1E2E]/70 dark:text-white/70 mb-6">{selectedTemplate.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
                  <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{selectedTemplate.questions_count}</p>
                  <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">Questions</p>
                </div>
                <div className="text-center p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
                  <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{selectedTemplate.uses_count}</p>
                  <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">Uses</p>
                </div>
                <div className="text-center p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-amber-400" fill="#fbbf24" />
                    <span className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{selectedTemplate.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">{selectedTemplate.ratings_count} ratings</p>
                </div>
              </div>

              {selectedTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedTemplate.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-full text-sm text-[#1E1E2E]/60 dark:text-white/60">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Questions Preview */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#1E1E2E] dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Questions Preview
                </h3>
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6B4A]"></div>
                  </div>
                ) : templateDetails?.questions && templateDetails.questions.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {templateDetails.questions.map((question, idx) => (
                      <div
                        key={idx}
                        className="border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleQuestion(idx)}
                          className="w-full p-3 flex items-center justify-between hover:bg-[#FFFBF7] dark:hover:bg-[#0D0D0F] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="px-2 py-0.5 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] text-xs font-medium rounded-md flex-shrink-0">
                              Q{idx + 1}
                            </span>
                            <span className="text-sm text-[#1E1E2E] dark:text-white truncate">
                              {question.text}
                            </span>
                          </div>
                          {expandedQuestions.has(idx) ? (
                            <ChevronUp className="w-4 h-4 text-[#1E1E2E]/40 dark:text-white/40 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#1E1E2E]/40 dark:text-white/40 flex-shrink-0 ml-2" />
                          )}
                        </button>
                        {expandedQuestions.has(idx) && (
                          <div className="px-3 pb-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border-t border-[#1E1E2E]/5 dark:border-white/5">
                            <div className="space-y-1.5 pt-2">
                              {question.options.map((option, optIdx) => {
                                const isCorrect = question.correct.includes(optIdx);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                      isCorrect
                                        ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-white dark:bg-[#1A1A1F] text-[#1E1E2E]/70 dark:text-white/70'
                                    }`}
                                  >
                                    {isCorrect && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                                    <span className="font-medium mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                                    {option}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#1E1E2E]/5 dark:border-white/5 text-xs text-[#1E1E2E]/50 dark:text-white/50">
                              <span>{question.time_limit}s time limit</span>
                              <span>{question.points} points</span>
                              <span className="capitalize">{question.type} choice</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 text-center py-4">
                    No questions available
                  </p>
                )}
              </div>

              {/* Rating */}
              {token && (
                <div className="mb-6 p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
                  <p className="text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">Rate this template</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRateTemplate(selectedTemplate.id, star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${star <= Math.round(selectedTemplate.rating) ? 'text-amber-400' : 'text-[#1E1E2E]/20 dark:text-white/20'}`}
                          fill={star <= Math.round(selectedTemplate.rating) ? '#fbbf24' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={usingTemplate === selectedTemplate.id}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {usingTemplate === selectedTemplate.id ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Use This Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
