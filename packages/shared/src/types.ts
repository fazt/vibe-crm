export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface WorkspaceContext {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  opportunities: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  value: number;
  probability: number;
  clientName?: string;
  contactName?: string;
  assigneeName?: string;
  dueDate?: string | null;
  order: number;
}

export interface DashboardMetrics {
  openOpportunities: number;
  pipelineValue: number;
  overdueTasks: number;
  weeklyActivities: number;
  winRate: number;
  pipelineByStage: { stage: string; count: number; value: number; color: string }[];
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}
