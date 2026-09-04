export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface DeleteAccountInput {
  confirmation: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput { email: string; }
export interface ResetPasswordInput { token: string; newPassword: string; }

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  locale: string;
  status: string;
  role: string;
  plan: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  onboardingComplete: boolean;
  lastSeenAt?: string;
  createdAt: string;
  accentColor?: string;
}

export interface UserSession {
  id: string;
  deviceType: "WEB" | "MOBILE_IOS" | "MOBILE_ANDROID" | "DESKTOP";
  deviceName?: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  scheduledFor?: string;
  estimatedMins?: number;
  projectId?: string;
  labelIds: string[];
  recurrenceType: string;
  reminderAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  dueTime?: string;
  scheduledFor?: string;
  estimatedMins?: number;
  projectId?: string;
  labelIds?: string[];
  recurrenceType?: string;
  reminderAt?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & { status?: string };

export interface TaskProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  orderIndex: number;
  taskCount: number;
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  progressPct: number;
}

export interface FocusStats {
  weeklyMins: number;
}

export interface DashboardData {
  todayTasks: Task[];
  habits: Habit[];
  todayCompletions: string[];
  activeGoals: Goal[];
  focusStats: FocusStats;
  streak: number;
  longestStreak: number;
  weeklyData: {
    date: string;
    tasksCompleted: number;
    habitRate: number;
    focusMins: number;
    productivityScore: number;
  }[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    icon: string;
    occurredAt: string;
  }[];
  moodCheckedIn: boolean;
}
