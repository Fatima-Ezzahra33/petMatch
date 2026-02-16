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

  http.get('*/api/me', () => {
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

  // Favorites endpoints
  http.get('*/api/favorites', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        pet_id: 1,
        created_at: '2024-01-20T10:00:00Z',
      },
    ]);
  }),

  http.post('*/api/pets/:petId/favorites', ({ params }) => {
    return HttpResponse.json({
      message: 'Pet added to favorites',
      favorite: {
        id: 5,
        user_id: 1,
        pet_id: Number(params.petId),
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  http.delete('*/api/pets/:petId/favorites', ({ params }) => {
    return HttpResponse.json({ message: 'Pet removed from favorites' });
  }),

  // Adoption application endpoints
  http.get('*/api/adoptions', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 1,
        pet_id: 1,
        status: 'pending',
        created_at: '2024-01-20T10:00:00Z',
      },
      {
        id: 2,
        user_id: 1,
        pet_id: 3,
        status: 'approved',
        created_at: '2024-01-18T10:00:00Z',
      },
    ]);
  }),

  http.post('*/api/pets/:petId/apply', async ({ params, request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: 10,
      user_id: 1,
      pet_id: Number(params.petId),
      status: 'pending',
      form_data: body.form_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Pet matching endpoint - AI-powered pet matching
  http.post('*/api/match-pets', async ({ request }) => {
    return HttpResponse.json({
      pets: [
        {
          id: 1,
          name: 'Buddy',
          species: 'dog',
          type: 'dog',
          breed: 'Golden Retriever',
          age: 3,
          gender: 'male',
          description: 'A friendly golden retriever',
          profile_picture: 'https://example.com/buddy.jpg',
          status: 'available',
          shelter_id: 1,
          relevance_score: 95,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 3,
          name: 'Luna',
          species: 'dog',
          type: 'dog',
          breed: 'Labrador',
          age: 4,
          gender: 'female',
          description: 'A loyal and gentle Labrador',
          profile_picture: 'https://example.com/luna.jpg',
          status: 'available',
          shelter_id: 1,
          relevance_score: 87,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 5,
          name: 'Max',
          species: 'dog',
          type: 'dog',
          breed: 'German Shepherd',
          age: 5,
          gender: 'male',
          description: 'An intelligent and protective German Shepherd',
          profile_picture: 'https://example.com/max.jpg',
          status: 'available',
          shelter_id: 1,
          relevance_score: 78,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
      ],
      total: 3,
      message: 'Found 3 great matches for you!',
    });
  }),

  // =====================
  // Admin Endpoints
  // =====================

  // Admin: Get shelter's pet list
  http.get('*/api/admin/pets', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Buddy',
        species: 'dog',
        type: 'Golden Retriever',
        age: 3,
        gender: 'male',
        profile_picture: 'https://example.com/buddy.jpg',
        status: 'available',
        description: 'A friendly golden retriever',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        name: 'Whiskers',
        species: 'cat',
        type: 'Siamese',
        age: 2,
        gender: 'female',
        profile_picture: 'https://example.com/whiskers.jpg',
        status: 'available',
        description: 'A beautiful Siamese cat',
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      },
    ]);
  }),

  // Admin: Create new pet
  http.post('*/api/admin/pets', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        id: 3,
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // Admin: Update pet
  http.put('*/api/admin/pets/:id', async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: Number((request.url.match(/\/(\d+)$/) || [, '1'])[1]),
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  // Admin: Delete pet
  http.delete('*/api/admin/pets/:id', () => {
    return HttpResponse.json({ message: 'Pet deleted successfully' });
  }),

  // Admin: Get dashboard statistics
  http.get('*/api/admin/pets/dashboard/stats', () => {
    return HttpResponse.json({
      total: 25,
      available: 15,
      adopted: 8,
      pending: 2,
      by_species: [
        { species: 'dog', count: 15 },
        { species: 'cat', count: 10 },
      ],
      by_gender: [
        { gender: 'male', count: 12 },
        { gender: 'female', count: 13 },
      ],
      recent_additions: 3,
      recent_adoptions: 2,
    });
  }),

  // Admin: Get dashboard activity
  http.get('*/api/admin/pets/dashboard/activity', () => {
    return HttpResponse.json({
      recent_additions: [
        {
          id: 1,
          name: 'Max',
          species: 'dog',
          age: 2,
          gender: 'male',
          profile_picture: 'https://example.com/max.jpg',
          type: 'Labrador',
          status: 'available',
          description: 'A new addition',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 2,
          name: 'Mittens',
          species: 'cat',
          age: 1,
          gender: 'female',
          profile_picture: 'https://example.com/mittens.jpg',
          type: 'Persian',
          status: 'available',
          description: 'Newly added cat',
          created_at: '2024-01-19T10:00:00Z',
          updated_at: '2024-01-19T10:00:00Z',
        },
      ],
      recent_adoptions: [
        {
          id: 3,
          name: 'Lucky',
          species: 'dog',
          age: 4,
          gender: 'male',
          profile_picture: 'https://example.com/lucky.jpg',
          type: 'Beagle',
          status: 'adopted',
          description: 'Recently adopted',
          created_at: '2024-01-18T10:00:00Z',
          updated_at: '2024-01-18T10:00:00Z',
        },
      ],
    });
  }),

  // Admin: Get adoption applications
  http.get('*/api/admin/adoption-applications', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 2,
        pet_id: 1,
        status: 'pending',
        form_data: { name: 'John Doe', email: 'john@example.com' },
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        user: {
          id: 2,
          name: 'John Doe',
          email: 'john@example.com',
        },
        pet: {
          id: 1,
          name: 'Buddy',
          species: 'dog',
        },
      },
      {
        id: 2,
        user_id: 3,
        pet_id: 2,
        status: 'pending',
        form_data: { name: 'Jane Smith', email: 'jane@example.com' },
        created_at: '2024-01-18T10:00:00Z',
        updated_at: '2024-01-18T10:00:00Z',
        user: {
          id: 3,
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        pet: {
          id: 2,
          name: 'Whiskers',
          species: 'cat',
        },
      },
    ]);
  }),

  // Admin: Update adoption application status
  http.put('*/api/admin/adoption-applications/:id', async ({ request }) => {
    const body = (await request.json()) as any;
    const id = Number((request.url.match(/\/(\d+)$/) || [, '1'])[1]);

    return HttpResponse.json({
      id,
      user_id: 2,
      pet_id: 1,
      status: body.status,
      form_data: { name: 'John Doe', email: 'john@example.com' },
      created_at: '2024-01-20T10:00:00Z',
      updated_at: new Date().toISOString(),
      user: { id: 2, name: 'John Doe', email: 'john@example.com' },
      pet: { id: 1, name: 'Buddy', species: 'dog' },
    });
  }),
];
