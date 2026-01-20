import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Player,
  QuestionDisplay,
  QuestionResultsData,
  LeaderboardData,
  WSMessage,
} from '@/types';
import { Lobby } from './Lobby';
import { QuizQuestion } from './QuizQuestion';
import { HostControls } from './HostControls';
import { Leaderboard } from './Leaderboard';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, Check } from 'lucide-react';

interface RoomProps {
  roomCode: string;
  onLeave: () => void;
  guestName?: string | null;
}

type RoomState = 'loading' | 'lobby' | 'playing' | 'results' | 'finished';

export function Room({ roomCode, onLeave, guestName }: RoomProps) {
  const { token } = useAuth();
  const isGuest = !!guestName;
  const [state, setState] = useState<RoomState>('loading');
  const [isHost, setIsHost] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDisplay | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answersReceived, setAnswersReceived] = useState(0);
  const [results, setResults] = useState<QuestionResultsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [hideResults, setHideResults] = useState(false);
  const [error, setError] = useState('');
  const [allAnswered, setAllAnswered] = useState(false);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.event) {
      case 'connected':
        setIsHost(message.data.is_host as boolean);
        setPlayers(message.data.players as Player[]);
        setTotalQuestions(message.data.total_questions as number);
        if (message.data.state === 'lobby') {
          setState('lobby');
        } else if (message.data.state === 'playing') {
          setState('playing');
        }
        break;

      case 'player_joined':
      case 'player_left':
        setPlayers(message.data.players as Player[]);
        break;

      case 'quiz_started':
      case 'next_question':
        setCurrentQuestion(message.data.question as QuestionDisplay);
        setQuestionIndex(message.data.index as number);
        setTotalQuestions(message.data.total as number);
        setHasSubmitted(false);
        setAnswersReceived(0);
        setResults(null);
        setAllAnswered(false);
        setState('playing');
        break;

      case 'answer_received':
        setAnswersReceived(message.data.count as number);
        break;

      case 'all_answered':
        setAllAnswered(true);
        break;

      case 'question_results':
        setResults(message.data as unknown as QuestionResultsData);
        if (message.data.hide_results) {
          setHideResults(true);
        }
        setState('results');
        break;

      case 'quiz_ended':
        setLeaderboard(message.data.leaderboard as LeaderboardData);
        if (message.data.hide_results) {
          setHideResults(true);
        }
        setState('finished');
        break;

      case 'error':
        setError(message.data.message as string);
        break;
    }
  }, []);

  const { sendMessage, isConnected } = useWebSocket({
    roomCode,
    token: isGuest ? null : token,
    guestName,
    onMessage: handleMessage,
  });

  useEffect(() => {
    if (!roomCode) return;
    // Guests don't need to fetch room info via API - they get it via WebSocket
    if (isGuest) return;
    if (!token) return;

    const fetchRoomInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/rooms/${roomCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setQuizName(data.quiz_name);
          setIsHost(data.is_host);
          setPlayers(data.players);
          setTotalQuestions(data.total_questions);
        } else {
          setError('Room not found');
        }
      } catch {
        setError('Failed to load room');
      }
    };

    fetchRoomInfo();
  }, [roomCode, token, isGuest]);

  useEffect(() => {
    if (isConnected && !isHost) {
      sendMessage('join_room');
    }
  }, [isConnected, isHost]);

  // Auto-advance to next question when all players have answered
  useEffect(() => {
    if (allAnswered && isHost && state === 'playing') {
      // Automatically go to next question (or end quiz if last question)
      sendMessage('next_question');
    }
  }, [allAnswered, isHost, state, sendMessage]);

  // Track tab switches for cheat detection (only for non-host players during quiz)
  useEffect(() => {
    if (isHost || state !== 'playing') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendMessage('tab_switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHost, state, sendMessage]);

  const handleStart = () => {
    sendMessage('start_quiz');
  };

  const handleSubmitAnswer = (answers: number[]) => {
    sendMessage('submit_answer', { question_index: questionIndex, answers });
    setHasSubmitted(true);
  };

  const handleNextQuestion = () => {
    sendMessage('next_question');
  };

  const handleEndQuiz = () => {
    sendMessage('end_quiz');
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={onLeave}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (state === 'finished' && leaderboard) {
    return <Leaderboard data={leaderboard} onLeave={onLeave} hideResults={hideResults} isHost={isHost} />;
  }

  if (state === 'lobby') {
    return (
      <Lobby
        roomCode={roomCode}
        players={players}
        isHost={isHost}
        quizName={quizName}
        onStart={handleStart}
        onLeave={onLeave}
      />
    );
  }

  if ((state === 'playing' || state === 'results') && currentQuestion) {
    if (isHost) {
      return (
        <HostControls
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          answersReceived={answersReceived}
          totalPlayers={players.length}
          onNextQuestion={handleNextQuestion}
          onEndQuiz={handleEndQuiz}
        />
      );
    }

    if (state === 'results' && results) {
      return (
        <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h2 className="text-2xl font-bold">
                  {hideResults ? 'Answer Submitted' : 'Results'}
                </h2>
              </div>

              {!hideResults && (
                <>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground mb-1">Correct Answer</p>
                    <p className="text-green-500 font-medium">
                      {results.correct
                        .map((c) => `${String.fromCharCode(65 + c)}: ${currentQuestion.options[c]}`)
                        .join(', ')}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Scores</h3>
                    <div className="space-y-2">
                      {Object.entries(results.scores)
                        .sort(([, a], [, b]) => b - a)
                        .map(([username, score]) => (
                          <div
                            key={username}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <span>{username}</span>
                            <span className="font-medium text-primary">{score} pts</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}

              {hideResults && (
                <p className="text-center text-muted-foreground">
                  Your answer has been recorded. Results will be revealed by the host.
                </p>
              )}

              <p className="text-center text-muted-foreground">
                Waiting for next question...
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <QuizQuestion
        question={currentQuestion}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        onSubmit={handleSubmitAnswer}
        hasSubmitted={hasSubmitted}
      />
    );
  }

  return null;
}
