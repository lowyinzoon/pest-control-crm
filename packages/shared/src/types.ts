export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    branchId: string | null;
    branchName: string | null;
  };
  tokens: TokenPair;
}

export interface DashboardStats {
  todayJobs: number;
  ongoingServices: number;
  completedServices: number;
  pendingQuotations: number;
  monthlyRevenue: number;
  activeCustomers: number;
}
