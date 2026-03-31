import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import {
  Users,
  FileText,
  Store,
  BarChart3,
  Trash2,
  Shield,
  LogOut,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react';

interface Stats {
  total_users: number;
  total_quizzes: number;
  total_templates: number;
  total_sessions: number;
  total_groups: number;
  recent_users: any[];
  recent_quizzes: any[];
  recent_templates: any[];
}

type Tab = 'overview' | 'users' | 'quizzes' | 'templates' | 'groups';

export function AdminDashboard() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'quizzes') fetchQuizzes();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'groups') fetchGroups();
  }, [activeTab, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('admin_token', data.access_token);
      } else {
        setLoginError('Invalid password');
      }
    } catch {
      setLoginError('Failed to connect');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/stats`, { headers });
      if (res.ok) setStats(await res.json());
      else if (res.status === 401 || res.status === 403) handleLogout();
    } catch {} finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_URL}/admin/users`, { headers });
    if (res.ok) setUsers(await res.json());
  };

  const fetchQuizzes = async () => {
    const res = await fetch(`${API_URL}/admin/quizzes`, { headers });
    if (res.ok) setQuizzes(await res.json());
  };

  const fetchTemplates = async () => {
    const res = await fetch(`${API_URL}/admin/templates`, { headers });
    if (res.ok) setTemplates(await res.json());
  };

  const fetchGroups = async () => {
    const res = await fetch(`${API_URL}/admin/groups`, { headers });
    if (res.ok) setGroups(await res.json());
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Delete this ${type}? This cannot be undone.`)) return;
    const res = await fetch(`${API_URL}/admin/${type}s/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'quizzes') fetchQuizzes();
      if (activeTab === 'templates') fetchTemplates();
      if (activeTab === 'groups') fetchGroups();
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Login screen
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center p-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#FF6B4A]/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Admin Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">Enter admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-[#1A1A1F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/30 focus:border-[#FF6B4A] text-white placeholder:text-white/40"
              autoFocus
            />
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B4A]/30 transition-all">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'quizzes', label: 'Quizzes', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Store },
    { id: 'groups', label: 'Groups', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-[#1A1A1F] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>Admin</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0D0D0F]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Users', value: stats.total_users, icon: Users, color: 'from-blue-500 to-indigo-600' },
                { label: 'Quizzes', value: stats.total_quizzes, icon: FileText, color: 'from-emerald-500 to-teal-600' },
                { label: 'Templates', value: stats.total_templates, icon: Store, color: 'from-violet-500 to-purple-600' },
                { label: 'Sessions', value: stats.total_sessions, icon: Zap, color: 'from-amber-500 to-orange-600' },
                { label: 'Groups', value: stats.total_groups, icon: Users, color: 'from-rose-500 to-pink-600' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-[#1A1A1F] rounded-2xl p-5 border border-white/10">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-white/50 text-sm">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Users */}
            <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-semibold">Recent Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Username</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Quizzes</th><th className="px-5 py-3">Joined</th></tr></thead>
                  <tbody>
                    {stats.recent_users.map((u: any) => (
                      <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium">{u.username}</td>
                        <td className="px-5 py-3 text-white/60">{u.email || '-'}</td>
                        <td className="px-5 py-3">{u.quiz_count}</td>
                        <td className="px-5 py-3 text-white/60">{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Quizzes */}
            <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <h3 className="font-semibold">Recent Quizzes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Name</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Questions</th><th className="px-5 py-3">Created</th></tr></thead>
                  <tbody>
                    {stats.recent_quizzes.map((q: any) => (
                      <tr key={q.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 font-medium">{q.name}</td>
                        <td className="px-5 py-3 text-white/60">{q.owner_username}</td>
                        <td className="px-5 py-3">{q.question_count}</td>
                        <td className="px-5 py-3 text-white/60">{formatDate(q.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {loading && activeTab === 'overview' && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-[#FF6B4A] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Username</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Quizzes</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3"></th></tr></thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 font-medium">{u.username}</td>
                      <td className="px-5 py-3 text-white/60">{u.email || '-'}</td>
                      <td className="px-5 py-3">{u.quiz_count}</td>
                      <td className="px-5 py-3 text-white/60">{formatDate(u.created_at)}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete('user', u.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-semibold">All Quizzes ({quizzes.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Name</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Questions</th><th className="px-5 py-3">Created</th><th className="px-5 py-3"></th></tr></thead>
                <tbody>
                  {quizzes.map((q: any) => (
                    <tr key={q.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 font-medium">{q.name}</td>
                      <td className="px-5 py-3 text-white/60">{q.owner_username}</td>
                      <td className="px-5 py-3">{q.question_count}</td>
                      <td className="px-5 py-3 text-white/60">{formatDate(q.created_at)}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete('quizze', q.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-semibold">All Templates ({templates.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Name</th><th className="px-5 py-3">Author</th><th className="px-5 py-3">Visibility</th><th className="px-5 py-3">Uses</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Created</th><th className="px-5 py-3"></th></tr></thead>
                <tbody>
                  {templates.map((t: any) => (
                    <tr key={t.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 font-medium">{t.name}</td>
                      <td className="px-5 py-3 text-white/60">{t.author_name}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.visibility === 'private' ? 'bg-amber-500/20 text-amber-400' :
                          t.visibility === 'group' ? 'bg-violet-500/20 text-violet-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>{t.visibility || 'public'}</span>
                      </td>
                      <td className="px-5 py-3">{t.uses_count}</td>
                      <td className="px-5 py-3">{t.rating?.toFixed(1) || '0.0'}</td>
                      <td className="px-5 py-3 text-white/60">{formatDate(t.created_at)}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete('template', t.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="bg-[#1A1A1F] rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="font-semibold">All Groups ({groups.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-white/40 text-left"><th className="px-5 py-3">Name</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Members</th><th className="px-5 py-3">Created</th><th className="px-5 py-3"></th></tr></thead>
                <tbody>
                  {groups.map((g: any) => (
                    <tr key={g.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 font-medium">{g.name}</td>
                      <td className="px-5 py-3 text-white/60">{g.owner_username}</td>
                      <td className="px-5 py-3">{g.member_count}</td>
                      <td className="px-5 py-3 text-white/60">{formatDate(g.created_at)}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete('group', g.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
