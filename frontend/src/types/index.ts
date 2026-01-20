export type QuestionType = 'single' | 'multiple';

export interface Question {
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  time_limit: number;
  points: number;
}

export interface Quiz {
  id: string;
  name: string;
  owner_id: string;
  questions: Question[];
  hide_results: boolean;
  fun_mode: boolean;
}

export interface User {
  id: string;
  username: string;
  email?: string;
}

export interface Player {
  id: string;
  username: string;
  score: number;
}

export interface Room {
  code: string;
  quiz_name: string;
  state: 'lobby' | 'playing' | 'finished';
  is_host: boolean;
  players: Player[];
  current_question: number;
  total_questions: number;
}

export interface QuestionDisplay {
  text: string;
  type: QuestionType;
  options: string[];
  time_limit: number;
  points: number;
  correct?: number[];  // For host display
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  user_id: string;
  tab_switches: number;
  correct_answers: number;
  wrong_answers: number;
  avg_time?: number;  // Average answer time in seconds
}

export interface QuestionReview {
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  points: number;
}

export interface LeaderboardData {
  players: LeaderboardEntry[];
  total_questions: number;
  questions?: QuestionReview[];
}

// WebSocket events
export interface WSMessage {
  event: string;
  data: Record<string, unknown>;
}

export interface QuizStartedData {
  question: QuestionDisplay;
  index: number;
  total: number;
}

export interface AnswerReceivedData {
  count: number;
  total: number;
}

export interface QuestionResultsData {
  correct: number[];
  scores: Record<string, number>;
  answers: Record<string, number[]>;
  hide_results?: boolean;
}

export interface QuizEndedData {
  leaderboard: LeaderboardEntry[];
  hide_results?: boolean;
  session?: {
    session_id: string;
  };
}

// Quiz Session types
export interface PlayerResult {
  user_id: string;
  username: string;
  score: number;
  correct_answers: number;
  wrong_answers: number;
  tab_switches: number;
  answers: Record<number, number[]>;
}

export interface QuestionStat {
  question_index: number;
  question_text: string;
  correct_answers: number[];
  total_attempts: number;
  correct_attempts: number;
  accuracy_percentage: number;
  answer_distribution: Record<number, number>;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  quiz_name: string;
  room_code: string;
  host_id: string;
  started_at: string;
  ended_at: string;
  total_questions: number;
  participants: PlayerResult[];
  question_stats: QuestionStat[];
}

export interface QuizAnalytics {
  total_sessions: number;
  total_participants: number;
  average_score: number;
  average_accuracy: number;
  sessions: QuizSession[];
}

// Template Market types
export type TemplateCategory =
  | 'programming'
  | 'education'
  | 'science'
  | 'languages'
  | 'history'
  | 'healthcare'
  | 'business'
  | 'entertainment'
  | 'other';

export interface QuizTemplate {
  id: string;
  quiz_id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  author_id: string;
  author_name: string;
  questions_count: number;
  uses_count: number;
  rating: number;
  ratings_count: number;
  created_at: string;
  tags: string[];
}
