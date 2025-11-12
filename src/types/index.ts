// Tipos principais do Smart Honey

export type DraftStatus = 'sending' | 'sent' | 'error';

export interface Draft {
  id: string;
  description: string;
  amount: number;
  cardId: string;
  userId: string;
  status: DraftStatus;
  timestamp: Date;
  selectedDestinations?: string[]; // IDs dos responsáveis
  errorMessage?: string;
  audioUri?: string;
  textInput?: string;
}

export interface Card {
  id: string;
  name: string;
  owner: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tenantId?: string;
  tenantName?: string;
  role?: string;
}

export interface Destination {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  summary?: string;
  draft?: T;
  data?: T;
}

export interface SubmitDraftParams {
  audio?: {
    uri: string;
    name: string;
    type: string;
  };
  text?: string;
  cardId?: string;
  userId?: string;
  selectedDestinations?: string[]; // Array de UUIDs dos responsáveis
  date?: Date; // Data do lançamento (hoje por padrão)
  latitude?: number;
  longitude?: number;
}

export interface UpdateDraftParams {
  description?: string;
  amount?: number;
  cardId?: string;
  selectedDestinations?: string[];
  month?: string;
}

export interface QueuedDraft extends Draft {
  retryCount: number;
  lastRetryAt?: Date;
}

export interface MonthData {
  month: string; // YYYY-MM
  drafts: Draft[];
  totals: {
    [userId: string]: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  rememberMe: boolean;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    tenant: {
      id: string;
      name: string;
    };
    role: string;
  };
  error?: string;
}

// Invite types
export interface InviteData {
  id: string;
  email: string;
  role: string;
  inviteUrl: string;
  createdAt: string;
  tenantName?: string;
}

export interface AcceptInviteParams {
  token: string;
  name: string;
  password: string;
}

// Summary types
export interface SummaryByDestination {
  destinationId: string;
  destinationName: string;
  total: number;
}

// Notification types
export interface ParsedNotification {
  description: string;
  amount: number;
  timestamp: Date;
  cardLast4?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  AcceptInvite: { token?: string };
  MainTabs: undefined;
  Preferences: undefined;
  EditDraft: {
    draftId: string;
    description: string;
    amount: number;
    cardId: string;
    selectedDestinations: string[];
  };
  Queue: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Summary: undefined;
};

