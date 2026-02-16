import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from 'app/test/utils/test-utils';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '~/contexts/auth';
import { authService } from '~/api/authService';
import type { ReactNode } from 'react';

// Mock authService
vi.mock('~/api/authService', () => ({
  authService: {
    getToken: vi.fn(),
    getUser: vi.fn(),
    removeToken: vi.fn(),
    removeUser: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Using renderHook directly without provider
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    it('should provide auth context when used within AuthProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
    });
  });

  describe('Initial state', () => {
    it('should initialize with no user and isAuthenticated false', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for isLoading to become false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should restore user from localStorage on mount', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue('valid-token');
      vi.mocked(authService.getUser).mockReturnValue(mockUser);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it('should clear auth if token is invalid', async () => {
      vi.mocked(authService.getToken).mockReturnValue('invalid-token');
      vi.mocked(authService.getUser).mockReturnValue({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
      });
      vi.mocked(authService.getCurrentUser).mockRejectedValue(
        new Error('Token invalid')
      );

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.removeToken).toHaveBeenCalled();
      expect(authService.removeUser).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue(null);
      vi.mocked(authService.getUser).mockReturnValue(null);
      vi.mocked(authService.login).mockResolvedValue({
        token: 'auth-token',
        user: mockUser,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Perform login
      await act(async () => {
        await result.current.login('john@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.login).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
      });
    });

    it('should handle login error', async () => {
      vi.mocked(authService.getToken).mockReturnValue(null);
      vi.mocked(authService.getUser).mockReturnValue(null);
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('wrong@example.com', 'wrong');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue(null);
      vi.mocked(authService.getUser).mockReturnValue(null);
      vi.mocked(authService.register).mockResolvedValue({
        token: 'auth-token',
        user: mockUser,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const registrationData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        phone: '1234567890',
        address: '123 Main St',
      };

      await act(async () => {
        await result.current.register(registrationData);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.register).toHaveBeenCalledWith(registrationData);
    });

    it('should handle registration error', async () => {
      vi.mocked(authService.getToken).mockReturnValue(null);
      vi.mocked(authService.getUser).mockReturnValue(null);
      vi.mocked(authService.register).mockRejectedValue(
        new Error('Email already exists')
      );

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register({
            name: 'Test',
            email: 'existing@example.com',
            password: 'password123',
            password_confirmation: 'password123',
          });
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue('auth-token');
      vi.mocked(authService.getUser).mockReturnValue(mockUser);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('isAdmin flag', () => {
    it('should be true when user role is admin', async () => {
      const adminUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue('admin-token');
      vi.mocked(authService.getUser).mockReturnValue(adminUser);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(adminUser);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should be false when user role is user', async () => {
      const regularUser = {
        id: 2,
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue('user-token');
      vi.mocked(authService.getUser).mockReturnValue(regularUser);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(regularUser);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Component rendering with AuthProvider', () => {
    it('should render component with useAuth hook', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
      };

      vi.mocked(authService.getToken).mockReturnValue('auth-token');
      vi.mocked(authService.getUser).mockReturnValue(mockUser);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { user, isLoading } = useAuth();
        if (isLoading) return <div>Loading...</div>;
        return <div>Welcome, {user?.name}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
      });
    });
  });
});
