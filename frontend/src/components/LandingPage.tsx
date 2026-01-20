import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import {
  Sparkles,
  Users,
  BarChart3,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Play,
  Check,
  Star,
  ChevronRight,
  Store
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onTemplateMarket?: () => void;
  onJoinQuiz?: () => void;
}

export function LandingPage({ onGetStarted, onLogin, onTemplateMarket, onJoinQuiz }: LandingPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered',
      subtitle: 'Question Generation',
      description: 'Describe your topic, get professional quiz questions instantly. Our AI understands context and creates engaging, relevant questions.',
      accent: 'from-amber-400 to-orange-500'
    },
    {
      icon: Users,
      title: 'Real-time',
      subtitle: 'Multiplayer Sessions',
      description: 'Host live quizzes with unique room codes. Watch answers flow in real-time as participants compete on leaderboards.',
      accent: 'from-violet-400 to-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Instant',
      subtitle: 'Analytics & Insights',
      description: 'Track performance with detailed analytics. Identify knowledge gaps and measure learning outcomes effectively.',
      accent: 'from-cyan-400 to-blue-500'
    },
    {
      icon: Clock,
      title: 'Timed',
      subtitle: 'Question Challenges',
      description: 'Add excitement with customizable time limits. Create pressure that mimics real test conditions.',
      accent: 'from-rose-400 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Anti-Cheat',
      subtitle: 'Detection System',
      description: 'Monitor tab switches and suspicious behavior. Maintain integrity with built-in proctoring features.',
      accent: 'from-emerald-400 to-teal-500'
    },
    {
      icon: Zap,
      title: 'Bulk Import',
      subtitle: 'From JSON',
      description: 'Import hundreds of questions instantly from JSON files. Perfect for migrating existing question banks.',
      accent: 'from-yellow-400 to-amber-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0D0F] overflow-hidden transition-colors" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#FF6B4A]/10 to-[#FF8F6B]/5 dark:from-[#FF6B4A]/20 dark:to-[#FF8F6B]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-br from-violet-500/8 to-purple-400/5 dark:from-violet-500/15 dark:to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-400/10 to-orange-300/5 dark:from-amber-400/15 dark:to-orange-300/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation - Pill Effect */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between h-16 px-6 bg-white dark:bg-[#1A1A1F] rounded-full shadow-lg shadow-[#1E1E2E]/5 dark:shadow-black/20 border border-[#1E1E2E]/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-lg flex items-center justify-center shadow-md shadow-[#FF6B4A]/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#1E1E2E] dark:text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Quizimple
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {['Features', 'Benefits', 'Pricing'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="px-4 py-2 text-[#1E1E2E]/70 dark:text-white/70 hover:text-[#1E1E2E] dark:hover:text-white font-medium text-sm transition-colors"
                >
                  {item}
                </a>
              ))}
              <button
                onClick={onJoinQuiz}
                className="ml-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-violet-500/30 transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" fill="currentColor" />
                Join Quiz
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={onLogin}
                className="hidden sm:block px-4 py-2 text-[#1E1E2E] dark:text-white font-medium text-sm hover:text-[#FF6B4A] transition-colors"
              >
                Log in
              </button>
              <button
                onClick={onGetStarted}
                className="px-5 py-2 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-medium text-sm rounded-full transition-all hover:shadow-lg hover:shadow-[#FF6B4A]/30"
              >
                Sign up for free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className={`transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-full mb-8">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#FF6B4A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B4A]"></span>
                </span>
                <span className="text-sm font-medium text-[#1E1E2E]/70 dark:text-white/70">AI-Powered Quiz Platform</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-normal text-[#1E1E2E] dark:text-white leading-[1.1] mb-8" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Create quizzes that
                <br />
                <span className="relative">
                  <span className="relative z-10 italic">captivate</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-4" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 2 150 2 198 8" stroke="#FF6B4A" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                {' '}minds
              </h1>

              <p className="text-lg text-[#1E1E2E]/60 dark:text-white/60 leading-relaxed mb-10 max-w-lg">
                The modern platform for educators and trainers. Build interactive quizzes in minutes,
                host live sessions, and track learning outcomes with powerful analytics.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={onGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-2xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-[#FF6B4A]/30 hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Creating — It's Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button className="group px-8 py-4 bg-white dark:bg-[#1A1A1F] text-[#1E1E2E] dark:text-white font-semibold rounded-2xl border-2 border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20 transition-all flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1E1E2E] dark:bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 text-white dark:text-[#1E1E2E] ml-0.5" fill="currentColor" />
                  </div>
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
                  ].map((src, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#FFFBF7] dark:border-[#0D0D0F] overflow-hidden">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#FFFBF7] dark:border-[#0D0D0F] bg-[#1E1E2E] dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-[#1E1E2E]">
                    +2k
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-4 h-4 text-amber-400" fill="#fbbf24" />
                    ))}
                  </div>
                  <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Loved by 2,000+ educators</p>
                </div>
              </div>
            </div>

            {/* Right Visual - Interactive Card Stack */}
            <div className={`relative transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
              <div className="relative">
                {/* Background Card */}
                <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-400/10 dark:from-violet-500/30 dark:to-purple-400/20 rounded-3xl transform rotate-3" />

                {/* Main Quiz Card */}
                <div className="relative bg-white dark:bg-[#1A1A1F] rounded-3xl shadow-2xl shadow-[#1E1E2E]/10 dark:shadow-black/30 p-8 border border-[#1E1E2E]/5 dark:border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1E1E2E] dark:text-white">JavaScript Fundamentals</h3>
                        <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">12 questions • 15 min</p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
                      LIVE
                    </div>
                  </div>

                  <div className="bg-[#FFFBF7] dark:bg-[#0D0D0F] rounded-2xl p-6 mb-6">
                    <p className="text-[#1E1E2E]/40 dark:text-white/40 text-sm mb-3">Question 7 of 12</p>
                    <p className="text-lg font-medium text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      What is the output of console.log(typeof null)?
                    </p>
                    <div className="space-y-3">
                      {['"null"', '"undefined"', '"object"', '"boolean"'].map((option, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            i === 2
                              ? 'border-[#FF6B4A] bg-[#FF6B4A]/5 dark:bg-[#FF6B4A]/10'
                              : 'border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              i === 2 ? 'border-[#FF6B4A] bg-[#FF6B4A]' : 'border-[#1E1E2E]/20 dark:border-white/20'
                            }`}>
                              {i === 2 && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span className="font-medium text-[#1E1E2E] dark:text-white">{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1E1E2E]/5 dark:bg-white/10 flex items-center justify-center">
                          <Users className="w-4 h-4 text-[#1E1E2E]/60 dark:text-white/60" />
                        </div>
                        <span className="text-sm font-medium text-[#1E1E2E]/60 dark:text-white/60">24 playing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1E1E2E]/5 dark:bg-white/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-[#1E1E2E]/60 dark:text-white/60" />
                        </div>
                        <span className="text-sm font-medium text-[#1E1E2E]/60 dark:text-white/60">0:18</span>
                      </div>
                    </div>
                    <button className="px-6 py-2.5 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] font-medium rounded-xl hover:bg-[#2E2E3E] dark:hover:bg-white/90 transition-colors">
                      Submit
                    </button>
                  </div>
                </div>

                {/* Floating Stats Card */}
                <div className="absolute -bottom-8 -left-8 bg-white dark:bg-[#1A1A1F] rounded-2xl shadow-xl shadow-[#1E1E2E]/10 dark:shadow-black/30 p-5 border border-[#1E1E2E]/5 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">87%</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">Avg. Score</p>
                    </div>
                  </div>
                </div>

                {/* Floating Notification */}
                <div className="absolute -top-4 -right-4 bg-white dark:bg-[#1A1A1F] rounded-2xl shadow-xl shadow-[#1E1E2E]/10 dark:shadow-black/30 px-5 py-4 border border-[#1E1E2E]/5 dark:border-white/10 animate-bounce">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1E1E2E] dark:text-white text-sm">AI Generated!</p>
                      <p className="text-xs text-[#1E1E2E]/50 dark:text-white/50">12 questions ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Marquee */}
      <section className={`py-8 border-y border-[#1E1E2E]/10 dark:border-white/10 bg-white/50 dark:bg-[#1A1A1F]/50 backdrop-blur-sm transition-all duration-1000 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-center gap-16 flex-wrap px-8">
          {[
            { value: '50K+', label: 'Quizzes Created' },
            { value: '200K+', label: 'Questions Generated' },
            { value: '2K+', label: 'Active Educators' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>{stat.value}</p>
              <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 lg:px-8 bg-[#1E1E2E] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-white/10 rounded-full text-white/60 text-sm font-medium mb-6">
              Powerful Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-normal text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Everything you need to create
              <br />
              <span className="italic text-[#FF8F6B]">unforgettable</span> learning experiences
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 ${
                  activeFeature === i ? 'ring-2 ring-[#FF6B4A]/50' : ''
                }`}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-medium text-white mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {feature.title}
                </h3>
                <p className="text-lg text-white/60 mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {feature.subtitle}
                </p>
                <p className="text-white/40 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-[#FF8F6B] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Learn more</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Market Preview */}
      <section className="py-24 px-6 lg:px-8 bg-gradient-to-b from-[#FFFBF7] to-white dark:from-[#0D0D0F] dark:to-[#1A1A1F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-500/20 rounded-full text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                <Store className="w-4 h-4" />
                Template Market
              </span>
              <h2 className="text-4xl sm:text-5xl font-normal text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Discover & share
                <br />
                <span className="italic">community templates</span>
              </h2>
              <p className="text-lg text-[#1E1E2E]/60 dark:text-white/60 leading-relaxed mb-8">
                Browse hundreds of ready-to-use quiz templates created by educators worldwide.
                Found a great quiz? Share it with the community and help others learn.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Access 500+ professionally crafted templates',
                  'Share your best quizzes with the community',
                  'One-click import to your dashboard',
                  'Rate and review community templates'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#1E1E2E]/70 dark:text-white/70">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={onTemplateMarket}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/30 transition-all"
              >
                Explore Templates
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'JavaScript Basics', author: 'Sarah K.', uses: '2.3k', category: 'Programming', color: 'from-amber-400 to-orange-500' },
                  { title: 'World Geography', author: 'Mike R.', uses: '1.8k', category: 'Education', color: 'from-emerald-400 to-teal-500' },
                  { title: 'Medical Terminology', author: 'Dr. Chen', uses: '956', category: 'Healthcare', color: 'from-rose-400 to-pink-500' },
                  { title: 'French Vocabulary', author: 'Marie L.', uses: '1.2k', category: 'Languages', color: 'from-violet-400 to-purple-500' },
                ].map((template, i) => (
                  <div
                    key={i}
                    className={`bg-white dark:bg-[#1A1A1F] rounded-2xl p-5 border border-[#1E1E2E]/5 dark:border-white/10 shadow-lg dark:shadow-black/20 hover:shadow-xl transition-all hover:-translate-y-1 ${
                      i === 0 ? 'col-span-2' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4`}>
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-[#1E1E2E] dark:text-white mb-1">{template.title}</h4>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mb-3">by {template.author}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#1E1E2E]/40 dark:text-white/40 bg-[#1E1E2E]/5 dark:bg-white/10 px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                      <span className="text-xs text-[#1E1E2E]/40 dark:text-white/40">{template.uses} uses</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-6 lg:px-8 bg-[#FFFBF7] dark:bg-[#0D0D0F]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Chart Visual */}
            <div className="relative">
              <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-8 shadow-2xl shadow-[#1E1E2E]/5 dark:shadow-black/30 border border-[#1E1E2E]/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50 mb-1">Quiz Completion Rate</p>
                    <p className="text-4xl font-bold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      94.2%
                      <span className="text-lg text-emerald-500 ml-2">↑12%</span>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="px-3 py-1.5 bg-[#1E1E2E] dark:bg-white text-white dark:text-[#1E1E2E] text-xs font-medium rounded-full">
                      This Month
                    </div>
                  </div>
                </div>

                <div className="relative h-48 flex items-end justify-between gap-2">
                  {[65, 78, 45, 89, 72, 95, 88, 76, 92, 85, 98, 91].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                        style={{
                          height: `${height}%`,
                          background: i === 10
                            ? 'linear-gradient(to top, #FF6B4A, #FF8F6B)'
                            : 'linear-gradient(to top, #1E1E2E, #3E3E4E)'
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-[#1E1E2E]/10 dark:border-white/10 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Total Sessions', value: '1,247' },
                    { label: 'Avg. Score', value: '82%' },
                    { label: 'Engagement', value: '4.8/5' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-2xl font-bold text-[#1E1E2E] dark:text-white">{stat.value}</p>
                      <p className="text-sm text-[#1E1E2E]/50 dark:text-white/50">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-gradient-to-br from-[#FF6B4A]/20 to-[#FF8F6B]/10 dark:from-[#FF6B4A]/30 dark:to-[#FF8F6B]/20 rounded-3xl" />
            </div>

            {/* Benefits Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-[#FF6B4A]/10 dark:bg-[#FF6B4A]/20 rounded-full text-[#FF6B4A] text-sm font-medium mb-6">
                Why Quizimple?
              </span>
              <h2 className="text-4xl sm:text-5xl font-normal text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Transform how your
                <br />
                <span className="italic">audience learns</span>
              </h2>
              <p className="text-lg text-[#1E1E2E]/60 dark:text-white/60 leading-relaxed mb-10">
                Our platform combines the best of gamification and education to create
                memorable learning experiences that stick.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: 'Gamified Learning',
                    description: 'Points, streaks, and leaderboards transform passive learners into engaged competitors.',
                    icon: '🎮'
                  },
                  {
                    title: 'Save Hours with AI',
                    description: 'Generate professional quiz content in seconds, not hours. Focus on teaching, not typing.',
                    icon: '⚡'
                  },
                  {
                    title: 'Data-Driven Insights',
                    description: 'Identify knowledge gaps instantly. Know exactly where your audience needs more support.',
                    icon: '📊'
                  }
                ].map((benefit, i) => (
                  <div key={i} className="flex gap-5 p-5 rounded-2xl hover:bg-white dark:hover:bg-[#1A1A1F] hover:shadow-lg dark:hover:shadow-black/20 transition-all group">
                    <div className="w-14 h-14 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1E1E2E] dark:text-white text-lg mb-1">{benefit.title}</h3>
                      <p className="text-[#1E1E2E]/60 dark:text-white/60">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 lg:px-8 bg-[#FFFBF7] dark:bg-[#0D0D0F]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-[#1E1E2E]/5 dark:bg-white/10 rounded-full text-[#1E1E2E]/60 dark:text-white/60 text-sm font-medium mb-6">
              Simple Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-normal text-[#1E1E2E] dark:text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Start free, scale as
              <br />
              <span className="italic">you grow</span>
            </h2>
            <p className="text-lg text-[#1E1E2E]/60 dark:text-white/60 max-w-2xl mx-auto">
              No hidden fees. No credit card required. Upgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-8 border border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20 transition-all hover:shadow-xl dark:hover:shadow-black/20">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-2">Starter</h3>
                <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">Perfect for getting started</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>$0</span>
                <span className="text-[#1E1E2E]/50 dark:text-white/50">/month</span>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-4 bg-[#1E1E2E]/5 dark:bg-white/10 hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20 text-[#1E1E2E] dark:text-white font-semibold rounded-2xl transition-colors mb-8"
              >
                Get Started
              </button>
              <div className="space-y-4">
                {[
                  'Up to 5 quizzes',
                  '10 participants per session',
                  'Basic analytics',
                  'JSON import',
                  'Community templates'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[#1E1E2E]/70 dark:text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-[#1E1E2E] dark:bg-white rounded-3xl p-8 text-white dark:text-[#1E1E2E] transform hover:scale-[1.02] transition-all hover:shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-white/50 dark:text-[#1E1E2E]/50 text-sm">For educators & trainers</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>$19</span>
                <span className="text-white/50 dark:text-[#1E1E2E]/50">/month</span>
              </div>
              <button
                onClick={onGetStarted}
                className="w-full py-4 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-[#FF6B4A]/30 mb-8"
              >
                Start Free Trial
              </button>
              <div className="space-y-4">
                {[
                  'Unlimited quizzes',
                  '100 participants per session',
                  'AI question generation',
                  'Advanced analytics',
                  'Priority support',
                  'Publish to template market'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B4A] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/80 dark:text-[#1E1E2E]/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-[#1A1A1F] rounded-3xl p-8 border border-[#1E1E2E]/10 dark:border-white/10 hover:border-[#1E1E2E]/20 dark:hover:border-white/20 transition-all hover:shadow-xl dark:hover:shadow-black/20">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-[#1E1E2E] dark:text-white mb-2">Enterprise</h3>
                <p className="text-[#1E1E2E]/50 dark:text-white/50 text-sm">For organizations</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-[#1E1E2E] dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Custom</span>
              </div>
              <button className="w-full py-4 bg-[#1E1E2E] dark:bg-white hover:bg-[#2E2E3E] dark:hover:bg-white/90 text-white dark:text-[#1E1E2E] font-semibold rounded-2xl transition-colors mb-8">
                Contact Sales
              </button>
              <div className="space-y-4">
                {[
                  'Everything in Pro',
                  'Unlimited participants',
                  'Custom branding',
                  'SSO integration',
                  'Dedicated support',
                  'SLA guarantee'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-[#1E1E2E]/70 dark:text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-[#1E1E2E] relative overflow-hidden">
        {/* Decorative Gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF6B4A]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Ready to create something
            <br />
            <span className="italic text-[#FF8F6B]">extraordinary?</span>
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Join thousands of educators transforming how people learn.
            Start creating engaging quizzes today — it's free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="group px-10 py-5 bg-white text-[#1E1E2E] font-semibold rounded-2xl transition-all hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 flex items-center gap-2"
            >
              Start Creating — Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-10 py-5 text-white/80 hover:text-white font-medium transition-colors flex items-center gap-2">
              <Play className="w-5 h-5" />
              Watch 2-min demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141418] text-white/50 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B4A] to-[#FF8F6B] rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-semibold text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  Quizimple
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                The modern quiz platform for educators and trainers. Create, host, and analyze — all in one place.
              </p>
            </div>
            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Templates', 'Integrations']
              },
              {
                title: 'Resources',
                links: ['Documentation', 'API Reference', 'Help Center', 'Blog']
              },
              {
                title: 'Company',
                links: ['About', 'Careers', 'Contact', 'Press']
              }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">&copy; 2026 Quizimple. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
