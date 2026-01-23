import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from 'app/test/utils/test-utils';
import { renderHook, act } from '@testing-library/react';
import { UserProvider, UserContext } from '~/contexts/UserContext';
import type { ReactNode } from 'react';
import React, { useContext } from 'react';

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('useContext - error handling', () => {
    it('should throw error when used outside UserProvider', () => {
      expect(() => {
        renderHook(() => {
          const context = useContext(UserContext);
          if (!context) {
            throw new Error('UserContext must be used within UserProvider');
          }
          return context;
        });
      }).toThrow('UserContext must be used within UserProvider');
    });
  });

  describe('UserProvider', () => {
    it('should provide user context when used within UserProvider', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );

      const { result } = renderHook(() => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        return context;
      }, { wrapper });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('favorites');
      expect(result.current).toHaveProperty('setUser');
      expect(result.current).toHaveProperty('setFavorites');
      expect(result.current).toHaveProperty('fetchUser');
      expect(result.current).toHaveProperty('fetchFavorites');
      expect(result.current).toHaveProperty('toggleFavorite');
    });

    it('should initialize with null user and empty favorites', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );

      const { result } = renderHook(() => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        return context;
      }, { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.favorites).toEqual([]);
    });

    it('should not fetch user if no token in localStorage', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );

      const { result } = renderHook(() => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        return context;
      }, { wrapper });

      // Without token, user should remain null
      expect(result.current.user).toBeNull();
    });

    it('should setUser and update context', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );

      const { result } = renderHook(() => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        return context;
      }, { wrapper });

      const newUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

      act(() => {
        result.current.setUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
    });

    it('should setFavorites and update context', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <UserProvider>{children}</UserProvider>
      );

      const { result } = renderHook(() => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        return context;
      }, { wrapper });

      const newFavorites = [
  {
    id: 1,
    name: 'Pet 1',
    type: 'dog',
    shelter: {},
    species: 'Canis familiaris',
    age: 3,
    gender: 'male',
    profile_picture: null,
    status: 'available',
    description: 'A friendly dog',
  },
  {
    id: 2,
    name: 'Pet 2',
    type: 'cat',
    shelter: {},
    species: 'Felis catus',
    age: 2,
    gender: 'female',
    profile_picture: null,
    status: 'available',
    description: 'A cute cat',
  },
];

      act(() => {
        return result.current.setFavorites(newFavorites);
      });

      expect(result.current.favorites).toEqual(newFavorites);
    });
  });

  describe('Component rendering with UserProvider', () => {
    it('should render component without errors', () => {
      const TestComponent = () => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        const { user } = context;
        return <div>User: {user?.name || 'No user'}</div>;
      };

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Component should render successfully
      expect(screen.getByText(/User:/)).toBeInTheDocument();
    });

    it('should reflect context changes in component', async () => {
      const TestComponent = ({ onReady }: { onReady: (ctx: any) => void }) => {
        const context = useContext(UserContext);
        if (!context) throw new Error('Context must exist');
        React.useEffect(() => {
          onReady(context);
        }, [context, onReady]);
        const { user } = context;
        return <div>User: {user?.name || 'No user'}</div>;
      };

      let contextRef: any;
      const { rerender } = render(
        <UserProvider>
          <TestComponent onReady={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      // Update via the context
      await act(() => {
        contextRef.setUser({ id: 1, name: 'Alice', email: 'alice@example.com' });
      });

      // Re-render to see updated content
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });
  });
});


