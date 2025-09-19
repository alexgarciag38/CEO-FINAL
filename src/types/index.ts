// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: boolean;
  message?: string;
  context?: {
    module: string;
    payload?: any;
  };
}

// Dashboard Types
export interface KPI {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
  icon?: string;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Sales Types
export interface SalesData {
  id: string;
  product: string;
  revenue: number;
  quantity: number;
  category: string;
  date: string;
  client?: string;
}

export interface ABCAnalysis {
  product: string;
  revenue: number;
  percentage: number;
  cumulativePercentage: number;
  category: 'A' | 'B' | 'C';
}

// CSV Processing Types
export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  processedData?: any[];
}

export interface CSVUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  inviteCode: string;
}

export interface ResetPasswordForm {
  email: string;
}

// Navigation Types
export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  children?: NavItem[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// AI Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface AIAssistantState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

// Module Types
export type ModuleType = 'dashboard' | 'ventas' | 'financiero' | 'marketing' | 'crm' | 'rrhh' | 'estrategico';

export interface ModuleConfig {
  id: ModuleType;
  title: string;
  description: string;
  icon: string;
  path: string;
  enabled: boolean;
}

