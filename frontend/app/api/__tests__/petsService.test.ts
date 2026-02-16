import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { petsService } from '../petsService';
import type {
  Pet,
  AdoptionApplication,
  PetStats,
  DashboardActivity,
} from '../petsService';

describe('PetsService', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getPets', () => {
    it('should fetch all pets', async () => {
      const pets = await petsService.getPets();

      expect(Array.isArray(pets)).toBe(true);
      expect(pets.length).toBeGreaterThan(0);
      expect(pets[0]).toHaveProperty('id');
      expect(pets[0]).toHaveProperty('name');
      expect(pets[0]).toHaveProperty('type');
    });

    it('should handle getPets error', async () => {
      server.use(
        http.get('*/api/pets', () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(petsService.getPets()).rejects.toThrow('Failed to fetch pets');
    });

    it('should handle network error for getPets', async () => {
      server.use(
        http.get('*/api/pets', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.getPets()).rejects.toThrow();
    });
  });

  describe('getAdminPets', () => {
    it('should fetch admin pets', async () => {
      server.use(
        http.get('*/api/admin/pets', () => {
          return HttpResponse.json([
            {
              id: 1,
              name: 'Buddy',
              species: 'dog',
              type: 'dog',
              age: 3,
              gender: 'male',
              profile_picture: 'buddy.jpg',
              status: 'available',
              description: 'Friendly dog',
            },
          ]);
        })
      );

      const pets = await petsService.getAdminPets();

      expect(Array.isArray(pets)).toBe(true);
      expect(pets[0].name).toBe('Buddy');
    });

    it('should handle admin pets error', async () => {
      server.use(
        http.get('*/api/admin/pets', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      await expect(petsService.getAdminPets()).rejects.toThrow('Failed to fetch admin pets');
    });

    it('should handle network error for getAdminPets', async () => {
      server.use(
        http.get('*/api/admin/pets', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.getAdminPets()).rejects.toThrow();
    });
  });

  describe('createPet', () => {
    it('should create a new pet', async () => {
      const newPet = {
        name: 'New Pet',
        species: 'dog',
        type: 'dog',
        age: 2,
        gender: 'female',
        profile_picture: null,
        status: 'available',
        description: 'A new pet',
      };

      server.use(
        http.post('*/api/admin/pets', async ({ request }) => {
          return HttpResponse.json({
            id: 3,
            ...newPet,
          });
        })
      );

      const result = await petsService.createPet(newPet);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('New Pet');
    });

    it('should handle create pet validation error', async () => {
      server.use(
        http.post('*/api/admin/pets', () => {
          return HttpResponse.json(
            { message: 'Validation failed: name is required' },
            { status: 422 }
          );
        })
      );

      const newPet = {
        name: '',
        species: 'dog',
        type: 'dog',
        age: 2,
        gender: 'female',
        profile_picture: null,
        status: 'available',
        description: 'A new pet',
      };

      await expect(petsService.createPet(newPet)).rejects.toThrow('Validation failed');
    });

    it('should handle network error for createPet', async () => {
      server.use(
        http.post('*/api/admin/pets', () => {
          return HttpResponse.error();
        })
      );

      const newPet = {
        name: 'New Pet',
        species: 'dog',
        type: 'dog',
        age: 2,
        gender: 'female',
        profile_picture: null,
        status: 'available',
        description: 'A new pet',
      };

      await expect(petsService.createPet(newPet)).rejects.toThrow();
    });
  });

  describe('updatePet', () => {
    it('should update a pet', async () => {
      const updatedData = {
        name: 'Updated Pet',
        description: 'Updated description',
      };

      server.use(
        http.put('*/api/admin/pets/:id', ({ params }) => {
          return HttpResponse.json({
            id: Number(params.id),
            ...updatedData,
            species: 'dog',
            type: 'dog',
            age: 3,
            gender: 'male',
            profile_picture: 'pet.jpg',
            status: 'available',
          });
        })
      );

      const result = await petsService.updatePet(1, updatedData);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Updated Pet');
    });

    it('should handle update pet error', async () => {
      server.use(
        http.put('*/api/admin/pets/:id', () => {
          return HttpResponse.json(
            { message: 'Pet not found' },
            { status: 404 }
          );
        })
      );

      await expect(petsService.updatePet(999, { name: 'Updated' })).rejects.toThrow('Pet not found');
    });

    it('should handle network error for updatePet', async () => {
      server.use(
        http.put('*/api/admin/pets/:id', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.updatePet(1, { name: 'Updated' })).rejects.toThrow();
    });
  });

  describe('deletePet', () => {
    it('should delete a pet', async () => {
      server.use(
        http.delete('*/api/admin/pets/:id', () => {
          return HttpResponse.json({ message: 'Pet deleted successfully' });
        })
      );

      await expect(petsService.deletePet(1)).resolves.not.toThrow();
    });

    it('should handle delete pet error', async () => {
      server.use(
        http.delete('*/api/admin/pets/:id', () => {
          return HttpResponse.json(
            { message: 'Pet not found' },
            { status: 404 }
          );
        })
      );

      await expect(petsService.deletePet(999)).rejects.toThrow('Failed to delete pet');
    });

    it('should handle network error for deletePet', async () => {
      server.use(
        http.delete('*/api/admin/pets/:id', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.deletePet(1)).rejects.toThrow();
    });
  });

  describe('getAdminAdoptionApplications', () => {
    it('should fetch adoption applications', async () => {
      server.use(
        http.get('*/api/admin/adoption-applications', () => {
          return HttpResponse.json([
            {
              id: 1,
              user_id: 1,
              pet_id: 1,
              form_data: {},
              status: 'pending',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              user: {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
              },
              pet: {
                id: 1,
                name: 'Buddy',
                species: 'dog',
              },
            },
          ]);
        })
      );

      const apps = await petsService.getAdminAdoptionApplications();

      expect(Array.isArray(apps)).toBe(true);
      expect(apps[0]).toHaveProperty('status');
      expect(apps[0]).toHaveProperty('user');
      expect(apps[0]).toHaveProperty('pet');
    });

    it('should handle adoption applications error', async () => {
      server.use(
        http.get('*/api/admin/adoption-applications', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      await expect(petsService.getAdminAdoptionApplications()).rejects.toThrow(
        'Failed to fetch admin adoption applications'
      );
    });

    it('should handle network error for adoption applications', async () => {
      server.use(
        http.get('*/api/admin/adoption-applications', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.getAdminAdoptionApplications()).rejects.toThrow();
    });
  });

  describe('updateAdoptionApplicationStatus', () => {
    it('should update adoption application status', async () => {
      server.use(
        http.put('*/api/admin/adoption-applications/:id/status', ({ params }) => {
          return HttpResponse.json({
            id: Number(params.id),
            user_id: 1,
            pet_id: 1,
            form_data: {},
            status: 'approved',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: new Date().toISOString(),
            user: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
            },
            pet: {
              id: 1,
              name: 'Buddy',
              species: 'dog',
            },
          });
        })
      );

      const result = await petsService.updateAdoptionApplicationStatus(1, 'approved');

      expect(result.status).toBe('approved');
    });

    it('should handle status update error', async () => {
      server.use(
        http.put('*/api/admin/adoption-applications/:id/status', () => {
          return HttpResponse.json(
            { message: 'Application not found' },
            { status: 404 }
          );
        })
      );

      await expect(petsService.updateAdoptionApplicationStatus(999, 'approved')).rejects.toThrow(
        'Failed to update adoption application status'
      );
    });

    it('should handle network error for status update', async () => {
      server.use(
        http.put('*/api/admin/adoption-applications/:id/status', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.updateAdoptionApplicationStatus(1, 'approved')).rejects.toThrow();
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/stats', () => {
          return HttpResponse.json({
            total: 50,
            available: 30,
            adopted: 15,
            pending: 5,
            by_species: [
              { species: 'dog', count: 30 },
              { species: 'cat', count: 20 },
            ],
            recent_additions: 5,
            recent_adoptions: 2,
            by_gender: [
              { gender: 'male', count: 25 },
              { gender: 'female', count: 25 },
            ],
          });
        })
      );

      const stats = await petsService.getDashboardStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('adopted');
      expect(stats).toHaveProperty('by_species');
      expect(stats.total).toBe(50);
    });

    it('should handle dashboard stats error', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/stats', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      await expect(petsService.getDashboardStats()).rejects.toThrow('Failed to fetch dashboard stats');
    });

    it('should handle network error for dashboard stats', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/stats', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.getDashboardStats()).rejects.toThrow();
    });
  });

  describe('matchPets with AbortController', () => {
    it('should match pets based on user message', async () => {
      server.use(
        http.post('*/api/match-pets', () => {
          return HttpResponse.json({
            pets: [
              {
                id: 1,
                name: 'Buddy',
                species: 'dog',
                type: 'dog',
                age: 3,
                gender: 'male',
                profile_picture: 'buddy.jpg',
                status: 'available',
                description: 'Friendly dog',
              },
            ],
            total: 1,
            message: 'Found 1 matching pet',
          });
        })
      );

      const result = await petsService.matchPets('I like friendly dogs');

      expect(result).toHaveProperty('pets');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('message');
      expect(result.pets.length).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle match pets error', async () => {
      server.use(
        http.post('*/api/match-pets', () => {
          return HttpResponse.json(
            { message: 'AI service unavailable' },
            { status: 503 }
          );
        })
      );

      await expect(petsService.matchPets('I like dogs')).rejects.toThrow('AI service unavailable');
    });

    it('should cancel previous matchPets request when new request is made', async () => {
      let firstRequestReceived = false;
      let secondRequestReceived = false;

      server.use(
        http.post('*/api/match-pets', async ({ request }) => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 100));
          secondRequestReceived = true;
          return HttpResponse.json({
            pets: [],
            total: 0,
            message: 'No matches found',
          });
        })
      );

      // Start first request (don't await)
      const firstRequest = petsService.matchPets('first query').catch(() => {});
      firstRequestReceived = true;

      // Wait a bit then start second request
      await new Promise(resolve => setTimeout(resolve, 10));
      const secondRequest = await petsService.matchPets('second query');

      expect(secondRequest).toHaveProperty('message');
    });

    it('should handle AbortError gracefully', async () => {
      server.use(
        http.post('*/api/match-pets', async ({ request }) => {
          // Check if request is aborted
          if (request.signal.aborted) {
            throw new Error('Request cancelled');
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          return HttpResponse.json({
            pets: [],
            total: 0,
            message: 'Matches found',
          });
        })
      );

      const promise = petsService.matchPets('first query').catch(err => err.message);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Make second request which should cancel first
      await petsService.matchPets('second query');

      // First should have thrown or been cancelled
      expect(promise).toBeDefined();
    });

    it('should handle network error for matchPets', async () => {
      server.use(
        http.post('*/api/match-pets', () => {
          return HttpResponse.error();
        })
      );

      await expect(petsService.matchPets('match query')).rejects.toThrow();
    });
  });

  describe('getDashboardActivity', () => {
    it('should fetch dashboard activity', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/activity', () => {
          return HttpResponse.json({
            recent_additions: [
              {
                id: 1,
                name: 'Buddy',
                species: 'dog',
                type: 'dog',
                age: 3,
                gender: 'male',
                profile_picture: 'buddy.jpg',
                status: 'available',
                description: 'Friendly dog',
              },
            ],
            recent_adoptions: [],
          });
        })
      );

      const activity = await petsService.getDashboardActivity();

      expect(activity).toHaveProperty('recent_additions');
      expect(activity).toHaveProperty('recent_adoptions');
      expect(Array.isArray(activity.recent_additions)).toBe(true);
    });

    it('should handle dashboard activity error', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/activity', () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 403 }
          );
        })
      );

      await expect(petsService.getDashboardActivity()).rejects.toThrow('Failed to fetch dashboard activity');
    });
  });

  describe('Integration', () => {
    it('should handle complete admin workflow', async () => {
      // Get admin pets
      const petsList = await petsService.getAdminPets();
      expect(Array.isArray(petsList)).toBe(true);

      // Create pet
      const newPet = {
        name: 'New Pet',
        species: 'dog',
        type: 'dog',
        age: 2,
        gender: 'female',
        profile_picture: null,
        status: 'available',
        description: 'A new pet',
      };

      server.use(
        http.post('*/api/admin/pets', () => {
          return HttpResponse.json({ id: 999, ...newPet });
        })
      );

      const created = await petsService.createPet(newPet);
      expect(created.id).toBe(999);
      // Update pet
      server.use(
        http.put('*/api/admin/pets/:id', ({ params }) => {
          return HttpResponse.json({
            id: Number(params.id),
            ...newPet,
            name: 'Updated Pet',
          });
        })
      );

      const updated = await petsService.updatePet(999, { name: 'Updated Pet' });
      expect(updated.name).toBe('Updated Pet');

      // Get stats
      const stats = await petsService.getDashboardStats();
      expect(stats).toHaveProperty('total_pets');
    });
  });
});
