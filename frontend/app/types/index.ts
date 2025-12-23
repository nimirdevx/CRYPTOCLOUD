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
}

export interface Breadcrumb {
  id: string | null;
  name: string;
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

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
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
}

export interface RegisterResponse {
  user_id: string;
  username: string;
  publicKey: string;
  backup_codes: string[];
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
