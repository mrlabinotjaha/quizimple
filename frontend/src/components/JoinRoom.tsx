import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface JoinRoomProps {
  onJoin: (roomCode: string) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 6) {
      onJoin(roomCode.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        type="text"
        placeholder="Enter room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        maxLength={6}
        className="text-center text-lg tracking-widest uppercase font-mono"
      />
      <Button type="submit" disabled={roomCode.length !== 6}>
        Join
      </Button>
    </form>
  );
}
