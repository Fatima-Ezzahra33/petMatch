import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints - matches authService.ts endpoints
  http.post('*/api/login', async ({ request }) => {
    return HttpResponse.json({
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      },
      token: 'fake-token-123',
    });
  }),

  http.post('*/api/register', async ({ request }) => {
    return HttpResponse.json({
      user: {
        id: 2,
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user',
      },
      token: 'fake-token-456',
    });
  }),

  http.post('*/api/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  http.get('*/api/user', () => {
    return HttpResponse.json({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    });
  }),

  http.post('*/api/refresh', () => {
    return HttpResponse.json({
      token: 'new-fake-token-789',
    });
  }),

  http.post('*/api/forgot-password', async ({ request }) => {
    return HttpResponse.json({ message: 'Password reset link sent' });
  }),

  http.post('*/api/reset-password', async ({ request }) => {
    return HttpResponse.json({ message: 'Password reset successfully' });
  }),

  http.post('*/api/email/resend', async ({ request }) => {
    return HttpResponse.json({ message: 'Verification email sent' });
  }),

  // Pets endpoints
  http.get('*/api/pets', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Buddy',
        type: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        description: 'A friendly golden retriever',
        image: 'https://example.com/buddy.jpg',
        shelter_id: 1,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        name: 'Whiskers',
        type: 'cat',
        breed: 'Siamese',
        age: 2,
        description: 'A beautiful siamese cat',
        image: 'https://example.com/whiskers.jpg',
        shelter_id: 1,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      },
    ]);
  }),

  http.get('*/api/admin/pets', ({ request }) => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Buddy',
        type: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        description: 'A friendly golden retriever',
        image: 'https://example.com/buddy.jpg',
        shelter_id: 1,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ]);
  }),

  http.get('*/api/pets/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      name: 'Buddy',
      type: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      description: 'A friendly golden retriever',
      image: 'https://example.com/buddy.jpg',
      shelter_id: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    });
  }),

  http.post('*/api/pets', async ({ request }) => {
    return HttpResponse.json({
      id: 3,
      name: 'New Pet',
      type: 'dog',
      breed: 'Labrador',
      age: 1,
      description: 'A new pet',
      image: 'https://example.com/newpet.jpg',
      shelter_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.put('*/api/pets/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: 'Updated Pet',
      type: 'dog',
      breed: 'Labrador',
      age: 1,
      description: 'An updated pet',
      image: 'https://example.com/updated.jpg',
      shelter_id: 1,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete('*/api/pets/:id', ({ params }) => {
    return HttpResponse.json({ message: 'Pet deleted successfully' });
  }),

  // Adoption Applications endpoints
  http.get('*/api/admin/adoption-applications', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        pet_id: 1,
        status: 'pending',
        message: 'I would love to adopt this pet',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ]);
  }),

  http.put('*/api/admin/adoption-applications/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      user_id: 1,
      pet_id: 1,
      status: 'approved',
      message: 'Application approved',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    });
  }),

  // Dashboard endpoints
  http.get('*/api/admin/pets/dashboard/stats', () => {
    return HttpResponse.json({
      total_pets: 25,
      total_adoptions: 10,
      pending_applications: 5,
      by_species: [
        { type: 'dog', count: 15 },
        { type: 'cat', count: 10 },
      ],
      by_gender: [
        { gender: 'male', count: 12 },
        { gender: 'female', count: 13 },
      ],
    });
  }),

  http.get('*/api/admin/pets/dashboard/activity', () => {
    return HttpResponse.json([
      {
        id: 1,
        action: 'Pet created',
        pet_id: 1,
        created_at: '2024-01-15T10:00:00Z',
      },
    ]);
  }),

  // Pet matching endpoint
  http.post('*/api/pets/match', async ({ request }) => {
    return HttpResponse.json({
      matched_pets: [
        {
          id: 1,
          name: 'Buddy',
          type: 'dog',
          breed: 'Golden Retriever',
          age: 3,
          description: 'A friendly golden retriever',
          image: 'https://example.com/buddy.jpg',
          shelter_id: 1,
          match_score: 95,
        },
      ],
    });
  }),

  // Favorites endpoints
  http.get('*/api/favorites', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        pet_id: 1,
        created_at: '2024-01-15T10:00:00Z',
      },
    ]);
  }),

  http.post('*/api/pets/:petId/favorites', ({ params }) => {
    return HttpResponse.json({
      message: 'Pet added to favorites',
      favorite: {
        id: 2,
        user_id: 1,
        pet_id: Number(params.petId),
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.delete('*/api/pets/:petId/favorites', ({ params }) => {
    return HttpResponse.json({ message: 'Pet removed from favorites' });
  }),

  // Adoption Applications endpoints
  http.get('*/api/adoption-applications', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        pet_id: 1,
        status: 'pending',
        message: 'I would love to adopt this pet',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ]);
  }),

  http.get('*/api/adoption-applications/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      user_id: 1,
      pet_id: 1,
      status: 'pending',
      message: 'I would love to adopt this pet',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    });
  }),

  http.post('*/api/adoption-applications', async ({ request }) => {
    return HttpResponse.json({
      id: 2,
      user_id: 1,
      pet_id: 1,
      status: 'pending',
      message: 'New adoption application',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.put('*/api/adoption-applications/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      user_id: 1,
      pet_id: 1,
      status: 'approved',
      message: 'Application approved',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete('*/api/adoption-applications/:id', ({ params }) => {
    return HttpResponse.json({ message: 'Application deleted successfully' });
  }),
];
