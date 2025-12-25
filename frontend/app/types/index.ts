/**
 * Central Type Definitions
 * All shared types for the CryptoCloud application
 */

// ============================================================================
// FILE & FOLDER TYPES
// ============================================================================

export interface FileMetadata {
  id: string;
  filename: string;
  owner_id: string;
  upload_time: string;
  file_size: number;
  isFolder: boolean;
  parentId: string | null;
  encryptedFileKey: string | null;
  // Folder statistics
  calculatedSize?: number; // Total size of folder contents
  itemCount?: number; // Number of items in folder
}

export interface Breadcrumb {
  id: string | null;
  name: string;
}

export interface PaginatedFileResponse {
  items: FileMetadata[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StorageUsage {
  used: number;
  quota: number;
}

// ============================================================================
// SHARING TYPES
// ============================================================================

export interface SharedFileResponse {
  id: string; // Share ID
  file_id: string;
  filename: string;
  file_size: number;
  owner_username: string;
  shared_at: string;
  encryptedFileKey: string;
}

export interface ShareRecipient {
  share_id: string;
  recipient_id: string;
  recipient_username: string;
}

export interface MyShareResponse {
  file_id: string;
  filename: string;
  file_size: number;
  shares: ShareRecipient[];
}

export interface PaginatedSharedFilesResponse {
  items: SharedFileResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedMySharesResponse {
  items: MyShareResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// PUBLIC SHARE TYPES
// ============================================================================

export interface CreatePublicShareRequest {
  password?: string;
  max_downloads?: number;
  expires_in_hours?: number;
}

export interface PublicShareResponse {
  token: string;
  url_base: string;
  expires_at: string;
  password_protected: boolean;
  max_downloads?: number;
}

export interface PublicShareMetadata {
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  expires_at: string;
  download_count: number;
  max_downloads?: number;
  password_required: boolean;
  is_expired: boolean;
}

export interface PublicShareListItem {
  id: string;
  token: string;
  file_id: string;
  filename: string;
  file_size: number;
  created_at: string;
  expires_at: string;
  download_count: number;
  max_downloads?: number;
  password_protected: boolean;
  is_active: boolean;
  is_expired: boolean;
}

export interface DownloadPublicFileRequest {
  password?: string;
}

export interface PublicFileDownloadResponse {
  download_url: string;
  filename: string;
  file_size: number;
  mime_type: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UploadUrlResponse {
  upload_url: string;
  s3_key: string;
}

export interface DownloadUrlResponse {
  download_url: string;
}

export interface ApiError {
  detail: string;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface UploadProgress {
  progress: number;
  message: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  message: string | null;
  error: string | null;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginResponse {
  access_token: string;
  publicKey: string;
  is_2fa_enabled: boolean;
  backup_codes?: string[];
  profile_picture_url?: string | null;
}

export interface RegisterResponse {
  user_id: string;
  username: string;
  publicKey: string;
  backup_codes: string[];
  profile_picture_url?: string | null;
}

export interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
  backup_codes: string[];
}

export interface TwoFactorStatusResponse {
  is_2fa_enabled: boolean;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

export interface LoadingState {
  isLoading: boolean;
  fileId?: string | null;
  message?: string | null;
}
