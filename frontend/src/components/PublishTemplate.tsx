import { useState } from 'react';
import {
  X,
  Share2,
  Tag,
  FileText,
  Folder,
  Plus,
  Sparkles
} from 'lucide-react';
import { Quiz, TemplateCategory } from '../types';
import { API_URL } from '../config';

interface PublishTemplateProps {
  quiz: Quiz;
  token: string;
  onClose: () => void;
  onPublished: () => void;
}

const categories: { value: TemplateCategory; label: string }[] = [
  { value: 'programming', label: 'Programming' },
  { value: 'education', label: 'Education' },
  { value: 'science', label: 'Science' },
  { value: 'languages', label: 'Languages' },
  { value: 'history', label: 'History' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'business', label: 'Business' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' }
];

export function PublishTemplate({ quiz, token, onClose, onPublished }: PublishTemplateProps) {
  const [name, setName] = useState(quiz.name);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('other');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (quiz.questions.length < 1) {
      setError('Quiz must have at least 1 question');
      return;
    }

    setPublishing(true);

    try {
      const res = await fetch(`${API_URL}/quizzes/${quiz.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          tags
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to publish template');
      }

      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish template');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1A1A1F] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-[#1E1E2E] dark:text-white" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Publish to Template Market
              </h2>
              <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Share your quiz with the community</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Template Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
                placeholder="Give your template a catchy name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40 resize-none"
                placeholder="Describe what this quiz covers and who it's for"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                <Folder className="w-4 h-4 inline mr-1" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-[#1E1E2E] dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (up to 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
                  placeholder="Add a tag"
                  disabled={tags.length >= 5}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  className="px-4 py-3 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] rounded-xl hover:bg-[#2E2E3E] dark:hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-full text-sm text-[#1E1E2E]/70 dark:text-white/70 flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-[#FF6B4A]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quiz Info */}
            <div className="p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-xl">
              <p className="text-sm text-[#1E1E2E]/60 dark:text-white/60">
                This template will include <strong className="text-[#1E1E2E] dark:text-white">{quiz.questions.length} questions</strong> from your quiz "{quiz.name}".
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Publish Template
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
