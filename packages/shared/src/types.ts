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
  code?: string;
  resource?: string;
  limit?: number;
  current?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RoleInfo {
  id: string;
  slug: string;
  name: string;
}

export interface PlanUsage {
  workspaces: number;
  clients: number;
  contacts: number;
  opportunities: number;
  tasks: number;
  members: number;
  documents: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role?: RoleInfo;
  /** @deprecated Prefer platformPermissions + workspacePermissions */
  permissions?: string[];
  platformPermissions?: string[];
  workspacePermissions?: string[];
  workspaceRole?: RoleInfo;
  plan?: string;
  planLimits?: Record<string, number | null>;
  usage?: PlanUsage;
  isSubscriber?: boolean;
  isSuperAdmin?: boolean;
}

export interface WorkspaceContext {
  id: string;
  name: string;
  slug: string;
  role: RoleInfo;
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
