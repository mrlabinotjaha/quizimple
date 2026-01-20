import { useState } from 'react';
import { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Play, LogOut, Copy, Link, Check } from 'lucide-react';

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  quizName: string;
  onStart: () => void;
  onLeave: () => void;
}

export function Lobby({ roomCode, players, isHost, quizName, onStart, onLeave }: LobbyProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getRoomUrl = () => {
    return `${window.location.origin}/room/${roomCode}`;
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(getRoomUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{quizName}</h1>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground mb-2">Room Code</p>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-widest text-primary">
                  {roomCode}
                </span>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRoomCode}
                  className="gap-2"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRoomLink}
                  className="gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Players ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Waiting for players to join...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((player) => (
                  <Badge key={player.id} variant="secondary" className="text-sm py-1 px-3">
                    {player.username}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {isHost ? (
            <>
              <Button
                className="w-full"
                size="lg"
                onClick={onStart}
                disabled={players.length === 0}
              >
                <Play className="w-5 h-5 mr-2" />
                Start Quiz
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {players.length === 0
                  ? 'Share the room code with players to let them join'
                  : `${players.length} player${players.length > 1 ? 's' : ''} ready`}
              </p>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Waiting for host to start the quiz...
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={onLeave}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}
