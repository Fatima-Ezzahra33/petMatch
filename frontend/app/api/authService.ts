// app/api/authService.ts
import { setAuthToken } from '../api/client';

// IMPORTANT: This should point to your Laravel API base URL
// The /api prefix is already in the path, so don't duplicate it
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";


const API_URL = `${API_BASE}/api`;

console.log("API_URL:", API_URL); // Debug log

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  address?: string;
  shelter_id?: number;
  email_verified_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

class AuthService {
  // Store token in localStorage
  setToken(token: string): void {
    localStorage.setItem("token", token);
    try {
      setAuthToken(token);
    } catch (e) {
      // If client is unavailable for some reason, ignore — localStorage still holds the token
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  removeToken(): void {
    localStorage.removeItem("token");
    try {
      setAuthToken(null);
    } catch (e) {
      // ignore
    }
  }

  // Store user data
  setUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  removeUser(): void {
    localStorage.removeItem("user");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin";
  }

  // API calls
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log("Registering to:", `${API_URL}/register`);
      console.log("Data:", data);

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result: AuthResponse = await response.json();
      this.setToken(result.token);
      this.setUser(result.user);
      return result;
    } catch (error) {
      console.error("Register error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Cannot connect to server.");
      }
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log("Logging in to:", `${API_URL}/login`);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result: AuthResponse = await response.json();
      this.setToken(result.token);
      this.setUser(result.user);
      return result;
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Cannot connect to server.");
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    const token = this.getToken();

    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    this.removeToken();
    this.removeUser();
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();

    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user data");
    }

    const user: User = await response.json();
    this.setUser(user);
    return user;
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      console.log(
        "Resending verification email to:",
        `${API_URL}/email/resend`
      );

      const response = await fetch(`${API_URL}/email/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Response status:", response.status);

      const result = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error(
            result.message || "Please wait before requesting another email"
          );
        }
        throw new Error(
          result.message || "Failed to resend verification email"
        );
      }

      return result;
    } catch (error) {
      console.error("Resend email error:", error);
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Cannot connect to server.");
      }
      throw error;
    }
  }


// Add these methods to the AuthService class
async forgotPassword(data: ForgotPasswordData): Promise<{ message: string }> {
  try {
    console.log("Requesting password reset:", `${API_URL}/forgot-password`);

    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Response status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to send reset link");
    }

    return result;
  } catch (error) {
    console.error("Forgot password error:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Cannot connect to server.");
    }
    throw error;
  }
}

async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
  try {
    console.log("Resetting password:", `${API_URL}/reset-password`);

    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Response status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to reset password");
    }

    return result;
  } catch (error) {
    console.error("Reset password error:", error);
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Cannot connect to server.");
    }
    throw error;
  }
}
}

export const authService = new AuthService();
