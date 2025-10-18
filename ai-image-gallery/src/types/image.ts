export interface ImageMetadata {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width: number;
  height: number;
  uploaded_at: string;
  updated_at: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'deleted';
  ai_tags?: string[];
  ai_description?: string;
  dominant_colors?: string[];
  thumbnail_url?: string;
  original_url?: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface ImageUploadOptions {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}

export interface GalleryFilters {
  search?: string;
  tags?: string[];
  colors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'uploaded_at' | 'filename' | 'file_size';
  sortOrder: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
