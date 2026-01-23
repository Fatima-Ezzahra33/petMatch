import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from 'app/test/utils/test-utils';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '~/contexts/themeContext';
import type { ReactNode } from 'react';

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.classList.remove('dark-mode');
  });

  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
    });

    it('should provide theme context when used within ThemeProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current).toHaveProperty('isDarkMode');
      expect(result.current).toHaveProperty('toggleTheme');
    });
  });

  describe('Initial state', () => {
    it('should initialize with light mode (isDarkMode false)', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.isDarkMode).toBe(false);
    });

    it('should restore dark mode from localStorage on mount', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Wait for useEffect to run and set isDarkMode
      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      }, { timeout: 100 });
    });

    it('should add dark-mode class to body when loading dark theme', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(document.body.classList.contains('dark-mode')).toBe(true);
      }, { timeout: 100 });
    });

    it('should not add dark-mode class when loading light theme', () => {
      localStorage.setItem('theme', 'light');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      renderHook(() => useTheme(), { wrapper });

      expect(document.body.classList.contains('dark-mode')).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark mode', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.isDarkMode).toBe(false);

      await act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.isDarkMode).toBe(true);
    });

    it('should toggle from dark to light mode', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      }, { timeout: 100 });

      await act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(false);
      }, { timeout: 100 });
    });

    it('should add dark-mode class to body when toggling to dark', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(document.body.classList.contains('dark-mode')).toBe(false);

      await act(() => {
        result.current.toggleTheme();
      });

      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    it('should remove dark-mode class from body when toggling to light', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(document.body.classList.contains('dark-mode')).toBe(true);
      }, { timeout: 100 });

      await act(() => {
        result.current.toggleTheme();
      });

      await waitFor(() => {
        expect(document.body.classList.contains('dark-mode')).toBe(false);
      }, { timeout: 100 });
    });
  });

  describe('localStorage persistence', () => {
    it('should persist dark theme to localStorage', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should persist light theme to localStorage', async () => {
      localStorage.setItem('theme', 'dark');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      }, { timeout: 100 });

      await act(() => {
        result.current.toggleTheme();
      });

      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('should survive page reload', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result: result1 } = renderHook(() => useTheme(), { wrapper });

      await act(() => {
        result1.current.toggleTheme();
      });

      // Simulate saving to localStorage
      expect(localStorage.getItem('theme')).toBe('dark');

      // Simulate page reload by creating new provider
      const { result: result2 } = renderHook(() => useTheme(), { wrapper });

      await waitFor(() => {
        expect(result2.current.isDarkMode).toBe(true);
      }, { timeout: 100 });
    });
  });

  describe('Component rendering with ThemeProvider', () => {
    it('should render component with useTheme hook', () => {
      const TestComponent = () => {
        const { isDarkMode, toggleTheme } = useTheme();
        return (
          <div>
            <p>Mode: {isDarkMode ? 'Dark' : 'Light'}</p>
            <button onClick={toggleTheme}>Toggle</button>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Mode: Light')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle/i })).toBeInTheDocument();
    });

    it('should update component when theme changes', async () => {
      const TestComponent = () => {
        const { isDarkMode, toggleTheme } = useTheme();
        return (
          <div>
            <p>Mode: {isDarkMode ? 'Dark' : 'Light'}</p>
            <button onClick={toggleTheme}>Toggle</button>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByText('Mode: Light')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: /toggle/i });
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Mode: Dark')).toBeInTheDocument();
      });
    });

    it('should apply dark-mode class to body when rendering', async () => {
      localStorage.setItem('theme', 'dark');

      const TestComponent = () => {
        const { isDarkMode } = useTheme();
        return <div>Dark Mode: {isDarkMode ? 'Enabled' : 'Disabled'}</div>;
      };

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(document.body.classList.contains('dark-mode')).toBe(true);
      }, { timeout: 100 });
    });
  });

  describe('CSS Class Management', () => {
    it('should correctly manage body classes on multiple toggles', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(document.body.classList.contains('dark-mode')).toBe(false);

      // Toggle to dark
      await act(() => {
        result.current.toggleTheme();
      });
      expect(document.body.classList.contains('dark-mode')).toBe(true);

      // Toggle back to light
      await act(() => {
        result.current.toggleTheme();
      });
      expect(document.body.classList.contains('dark-mode')).toBe(false);

      // Toggle to dark again
      await act(() => {
        result.current.toggleTheme();
      });
      expect(document.body.classList.contains('dark-mode')).toBe(true);
    });
  });
});
