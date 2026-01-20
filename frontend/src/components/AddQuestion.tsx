import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { QuestionType } from '@/types';
import { Check, X, Plus, Trash2 } from 'lucide-react';

interface AddQuestionProps {
  onAdd: (question: {
    text: string;
    type: QuestionType;
    options: string[];
    correct: number[];
    time_limit: number;
    points: number;
  }) => void;
  onCancel: () => void;
}

export function AddQuestion({ onAdd, onCancel }: AddQuestionProps) {
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [type, setType] = useState<QuestionType>('single');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState<number[]>([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [points, setPoints] = useState(100);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      setCorrect(correct.filter((c) => c !== index).map((c) => (c > index ? c - 1 : c)));
    }
  };

  const toggleCorrect = (index: number) => {
    if (type === 'single') {
      setCorrect([index]);
    } else {
      if (correct.includes(index)) {
        setCorrect(correct.filter((c) => c !== index));
      } else {
        setCorrect([...correct, index]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter((o) => o.trim() !== '');
    if (validOptions.length < 2) {
      showToast('At least 2 options are required', 'warning');
      return;
    }

    if (correct.length === 0) {
      showToast('Select at least one correct answer', 'warning');
      return;
    }

    onAdd({
      text,
      type,
      options: validOptions,
      correct: correct.filter((c) => c < validOptions.length),
      time_limit: timeLimit,
      points,
    });
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1F] rounded-2xl p-8 border border-[#1E1E2E]/5 dark:border-white/10 shadow-sm dark:shadow-black/20" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <h2 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Add Question
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
            Question Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
            placeholder="Enter your question..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as QuestionType);
                setCorrect([]);
              }}
              className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
            >
              <option value="single">Single Choice</option>
              <option value="multiple">Multiple Choice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)}
              min={5}
              max={120}
              className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
              Points
            </label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 100)}
              min={10}
              max={1000}
              step={10}
              className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
            Options (click checkmark to mark as correct)
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(index)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    correct.includes(index)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#1E1E2E]/5 dark:bg-white/10 text-[#1E1E2E]/40 dark:text-white/40 hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/30 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-2 px-4 py-2 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E]/60 dark:text-white/60 font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-[#1E1E2E]/10 dark:border-white/10 text-[#1E1E2E] dark:text-white font-medium rounded-xl hover:bg-[#1E1E2E]/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </form>
    </div>
  );
}
