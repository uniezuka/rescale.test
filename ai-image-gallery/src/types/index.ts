// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Re-export image types from dedicated module
export * from './image';

// Auth types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Search types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  colors?: string[];
  dateFrom?: string;
  dateTo?: string;
  fileSizeMin?: number;
  fileSizeMax?: number;
}

export interface SearchResult {
  images: any[]; // Will be updated to use ImageMetadata from image.ts
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  searchTime?: number;
}
