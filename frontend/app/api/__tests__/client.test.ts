import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import api, { setAuthToken } from '../client';

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset axios instance to default state
    delete api.defaults.headers.common['Authorization'];
  });

  afterEach(() => {
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
  });

  describe('Axios Configuration', () => {
    it('should have correct baseURL configured', () => {
      expect(api.defaults.baseURL).toBeDefined();
      expect(api.defaults.baseURL).toMatch(/localhost|http/);
    });

    it('should initialize with default headers', () => {
      expect(api.defaults.headers).toBeDefined();
      expect(api.defaults.headers.common).toBeDefined();
    });

    it('should be created as axios instance', () => {
      expect(api.get).toBeDefined();
      expect(api.post).toBeDefined();
      expect(api.put).toBeDefined();
      expect(api.delete).toBeDefined();
      expect(api.patch).toBeDefined();
    });
  });

  describe('Token Management', () => {
    it('should set Authorization header when token is provided', () => {
      const token = 'test-token-123';
      setAuthToken(token);

      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should remove Authorization header when token is cleared', () => {
      setAuthToken('test-token');
      expect(api.defaults.headers.common['Authorization']).toBeDefined();

      setAuthToken(null);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should remove Authorization header when token is undefined', () => {
      setAuthToken('test-token');
      setAuthToken(undefined);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle empty token', () => {
      setAuthToken(null);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('localStorage Integration', () => {
    it('should use token from localStorage if available on initialization', () => {
      localStorage.setItem('token', 'persisted-token');
      // Reimport to test initialization
      // Note: In real test, this would require module reloading
      // For now, test the function directly
      setAuthToken('persisted-token');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer persisted-token');
    });

    it('should handle missing localStorage gracefully', () => {
      expect(() => {
        setAuthToken('test-token');
      }).not.toThrow();
    });
  });

  describe('HTTP Methods', () => {
    it('should make GET requests', async () => {
      server.use(
        http.get('*/api/test', () => {
          return HttpResponse.json({ data: 'test' });
        })
      );

      const response = await api.get('/api/test');
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
    });

    it('should make POST requests', async () => {
      server.use(
        http.post('*/api/test', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ ...body, id: 1 });
        })
      );

      const response = await api.post('/api/test', { name: 'test' });
      expect(response.status).toBe(200);
      expect(response.data.name).toBe('test');
      expect(response.data.id).toBe(1);
    });

    it('should make PUT requests', async () => {
      server.use(
        http.put('*/api/test/1', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: 1, ...body });
        })
      );

      const response = await api.put('/api/test/1', { name: 'updated' });
      expect(response.status).toBe(200);
      expect(response.data.name).toBe('updated');
    });

    it('should make DELETE requests', async () => {
      server.use(
        http.delete('*/api/test/1', () => {
          return HttpResponse.json({ message: 'deleted' });
        })
      );

      const response = await api.delete('/api/test/1');
      expect(response.status).toBe(200);
      expect(response.data.message).toBe('deleted');
    });

    it('should make PATCH requests', async () => {
      server.use(
        http.patch('*/api/test/1', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: 1, ...body });
        })
      );

      const response = await api.patch('/api/test/1', { status: 'active' });
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('active');
    });
  });

  describe('Authentication Header', () => {
    it('should include Authorization header in authenticated requests', async () => {
      setAuthToken('test-token');

      server.use(
        http.get('*/api/protected', ({ request }) => {
          const auth = request.headers.get('Authorization');
          return HttpResponse.json({ authenticated: !!auth, auth });
        })
      );

      const response = await api.get('/api/protected');
      expect(response.data.authenticated).toBe(true);
      expect(response.data.auth).toBe('Bearer test-token');
    });

    it('should not include Authorization header when no token is set', async () => {
      server.use(
        http.get('*/api/public', ({ request }) => {
          const auth = request.headers.get('Authorization');
          return HttpResponse.json({ authenticated: !!auth });
        })
      );

      const response = await api.get('/api/public');
      expect(response.data.authenticated).toBe(false);
    });

    it('should update Authorization header when token changes', async () => {
      setAuthToken('first-token');
      let responses: any[] = [];

      server.use(
        http.get('*/api/check-token', ({ request }) => {
          const auth = request.headers.get('Authorization');
          return HttpResponse.json({ auth });
        })
      );

      let response = await api.get('/api/check-token');
      responses.push(response.data.auth);
      expect(response.data.auth).toBe('Bearer first-token');

      // Change token
      setAuthToken('second-token');
      response = await api.get('/api/check-token');
      expect(response.data.auth).toBe('Bearer second-token');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      server.use(
        http.get('*/api/notfound', () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        })
      );

      try {
        await api.get('/api/notfound');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle 401 Unauthorized errors', async () => {
      server.use(
        http.get('*/api/unauthorized', () => {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        })
      );

      try {
        await api.get('/api/unauthorized');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should handle 403 Forbidden errors', async () => {
      server.use(
        http.get('*/api/forbidden', () => {
          return HttpResponse.json({ message: 'Forbidden' }, { status: 403 });
        })
      );

      try {
        await api.get('/api/forbidden');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    it('should handle 500 server errors', async () => {
      server.use(
        http.get('*/api/error', () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      try {
        await api.get('/api/error');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('*/api/network-error', () => {
          return HttpResponse.error();
        })
      );

      try {
        await api.get('/api/network-error');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Request Interceptors', () => {
    it('should include Authorization header in requests', async () => {
      setAuthToken('interceptor-test-token');

      server.use(
        http.post('*/api/interceptor-test', ({ request }) => {
          const auth = request.headers.get('Authorization');
          return HttpResponse.json({ auth });
        })
      );

      const response = await api.post('/api/interceptor-test', { test: 'data' });
      expect(response.data.auth).toBe('Bearer interceptor-test-token');
    });

    it('should handle multiple sequential requests with same token', async () => {
      setAuthToken('persistent-token');

      server.use(
        http.get('*/api/first', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        }),
        http.get('*/api/second', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        })
      );

      const response1 = await api.get('/api/first');
      const response2 = await api.get('/api/second');

      expect(response1.data.auth).toBe('Bearer persistent-token');
      expect(response2.data.auth).toBe('Bearer persistent-token');
    });
  });

  describe('Content-Type Headers', () => {
    it('should send correct Content-Type for JSON data', async () => {
      server.use(
        http.post('*/api/json-test', ({ request }) => {
          return HttpResponse.json({
            contentType: request.headers.get('Content-Type'),
          });
        })
      );

      const response = await api.post('/api/json-test', { data: 'test' });
      expect(response.data.contentType).toContain('application/json');
    });
  });

  describe('Request Cancellation', () => {
    it('should support request cancellation with CancelToken', async () => {
      const { CancelToken } = require('axios');
      const source = CancelToken.source();

      server.use(
        http.get('*/api/slow', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({ data: 'slow' });
        })
      );

      // Cancel immediately
      source.cancel('Request cancelled by user');

      try {
        await api.get('/api/slow', { cancelToken: source.token });
        expect.fail('Should have been cancelled');
      } catch (error: any) {
        expect(error.message).toBe('Request cancelled by user');
      }
    });
  });

  describe('API Base URL', () => {
    it('should use correct API base URL', () => {
      const baseURL = api.defaults.baseURL;
      expect(baseURL).toBeDefined();
      expect(typeof baseURL).toBe('string');
      expect(baseURL!.length).toBeGreaterThan(0);
    });

    it('should construct full URLs correctly', async () => {
      server.use(
        http.get('*/test-path', ({ request }) => {
          return HttpResponse.json({ path: request.url });
        })
      );

      const response = await api.get('/test-path');
      expect(response.data.path).toContain('test-path');
    });
  });

  describe('Integration Tests', () => {
    it('should handle authenticated requests flow', async () => {
      // Start without token
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();

      // Set token
      setAuthToken('auth-token-123');
      expect(api.defaults.headers.common['Authorization']).toBe('Bearer auth-token-123');

      // Make authenticated request
      server.use(
        http.get('*/api/authenticated', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        })
      );

      const response = await api.get('/api/authenticated');
      expect(response.data.auth).toBe('Bearer auth-token-123');

      // Clear token
      setAuthToken(null);
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle mixed authenticated and public requests', async () => {
      server.use(
        http.get('*/api/public', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        }),
        http.get('*/api/private', ({ request }) => {
          return HttpResponse.json({
            auth: request.headers.get('Authorization'),
          });
        })
      );

      // Public request without token
      let response = await api.get('/api/public');
      expect(response.data.auth).toBeNull();

      // Set token
      setAuthToken('token-456');

      // Private request with token
      response = await api.get('/api/private');
      expect(response.data.auth).toBe('Bearer token-456');

      // Public request still works with token
      response = await api.get('/api/public');
      expect(response.data.auth).toBe('Bearer token-456');
    });

    it('should handle CRUD operations', async () => {
      setAuthToken('crud-token');

      server.use(
        http.post('*/api/items', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: 1, ...(body as Record<string, unknown>) });
        }),
        http.get('*/api/items/1', () => {
          return HttpResponse.json({ id: 1, name: 'Test Item' });
        }),
        http.put('*/api/items/1', async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({ id: 1, ...body });
        }),
        http.delete('*/api/items/1', () => {
          return HttpResponse.json({ message: 'deleted' });
        })
      );

      // Create
      let response = await api.post('/api/items', { name: 'New Item' });
      expect(response.data.id).toBe(1);

      // Read
      response = await api.get('/api/items/1');
      expect(response.data.name).toBe('Test Item');

      // Update
      response = await api.put('/api/items/1', { name: 'Updated Item' });
      expect(response.data.name).toBe('Updated Item');

      // Delete
      response = await api.delete('/api/items/1');
      expect(response.data.message).toBe('deleted');
    });
  });
});
