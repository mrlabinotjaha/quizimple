import { LeaderboardData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Home, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface LeaderboardProps {
  data: LeaderboardData;
  onLeave: () => void;
  hideResults?: boolean;
  isHost?: boolean;
}

export function Leaderboard({ data, onLeave, hideResults = false, isHost = false }: LeaderboardProps) {
  // Host always sees full results, players see based on hideResults setting
  const showDetailedResults = isHost || !hideResults;
  const { players, total_questions } = data;
  const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd place display order
  const winner = players[0];

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Quiz Complete!</h1>
          {showDetailedResults && winner && (
            <p className="text-muted-foreground mt-2">
              Winner: <span className="text-primary font-semibold">{winner.username}</span> with {winner.score} points!
            </p>
          )}
          {!showDetailedResults && (
            <p className="text-muted-foreground mt-2">
              Thank you for participating! Results are hidden by the host.
            </p>
          )}
        </div>

        {/* Podium - only show if results are visible */}
        {showDetailedResults && players.length >= 1 && (
          <div className="flex items-end justify-center gap-4">
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
                      rounded-t-lg p-4 min-w-[120px]
                      ${isFirst ? 'bg-yellow-500/20 border-yellow-500' : ''}
                      ${isSecond ? 'bg-gray-400/20 border-gray-400' : ''}
                      ${isThird ? 'bg-orange-600/20 border-orange-600' : ''}
                      border-2 border-b-0
                    `}
                  >
                    <div className="mb-2">
                      {isFirst && <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />}
                      {isSecond && <Medal className="w-8 h-8 text-gray-400 mx-auto" />}
                      {isThird && <Award className="w-8 h-8 text-orange-600 mx-auto" />}
                    </div>
                    <p className="font-bold truncate max-w-[100px] mx-auto">{entry.username}</p>
                    <p className="text-primary font-semibold">{entry.score} pts</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.correct_answers}/{total_questions} correct
                    </p>
                  </div>
                  <div
                    className={`
                      flex items-center justify-center font-bold text-2xl rounded-b-lg
                      ${isFirst ? 'h-24 bg-yellow-500/30' : ''}
                      ${isSecond ? 'h-16 bg-gray-400/30' : ''}
                      ${isThird ? 'h-12 bg-orange-600/30' : ''}
                    `}
                  >
                    {position + 1}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Results - only show if results are visible */}
        {showDetailedResults && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-secondary'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          #{index + 1}
                        </span>
                        <span className="font-semibold">{entry.username}</span>
                        {index === 0 && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded">
                            Winner
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-primary text-lg">{entry.score} pts</span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {/* Correct answers */}
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{entry.correct_answers} correct</span>
                      </div>

                      {/* Wrong answers */}
                      <div className="flex items-center gap-1.5 text-red-500">
                        <XCircle className="w-4 h-4" />
                        <span>{entry.wrong_answers} wrong</span>
                      </div>

                      {/* Accuracy */}
                      <div className="text-muted-foreground">
                        {total_questions > 0
                          ? Math.round((entry.correct_answers / total_questions) * 100)
                          : 0}% accuracy
                      </div>

                      {/* Tab switches */}
                      {entry.tab_switches > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500">
                          <EyeOff className="w-4 h-4" />
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

        {/* Quiz Stats - only show if results are visible */}
        {showDetailedResults && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{total_questions}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{players.length}</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.correct_answers, 0) / players.length * 10) / 10 : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Correct</p>
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
    </div>
  );
}
