import { useState, useEffect, useRef } from 'react';
import { QuestionDisplay } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: QuestionDisplay;
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (answers: number[]) => void;
  hasSubmitted: boolean;
  answersReceived?: number;
  totalPlayers?: number;
  funMode?: boolean;
}

// Fun Mode effects - one at a time, stays permanent per question
type ChaosEffect = 'mirror' | 'shake' | 'flip' | 'opacity' | 'shrink';

export function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onSubmit,
  hasSubmitted,
  answersReceived = 0,
  totalPlayers = 0,
  funMode = false,
}: QuizQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(question.time_limit);
  const [activeEffect, setActiveEffect] = useState<ChaosEffect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track used effects across questions (persists during session)
  const usedEffectsRef = useRef<Set<ChaosEffect>>(new Set());
  const allEffects: ChaosEffect[] = ['mirror', 'shake', 'flip', 'opacity', 'shrink'];

  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(question.time_limit);
    setActiveEffect(null);
  }, [question, questionIndex]);

  // Fun Mode: Single effect, stays permanent per question
  useEffect(() => {
    if (!funMode || hasSubmitted) return;

    // Get available effects (not yet used this session)
    let availableEffects = allEffects.filter(e => !usedEffectsRef.current.has(e));

    // If all effects have been used, reset the tracking
    if (availableEffects.length === 0) {
      usedEffectsRef.current.clear();
      availableEffects = [...allEffects];
    }

    // Pick one random effect from available ones
    const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
    usedEffectsRef.current.add(effect);

    // Start effect after 2 seconds
    const startTimeout = setTimeout(() => {
      setActiveEffect(effect);
    }, 2000);

    return () => {
      clearTimeout(startTimeout);
    };
  }, [funMode, hasSubmitted, questionIndex]);

  useEffect(() => {
    if (hasSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (selectedAnswers.length > 0) {
            onSubmit(selectedAnswers);
          } else {
            onSubmit([]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted, questionIndex]);

  const toggleAnswer = (index: number) => {
    if (hasSubmitted) return;

    if (question.type === 'single') {
      setSelectedAnswers([index]);
    } else {
      if (selectedAnswers.includes(index)) {
        setSelectedAnswers(selectedAnswers.filter((a) => a !== index));
      } else {
        setSelectedAnswers([...selectedAnswers, index]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedAnswers.length > 0 && !hasSubmitted) {
      onSubmit(selectedAnswers);
    }
  };

  const timerPercentage = (timeLeft / question.time_limit) * 100;

  // Generate inline style based on active effect (permanent, full strength)
  const getEffectStyle = (): React.CSSProperties => {
    if (!activeEffect || !funMode) return {};

    switch (activeEffect) {
      case 'mirror':
        return { transform: 'scaleX(-1)' };
      case 'shake':
        return {};
      case 'flip':
        return { transform: 'rotate(180deg)' };
      case 'opacity':
        return { opacity: 0.1 };
      case 'shrink':
        return { transform: 'scale(0.4)' };
      default:
        return {};
    }
  };

  // Get effect name for display
  const getEffectName = () => {
    if (!activeEffect) return '';
    const names: Record<ChaosEffect, string> = {
      mirror: 'Mirror',
      shake: 'Shake',
      flip: 'Flip',
      opacity: 'Fade',
      shrink: 'Shrink'
    };
    return names[activeEffect];
  };

  // Get animation class for continuous effects
  const getAnimationClass = () => {
    if (!activeEffect || !funMode) return '';
    if (activeEffect === 'shake') return 'animate-fun-shake';
    return '';
  };

  return (
    <>
      {/* Fun Mode CSS Animations */}
      {funMode && (
        <style>{`
          @keyframes fun-shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
            20%, 40%, 60%, 80% { transform: translateX(8px); }
          }
          .animate-fun-shake { animation: fun-shake 0.5s ease-in-out infinite; }
        `}</style>
      )}

      <div
        ref={containerRef}
        className={cn(
          "min-h-screen p-4 md:p-8 flex items-center justify-center",
          getAnimationClass()
        )}
        style={getEffectStyle()}
      >
        <div className="w-full max-w-2xl space-y-6">
          {/* Fun Mode Indicator */}
          {funMode && !hasSubmitted && (
            <div className="text-center">
              <Badge className="bg-purple-500 text-white animate-pulse">
                🎉 Fun Mode Active!
              </Badge>
              {activeEffect && (
                <p className="text-xs text-purple-400 mt-1">
                  {getEffectName()} effect
                </p>
              )}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Question {questionIndex + 1} of {totalQuestions}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {question.points} points
            </Badge>
          </div>

          {/* Timer */}
          <div className="space-y-2">
            <Progress
              value={timerPercentage}
              className="h-3"
              indicatorClassName={cn(
                timeLeft <= 5 ? 'bg-red-500' : 'bg-primary'
              )}
            />
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Clock className={cn('w-6 h-6', timeLeft <= 5 && 'text-red-500')} />
              <span className={cn(timeLeft <= 5 && 'text-red-500')}>{timeLeft}s</span>
            </div>
          </div>

          {/* Question */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-2">{question.text}</h2>
              <p className="text-muted-foreground mb-6">
                {question.type === 'single' ? 'Select one answer' : 'Select all that apply'}
              </p>

              {/* Options */}
              <div className="grid gap-3">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => toggleAnswer(index)}
                    disabled={hasSubmitted}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all',
                      selectedAnswers.includes(index)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50',
                      hasSubmitted && 'opacity-70 cursor-not-allowed'
                    )}
                  >
                    <span
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center font-bold',
                        selectedAnswers.includes(index)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-[#1E1E2E]/10 dark:bg-white/10 text-[#1E1E2E] dark:text-white'
                      )}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {selectedAnswers.includes(index) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Submit */}
              {!hasSubmitted ? (
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={selectedAnswers.length === 0}
                >
                  Submit Answer
                </Button>
              ) : (
                <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span className="text-lg font-medium">{answersReceived} of {totalPlayers} answered</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
