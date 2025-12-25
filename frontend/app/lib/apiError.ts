/**
 * API Error Handler
 * Handles API errors including automatic logout on 401
 * Includes proactive JWT token validation
 */

import { jwtDecode } from "jwt-decode";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Global logout handler reference
 * This will be set by AuthContext
 */
let globalLogoutHandler: (() => void) | null = null;

/**
 * Set the global logout handler
 * Should be called by AuthContext on mount
 */
export const setGlobalLogoutHandler = (handler: () => void) => {
  globalLogoutHandler = handler;
};

/**
 * Decode JWT payload
 */
interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

/**
 * Check if JWT token is expired
 * Returns true if token is expired or invalid
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    if (!decoded.exp) {
      // If no expiration, consider it valid
      return false;
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp < currentTime;

    if (isExpired) {
      console.warn("JWT token has expired");
    }

    return isExpired;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    // If we can't decode it, consider it invalid
    return true;
  }
};

/**
 * Proactively check token validity before making API calls
 * Logs out user if token is expired
 */
export const checkTokenValidity = (): boolean => {
  if (typeof window === "undefined") {
    return true; // Skip check on server-side
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    return false; // No token means not authenticated
  }

  if (isTokenExpired(token)) {
    console.warn("Token expired - logging out proactively");

    // Call global logout handler if available
    if (globalLogoutHandler) {
      globalLogoutHandler();
    }

    // Redirect to login page
    window.location.href = "/auth/login";

    return false;
  }

  return true;
};

/**
 * Handle API error response
 * Automatically logs out user on 401 Unauthorized
 */
export const handleApiError = async (response: Response): Promise<never> => {
  // Handle 401 Unauthorized - token is invalid or expired
  if (response.status === 401) {
    console.warn("401 Unauthorized - logging out user");

    // Call global logout handler if available
    if (globalLogoutHandler) {
      globalLogoutHandler();
    }

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }

    throw new ApiError("Session expired. Please login again.", 401, response);
  }

  // Handle other error statuses
  let errorMessage = `Request failed with status ${response.status}`;

  try {
    const data = await response.json();
    errorMessage = data.detail || data.message || errorMessage;
  } catch (e) {
    // If response body is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }

  throw new ApiError(errorMessage, response.status, response);
};

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  return error instanceof ApiError && error.status === 401;
};
