import { useState, useEffect } from 'react';
import { QuestionDisplay } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: QuestionDisplay;
  questionIndex: number;
  totalQuestions: number;
  onSubmit: (answers: number[]) => void;
  hasSubmitted: boolean;
}

export function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onSubmit,
  hasSubmitted,
}: QuizQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(question.time_limit);

  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(question.time_limit);
  }, [question, questionIndex]);

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

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
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
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-green-500 font-medium">Answer submitted!</p>
                <p className="text-muted-foreground text-sm">Waiting for other players...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
