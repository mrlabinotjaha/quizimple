import { useState } from 'react';
import { Users, ArrowLeft } from 'lucide-react';

interface GuestJoinProps {
  onJoin: (roomCode: string, name: string) => void;
  onSwitchToLogin: () => void;
  onBackToLanding?: () => void;
  isLoggedIn?: boolean;
}

export function GuestJoin({ onJoin, onSwitchToLogin, onBackToLanding, isLoggedIn }: GuestJoinProps) {
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedCode = roomCode.trim().toUpperCase();
    const trimmedName = name.trim();

    if (trimmedCode.length !== 6) {
      setError('Room code must be 6 characters');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    onJoin(trimmedCode, trimmedName);
  };

  return (
    <div className="w-full max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-8 border border-[#1E1E2E]/10 dark:border-white/10 shadow-xl shadow-[#1E1E2E]/5 dark:shadow-black/30">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-[#1E1E2E]/50 dark:text-white/50 hover:text-[#1E1E2E] dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Join a Quiz
          </h1>
          <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm mt-1">
            Enter the room code and your name to join
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
              Room Code
            </label>
            <input
              type="text"
              placeholder="ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-4 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40 text-center text-xl tracking-[0.3em] uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
              Your Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white placeholder:text-[#1E1E2E]/40 dark:placeholder:text-white/40"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={roomCode.length !== 6 || name.trim().length < 2}
            className="w-full py-4 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all disabled:opacity-50"
          >
            Join Room
          </button>

          {!isLoggedIn && (
            <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 text-center">
              Want to create quizzes?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#FF6B4A] hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
