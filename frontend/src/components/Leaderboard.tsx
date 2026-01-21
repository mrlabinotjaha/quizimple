import { LeaderboardData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Home, EyeOff, CheckCircle, XCircle, BookOpen, Clock } from 'lucide-react';

interface LeaderboardProps {
  data: LeaderboardData;
  onLeave: () => void;
  hideResults?: boolean;
  isHost?: boolean;
  myAnswers?: Record<number, number[]>;
}

export function Leaderboard({ data, onLeave, hideResults = false, isHost = false, myAnswers = {} }: LeaderboardProps) {

  // Host always sees full results, players see based on hideResults setting
  const showDetailedResults = isHost || !hideResults;
  const { players, total_questions, questions } = data;
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd place display order
  const winner = players[0];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">Quiz Complete!</h1>
            {showDetailedResults && winner && (
              <p className="text-muted-foreground mt-1 text-sm">
                Winner: <span className="text-primary font-semibold">{winner.username}</span> with {winner.score} points!
              </p>
            )}
            {!showDetailedResults && (
              <p className="text-muted-foreground mt-1 text-sm">
                Thank you for participating! Results are hidden by the host.
              </p>
            )}
          </div>

          {/* Podium - 50% smaller */}
          {showDetailedResults && players.length >= 1 && (
            <div className="flex items-end justify-center gap-2">
              {podiumOrder.map((position) => {
                const entry = players[position];
                if (!entry) return null;

                const isFirst = position === 0;
                const isSecond = position === 1;
                const isThird = position === 2;

                return (
                  <div
                    key={entry.user_id}
                    className={`text-center ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'}`}
                  >
                    <div
                      className={`
                        rounded-t-lg p-2 min-w-[80px]
                        ${isFirst ? 'bg-yellow-500/20 border-yellow-500' : ''}
                        ${isSecond ? 'bg-gray-400/20 border-gray-400' : ''}
                        ${isThird ? 'bg-orange-600/20 border-orange-600' : ''}
                        border-2 border-b-0
                      `}
                    >
                      <div className="mb-1">
                        {isFirst && <Trophy className="w-5 h-5 text-yellow-500 mx-auto" />}
                        {isSecond && <Medal className="w-5 h-5 text-gray-400 mx-auto" />}
                        {isThird && <Award className="w-5 h-5 text-orange-600 mx-auto" />}
                      </div>
                      <p className="font-bold text-sm truncate max-w-[70px] mx-auto">{entry.username}</p>
                      <p className="text-primary font-semibold text-sm">{entry.score} pts</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.correct_answers}/{total_questions} correct
                      </p>
                    </div>
                    <div
                      className={`
                        flex items-center justify-center font-bold text-lg rounded-b-lg
                        ${isFirst ? 'h-12 bg-yellow-500/30' : ''}
                        ${isSecond ? 'h-8 bg-gray-400/30' : ''}
                        ${isThird ? 'h-6 bg-orange-600/30' : ''}
                      `}
                    >
                      {position + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Detailed Results */}
          {showDetailedResults && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-[#1E1E2E]/5 dark:bg-white/5 border border-[#1E1E2E]/10 dark:border-white/10'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-sm">{entry.username}</span>
                          {index === 0 && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded">
                              Winner
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-primary">{entry.score} pts</span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span>{entry.correct_answers} correct</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <XCircle className="w-3 h-3" />
                          <span>{entry.wrong_answers} wrong</span>
                        </div>
                        <div className="text-muted-foreground">
                          {total_questions > 0
                            ? Math.round((entry.correct_answers / total_questions) * 100)
                            : 0}% accuracy
                        </div>
                        {entry.avg_time !== undefined && entry.avg_time < 999999 && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <Clock className="w-3 h-3" />
                            <span>{entry.avg_time}s avg</span>
                          </div>
                        )}
                        {entry.tab_switches > 0 && (
                          <div className="flex items-center gap-1 text-red-500">
                            <EyeOff className="w-3 h-3" />
                            <span>{entry.tab_switches} tab switch{entry.tab_switches !== 1 ? 'es' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quiz Stats */}
          {showDetailedResults && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-xl font-bold text-primary">{total_questions}</p>
                    <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">{players.length}</p>
                    <p className="text-xs text-muted-foreground">Players</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">
                      {players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.correct_answers, 0) / players.length * 10) / 10 : 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Correct</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button className="w-full" size="lg" onClick={onLeave}>
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Review Questions Sidebar - Always visible */}
        {questions && questions.length > 0 && (
          <div className="lg:w-96 lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0 lg:py-4 lg:-my-4">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Review Questions</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Learn from your answers
                </p>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-[#1E1E2E]/5 dark:bg-white/5 border border-[#1E1E2E]/10 dark:border-white/10"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">
                        Q{index + 1}
                      </span>
                      <p className="font-medium text-sm flex-1">{q.text}</p>
                    </div>
                    <div className="grid gap-1.5 ml-6">
                      {q.options.map((option, optIndex) => {
                        const isCorrect = q.correct.includes(optIndex);
                        const myAnswer = myAnswers[index] || [];
                        const iSelected = myAnswer.includes(optIndex);
                        const isWrongSelection = iSelected && !isCorrect;

                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-1.5 p-1.5 rounded text-xs ${
                              isCorrect
                                ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
                                : isWrongSelection
                                ? 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400'
                                : 'bg-[#1E1E2E]/5 dark:bg-white/5'
                            }`}
                          >
                            <span className="font-medium w-4">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="flex-1">{option}</span>
                            {iSelected && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                isCorrect
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : 'bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>
                                Chosen
                              </span>
                            )}
                            {isCorrect && (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            )}
                            {isWrongSelection && (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
