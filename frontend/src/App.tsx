import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { Login } from '@/components/Login';
import { Register } from '@/components/Register';
import { Home } from '@/components/Home';
import { Room } from '@/components/Room';
import { GuestJoin } from '@/components/GuestJoin';
import { LandingPage } from '@/components/LandingPage';
import { TemplateMarket } from '@/components/TemplateMarket';
import { QuizDetail } from '@/components/QuizDetail';
import { CreateQuiz } from '@/components/CreateQuiz';
import { Settings } from '@/components/Settings';
import { Groups } from '@/components/Groups';
import { AdminDashboard } from '@/components/AdminDashboard';
import { TermsPage, PrivacyPage, CookiesPage } from '@/components/LegalPages';
import { AppHeader } from '@/components/AppHeader';
import { API_URL } from '@/config';
import '@/styles/index.css';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF7] dark:bg-[#0D0D0F]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#FF6B4A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#1E1E2E]/50 dark:text-white/50">Loading...</p>
      </div>
    </div>
  );
}

// Auth wrapper for protected routes
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Redirect if already logged in
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Room page component
function RoomPage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [guestName, setGuestName] = useState<string | null>(() => {
    if (!roomCode) return null;
    const stored = localStorage.getItem(`guest_${roomCode}`);
    if (stored) {
      try { return JSON.parse(stored).guest_name || null; } catch { return null; }
    }
    return null;
  });
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user && !guestName) {
      setShowNamePrompt(true);
    }
  }, [user, guestName]);

  const handleGuestJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    setGuestName(trimmedName);
    setShowNamePrompt(false);
  };

  if (!roomCode) {
    navigate('/');
    return null;
  }

  if (showNamePrompt && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-full max-w-md bg-white dark:bg-[#1A1A1F] rounded-3xl p-8 border border-[#1E1E2E]/10 dark:border-white/10 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Join Room
            </h1>
            <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm mt-2">
              Room code: <span className="font-mono font-bold text-primary">{roomCode.toUpperCase()}</span>
            </p>
          </div>
          <form onSubmit={handleGuestJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1E1E2E] dark:text-white mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full px-4 py-3 bg-[#FFFBF7] dark:bg-[#0D0D0F] border border-[#1E1E2E]/10 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] transition-all text-[#1E1E2E] dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={nameInput.trim().length < 2}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all disabled:opacity-50"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 text-[#1E1E2E]/60 dark:text-white/60 hover:text-[#1E1E2E] dark:hover:text-white font-medium transition-colors"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Room
      roomCode={roomCode.toUpperCase()}
      guestName={guestName || undefined}
      onLeave={() => navigate('/')}
    />
  );
}

// Login page wrapper
function LoginPage() {
  const navigate = useNavigate();

  return (
    <Login
      onSwitchToRegister={() => navigate('/register')}
      onBackToLanding={() => navigate('/')}
    />
  );
}

// Register page wrapper
function RegisterPage() {
  const navigate = useNavigate();

  return (
    <Register
      onSwitchToLogin={() => navigate('/login')}
      onBackToLanding={() => navigate('/')}
    />
  );
}

// Guest join page wrapper
function JoinPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FFFBF7] dark:bg-[#0D0D0F]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <GuestJoin
        onJoin={(roomCode, guestName) => {
          // Store guest name so RoomPage can pick it up
          if (guestName && !user) {
            localStorage.setItem(`guest_${roomCode}`, JSON.stringify({ guest_name: guestName, guest_id: null }));
          }
          navigate(`/room/${roomCode}`);
        }}
        onSwitchToLogin={() => navigate('/login')}
        onBackToLanding={() => navigate('/')}
        isLoggedIn={!!user}
      />
    </div>
  );
}

// Templates page wrapper
function TemplatesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <TemplateMarket
      token={token}
      onBack={() => navigate('/')}
      onUseTemplate={() => navigate('/')}
      onLogin={() => navigate('/login')}
    />
  );
}

// Create quiz page wrapper
function CreateQuizPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const handleCreateRoom = async (quizId: string) => {
    try {
      const response = await fetch(`${API_URL}/rooms?quiz_id=${quizId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/room/${data.room_code}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <CreateQuiz
      onBack={() => navigate('/')}
      onQuizCreated={(quiz) => navigate(`/quiz/${quiz.id}/edit`)}
      onHost={handleCreateRoom}
    />
  );
}

// Edit quiz page wrapper
function EditQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (quizId && token) {
      fetch(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setQuiz(data);
          setLoading(false);
        })
        .catch(() => {
          navigate('/');
        });
    }
  }, [quizId, token]);

  if (loading) return <LoadingSpinner />;
  if (!quiz) return <Navigate to="/" replace />;

  const handleCreateRoom = async (qId: string) => {
    try {
      const response = await fetch(`${API_URL}/rooms?quiz_id=${qId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        navigate(`/room/${data.room_code}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <CreateQuiz
      quiz={quiz}
      onBack={() => navigate('/')}
      onQuizCreated={() => navigate('/')}
      onHost={handleCreateRoom}
    />
  );
}

// Groups page wrapper
function GroupsPage() {
  return <Groups />;
}

// Settings page wrapper
function SettingsPage() {
  const navigate = useNavigate();

  return (
    <Settings
      onBack={() => navigate('/')}
    />
  );
}

// Quiz detail page wrapper
function QuizDetailPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (quizId && token) {
      fetch(`${API_URL}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setQuiz(data);
          setLoading(false);
        })
        .catch(() => {
          navigate('/');
        });
    }
  }, [quizId, token]);

  if (loading) return <LoadingSpinner />;
  if (!quiz || !token) return <Navigate to="/" replace />;

  return (
    <QuizDetail
      quiz={quiz}
      token={token}
      onBack={() => navigate('/')}
      onPlay={async (qId) => {
        try {
          const response = await fetch(`${API_URL}/rooms?quiz_id=${qId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            navigate(`/room/${data.room_code}`);
          }
        } catch (err) {
          console.error('Failed to create room:', err);
        }
      }}
    />
  );
}

// Home page wrapper
function HomePage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <LandingPage
        onGetStarted={() => navigate('/register')}
        onLogin={() => navigate('/login')}
        onTemplateMarket={() => navigate('/templates')}
        onJoinQuiz={() => navigate('/join')}
      />
    );
  }

  return (
    <Home
      onEnterRoom={(roomCode) => navigate(`/room/${roomCode}`)}
      onTemplateMarket={() => navigate('/templates')}
      onViewQuizDetail={(quiz) => navigate(`/quiz/${quiz.id}`)}
      onCreateQuiz={() => navigate('/create-quiz')}
      onEditQuiz={(quiz) => navigate(`/quiz/${quiz.id}/edit`)}
      onJoinQuiz={() => navigate('/join')}
      onGroups={() => navigate('/groups')}
      onSettings={() => navigate('/settings')}
    />
  );
}

// Layout with persistent header for authenticated pages
function WithHeader({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  return (
    <>
      <AppHeader
        onHome={() => navigate('/')}
        onTemplateMarket={() => navigate('/templates')}
        onGroups={() => navigate('/groups')}
        onJoinQuiz={() => navigate('/join')}
        onSettings={() => navigate('/settings')}
        onCreateQuiz={() => navigate('/create-quiz')}
      />
      {children}
    </>
  );
}

function TermsPageWrapper() { const navigate = useNavigate(); return <TermsPage onBack={() => navigate('/')} />; }
function PrivacyPageWrapper() { const navigate = useNavigate(); return <PrivacyPage onBack={() => navigate('/')} />; }
function CookiesPageWrapper() { const navigate = useNavigate(); return <CookiesPage onBack={() => navigate('/')} />; }

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WithHeader><HomePage /></WithHeader>} />
      <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/templates" element={<WithHeader><TemplatesPage /></WithHeader>} />
      <Route path="/create-quiz" element={<RequireAuth><WithHeader><CreateQuizPage /></WithHeader></RequireAuth>} />
      <Route path="/groups" element={<RequireAuth><WithHeader><GroupsPage /></WithHeader></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><WithHeader><SettingsPage /></WithHeader></RequireAuth>} />
      <Route path="/quiz/:quizId" element={<RequireAuth><WithHeader><QuizDetailPage /></WithHeader></RequireAuth>} />
      <Route path="/quiz/:quizId/edit" element={<RequireAuth><WithHeader><EditQuizPage /></WithHeader></RequireAuth>} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/terms" element={<TermsPageWrapper />} />
      <Route path="/privacy" element={<PrivacyPageWrapper />} />
      <Route path="/cookies" element={<CookiesPageWrapper />} />
      <Route path="/room/:roomCode" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
