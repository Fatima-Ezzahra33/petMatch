import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { authService, type User, type LoginData, type RegisterData, type ForgotPasswordData, type ResetPasswordData } from '../authService';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Token Management', () => {
    it('should set and get token from localStorage', () => {
      const token = 'test-token-123';
      authService.setToken(token);
      expect(authService.getToken()).toBe(token);
    });

    it('should remove token from localStorage', () => {
      authService.setToken('test-token-123');
      authService.removeToken();
      expect(authService.getToken()).toBeNull();
    });

    it('should set Authorization header when token is set', () => {
      const token = 'test-token-123';
      authService.setToken(token);
      expect(localStorage.getItem('token')).toBe(token);
    });

    it('should handle missing token gracefully', () => {
      expect(authService.getToken()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should set and get user from localStorage', () => {
      const user: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };
      authService.setUser(user);
      expect(authService.getUser()).toEqual(user);
    });

    it('should remove user from localStorage', () => {
      const user: User = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };
      authService.setUser(user);
      authService.removeUser();
      expect(authService.getUser()).toBeNull();
    });

    it('should identify admin user correctly', () => {
      const adminUser: User = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      };
      authService.setUser(adminUser);
      expect(authService.isAdmin()).toBe(true);
    });

    it('should identify regular user correctly', () => {
      const user: User = {
        id: 2,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
      };
      authService.setUser(user);
      expect(authService.isAdmin()).toBe(false);
    });
  });

  describe('Authentication Status', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when authenticated', () => {
      authService.setToken('test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(loginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(authService.getToken()).toBe(result.token);
      expect(authService.getUser()).toEqual(result.user);
    });

    it('should handle login error', async () => {
      server.use(
        http.post('*/api/login', () => {
          return HttpResponse.json(
            { message: 'Invalid credentials' },
            { status: 401 }
          );
        })
      );

      const loginData: LoginData = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network error during login', async () => {
      server.use(
        http.post('*/api/login', () => {
          return HttpResponse.error();
        })
      );

      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.login(loginData)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData: RegisterData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        phone: '1234567890',
        address: '123 Main St',
      };

      const result = await authService.register(registerData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('newuser@example.com');
      expect(authService.getToken()).toBe(result.token);
    });

    it('should handle registration error', async () => {
      server.use(
        http.post('*/api/register', () => {
          return HttpResponse.json(
            { message: 'Email already exists' },
            { status: 422 }
          );
        })
      );

      const registerData: RegisterData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      await expect(authService.register(registerData)).rejects.toThrow('Email already exists');
    });

    it('should handle network error during registration', async () => {
      server.use(
        http.post('*/api/register', () => {
          return HttpResponse.error();
        })
      );

      const registerData: RegisterData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      authService.setToken('test-token');
      const user: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };
      authService.setUser(user);

      await authService.logout();

      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should handle logout error gracefully', async () => {
      server.use(
        http.post('*/api/logout', () => {
          return HttpResponse.error();
        })
      );

      authService.setToken('test-token');
      authService.setUser({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });

      // Should not throw, just log error
      await authService.logout();
      expect(authService.getToken()).toBeNull();
      expect(authService.getUser()).toBeNull();
    });

    it('should logout even without token', async () => {
      expect(authService.getToken()).toBeNull();
      await expect(authService.logout()).resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      authService.setToken('test-token');

      server.use(
        http.get('*/api/me', () => {
          return HttpResponse.json({
            id: 1,
            name: 'Current User',
            email: 'current@example.com',
            role: 'user',
          });
        })
      );

      const user = await authService.getCurrentUser();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(authService.getUser()).toEqual(user);
    });

    it('should throw error if no token', async () => {
      authService.removeToken();
      await expect(authService.getCurrentUser()).rejects.toThrow('No token found');
    });

    it('should handle getCurrentUser error', async () => {
      authService.setToken('invalid-token');

      server.use(
        http.get('*/api/me', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(authService.getCurrentUser()).rejects.toThrow('Failed to get user data');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email', async () => {
      const data: ForgotPasswordData = {
        email: 'test@example.com',
      };

      const result = await authService.forgotPassword(data);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('reset');
    });

    it('should handle forgot password error', async () => {
      server.use(
        http.post('*/api/forgot-password', () => {
          return HttpResponse.json(
            { message: 'Email not found' },
            { status: 404 }
          );
        })
      );

      const data: ForgotPasswordData = {
        email: 'nonexistent@example.com',
      };

      await expect(authService.forgotPassword(data)).rejects.toThrow('Email not found');
    });

    it('should handle network error during forgot password', async () => {
      server.use(
        http.post('*/api/forgot-password', () => {
          return HttpResponse.error();
        })
      );

      const data: ForgotPasswordData = {
        email: 'test@example.com',
      };

      await expect(authService.forgotPassword(data)).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const data: ResetPasswordData = {
        email: 'test@example.com',
        token: 'reset-token-123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      const result = await authService.resetPassword(data);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('success');
    });

    it('should handle invalid reset token', async () => {
      server.use(
        http.post('*/api/reset-password', () => {
          return HttpResponse.json(
            { message: 'Invalid reset token' },
            { status: 400 }
          );
        })
      );

      const data: ResetPasswordData = {
        email: 'test@example.com',
        token: 'invalid-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      await expect(authService.resetPassword(data)).rejects.toThrow('Invalid reset token');
    });

    it('should handle network error during password reset', async () => {
      server.use(
        http.post('*/api/reset-password', () => {
          return HttpResponse.error();
        })
      );

      const data: ResetPasswordData = {
        email: 'test@example.com',
        token: 'reset-token-123',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      await expect(authService.resetPassword(data)).rejects.toThrow();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const result = await authService.resendVerificationEmail('test@example.com');

      expect(result).toHaveProperty('message');
    });

    it('should handle rate limiting', async () => {
      server.use(
        http.post('*/api/email/resend', () => {
          return HttpResponse.json(
            { message: 'Please wait before requesting another email' },
            { status: 429 }
          );
        })
      );

      await expect(
        authService.resendVerificationEmail('test@example.com')
      ).rejects.toThrow('Please wait before requesting another email');
    });

    it('should handle resend email error', async () => {
      server.use(
        http.post('*/api/email/resend', () => {
          return HttpResponse.json(
            { message: 'Email not found' },
            { status: 404 }
          );
        })
      );

      await expect(
        authService.resendVerificationEmail('nonexistent@example.com')
      ).rejects.toThrow('Email not found');
    });

    it('should handle network error during resend', async () => {
      server.use(
        http.post('*/api/email/resend', () => {
          return HttpResponse.error();
        })
      );

      await expect(
        authService.resendVerificationEmail('test@example.com')
      ).rejects.toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle complete auth flow', async () => {
      // Register
      const registerData: RegisterData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      const registerResult = await authService.register(registerData);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.isAdmin()).toBe(false);

      // Logout
      await authService.logout();
      expect(authService.isAuthenticated()).toBe(false);

      // Login
      const loginResult = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(authService.isAuthenticated()).toBe(true);
    });
  });
});
