import { useState, useEffect } from 'react';
import { QuestionDisplay } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Square, Users, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HostControlsProps {
  question: QuestionDisplay;
  questionIndex: number;
  totalQuestions: number;
  answersReceived: number;
  totalPlayers: number;
  onNextQuestion: () => void;
  onEndQuiz: () => void;
  hideQuestions?: boolean;
}

export function HostControls({
  question,
  questionIndex,
  totalQuestions,
  answersReceived,
  totalPlayers,
  onNextQuestion,
  onEndQuiz,
  hideQuestions = false,
}: HostControlsProps) {
  const [timeLeft, setTimeLeft] = useState(question.time_limit);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const answerPercentage = totalPlayers > 0 ? (answersReceived / totalPlayers) * 100 : 0;
  const timerPercentage = (timeLeft / question.time_limit) * 100;

  // Reset timer and advanced flag when question changes
  useEffect(() => {
    setTimeLeft(question.time_limit);
    setHasAdvanced(false);
  }, [question, questionIndex]);

  // Countdown timer - auto advance when time runs out
  useEffect(() => {
    if (hasAdvanced) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-advance when timer expires
          setHasAdvanced(true);
          if (isLastQuestion) {
            onEndQuiz();
          } else {
            onNextQuestion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questionIndex, isLastQuestion, onNextQuestion, onEndQuiz, hasAdvanced]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Host Dashboard</h1>
          <Badge variant="outline">
            Question {questionIndex + 1} of {totalQuestions}
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

        {/* Current Question */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Question</CardTitle>
          </CardHeader>
          <CardContent>
            {hideQuestions ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Questions hidden</p>
                <p className="text-sm text-muted-foreground mt-1">Play from another device or incognito</p>
              </div>
            ) : (
              <>
                <p className="text-lg mb-4">{question.text}</p>
                <div className="grid grid-cols-2 gap-2">
                  {question.options.map((option, index) => {
                    const isCorrect = question.correct?.includes(index);
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-2 rounded border text-sm flex items-center gap-2",
                          isCorrect
                            ? "border-green-500 bg-green-500/10 text-green-400"
                            : "border-border"
                        )}
                      >
                        {isCorrect && <Check className="w-4 h-4 flex-shrink-0" />}
                        <span>{String.fromCharCode(65 + index)}. {option}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Answer Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={answerPercentage} className="h-3 mb-2" />
            <p className="text-center text-muted-foreground">
              {answersReceived} / {totalPlayers} answered
            </p>
            {answersReceived < totalPlayers && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Auto-advances when all players answer or timer runs out
              </p>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-3">
          {isLastQuestion ? (
            <Button className="w-full" size="lg" onClick={onEndQuiz}>
              End Quiz & Show Leaderboard
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={onNextQuestion}>
              <ChevronRight className="w-5 h-5 mr-2" />
              Skip to Next Question
            </Button>
          )}
          <Button variant="destructive" className="w-full" onClick={onEndQuiz}>
            <Square className="w-4 h-4 mr-2" />
            End Quiz Early
          </Button>
        </div>
      </div>
    </div>
  );
}
