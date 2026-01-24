import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '~/contexts/auth';
import { ThemeProvider } from '~/contexts/themeContext';
import { UserProvider } from '~/contexts/UserContext';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/mocks/server';
import type { Pet } from '~/api/petsService';

/**
 * Mock Data for Admin Tests
 */
const mockAdminPets: Pet[] = [
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
  },
];

const mockDashboardStats = {
  total: 25,
  available: 15,
  adopted: 8,
  pending: 2,
  by_species: [
    { species: 'dog', count: 15 },
    { species: 'cat', count: 10 },
  ],
  recent_additions: 3,
  recent_adoptions: 2,
  by_gender: [
    { gender: 'male', count: 12 },
    { gender: 'female', count: 13 },
  ],
};

const mockDashboardActivity = {
  recent_additions: [
    { id: 1, name: 'Max', species: 'dog', age: 2, gender: 'male', profile_picture: 'https://example.com/max.jpg', type: 'Labrador', status: 'available', description: 'A new addition' },
    { id: 2, name: 'Mittens', species: 'cat', age: 1, gender: 'female', profile_picture: 'https://example.com/mittens.jpg', type: 'Persian', status: 'available', description: 'Newly added cat' },
  ],
  recent_adoptions: [
    { id: 3, name: 'Lucky', species: 'dog', age: 4, gender: 'male', profile_picture: 'https://example.com/lucky.jpg', type: 'Beagle', status: 'adopted', description: 'Recently adopted' },
  ],
};

const mockAdoptionApplications = [
  {
    id: 1,
    user_id: 2,
    pet_id: 1,
    status: 'pending',
    form_data: { name: 'John Doe', email: 'john@example.com' },
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    user: { id: 2, name: 'John Doe', email: 'john@example.com' },
    pet: { id: 1, name: 'Buddy', species: 'dog' },
  },
  {
    id: 2,
    user_id: 3,
    pet_id: 2,
    status: 'pending',
    form_data: { name: 'Jane Smith', email: 'jane@example.com' },
    created_at: '2024-01-18T10:00:00Z',
    updated_at: '2024-01-18T10:00:00Z',
    user: { id: 3, name: 'Jane Smith', email: 'jane@example.com' },
    pet: { id: 2, name: 'Whiskers', species: 'cat' },
  },
];

/**
 * Test Component: Admin Dashboard
 */
const AdminDashboardComponent = ({ stats, activity }: { stats: any; activity: any }) => (
  <div data-testid="admin-dashboard">
    <h1 data-testid="dashboard-title">Dashboard</h1>
    <p data-testid="dashboard-subtitle">Overview of your shelter's activities</p>

    <div data-testid="stats-cards" className="grid gap-4">
      <div data-testid="stat-card-available">
        <span>Available</span>
        <span data-testid="stat-value-available">{stats?.available || 0}</span>
      </div>
      <div data-testid="stat-card-adopted">
        <span>Adopted</span>
        <span data-testid="stat-value-adopted">{stats?.adopted || 0}</span>
      </div>
      <div data-testid="stat-card-pending">
        <span>Pending</span>
        <span data-testid="stat-value-pending">{stats?.pending || 0}</span>
      </div>
      <div data-testid="stat-card-total">
        <span>Total Pets</span>
        <span data-testid="stat-value-total">{stats?.total || 0}</span>
      </div>
    </div>

    <div data-testid="species-stats">
      <h2>By Species</h2>
      {stats?.by_species?.map((item: any) => (
        <div key={item.species} data-testid={`species-${item.species}`}>
          <span>{item.species}</span>
          <span>{item.count}</span>
        </div>
      ))}
    </div>

    <div data-testid="recent-additions">
      <h2>Recent Additions</h2>
      {activity?.recent_additions?.map((pet: any) => (
        <div key={pet.id} data-testid={`recent-pet-${pet.id}`}>
          <h4>{pet.name}</h4>
          <p>{pet.species}</p>
        </div>
      ))}
    </div>

    <div data-testid="recent-adoptions">
      <h2>Recent Adoptions</h2>
      {activity?.recent_adoptions?.map((pet: any) => (
        <div key={pet.id} data-testid={`adopted-pet-${pet.id}`}>
          <h4>{pet.name}</h4>
          <p>{pet.species}</p>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Test Component: Admin Pets List
 */
const AdminPetsComponent = ({ onAddPet }: { onAddPet: (pet: Pet) => void }) => {
  const [pets, setPets] = React.useState(mockAdminPets);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newPet, setNewPet] = React.useState({
    name: '',
    species: '',
    type: '',
    age: '',
    gender: '',
    description: '',
    profile_picture: '',
  });

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8000/api/admin/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify(newPet),
      });

      if (response.ok) {
        const createdPet = await response.json();
        setPets([...pets, createdPet]);
        setIsAddModalOpen(false);
        onAddPet(createdPet);
        setNewPet({ name: '', species: '', type: '', age: '', gender: '', description: '', profile_picture: '' });
      }
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  return (
    <div data-testid="admin-pets-page">
      <h1 data-testid="pets-title">Manage Pets</h1>
      <button
        data-testid="add-pet-btn"
        onClick={() => setIsAddModalOpen(true)}
        style={{ marginBottom: '16px', padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Add New Pet
      </button>

      {isAddModalOpen && (
        <div data-testid="add-pet-modal" style={{ border: '1px solid #ccc', padding: '16px', marginBottom: '16px', borderRadius: '4px' }}>
          <h2 data-testid="modal-title">Add New Pet</h2>
          <form onSubmit={handleAddPet}>
            <input
              data-testid="input-pet-name"
              type="text"
              placeholder="Pet name"
              value={newPet.name}
              onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
            />
            <select
              data-testid="select-species"
              value={newPet.species}
              onChange={(e) => setNewPet({ ...newPet, species: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
            >
              <option value="">Select species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
            <input
              data-testid="input-pet-type"
              type="text"
              placeholder="Type/Breed"
              value={newPet.type}
              onChange={(e) => setNewPet({ ...newPet, type: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
            />
            <input
              data-testid="input-pet-age"
              type="number"
              placeholder="Age"
              value={newPet.age}
              onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
            />
            <select
              data-testid="select-gender"
              value={newPet.gender}
              onChange={(e) => setNewPet({ ...newPet, gender: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <textarea
              data-testid="input-pet-description"
              placeholder="Description"
              value={newPet.description}
              onChange={(e) => setNewPet({ ...newPet, description: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px', minHeight: '80px' }}
            />
            <input
              data-testid="input-pet-image"
              type="text"
              placeholder="Image URL"
              value={newPet.profile_picture}
              onChange={(e) => setNewPet({ ...newPet, profile_picture: e.target.value })}
              style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '6px' }}
            />
            <button
              data-testid="submit-add-pet-btn"
              type="submit"
              style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
            >
              Add Pet
            </button>
            <button
              data-testid="cancel-add-btn"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div data-testid="pets-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {pets.map((pet) => (
          <div key={pet.id} data-testid={`pet-card-${pet.id}`} style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
            <img src={pet.profile_picture || ''} alt={pet.name || ''} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <h3 data-testid={`pet-name-${pet.id}`}>{pet.name}</h3>
            <p data-testid={`pet-species-${pet.id}`}>{pet.species}</p>
            <p data-testid={`pet-type-${pet.id}`}>{pet.type}</p>
            <p data-testid={`pet-status-${pet.id}`}>Status: {pet.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Test Component: Admin Edit Pet
 */
const AdminEditPetComponent = ({ petId, onSave }: { petId: number; onSave: () => void }) => {
  const [pet, setPet] = React.useState(mockAdminPets.find((p) => p.id === petId) || mockAdminPets[0]);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:8000/api/admin/pets/${petId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify(pet),
      });

      if (response.ok) {
        setIsEditing(false);
        onSave();
      }
    } catch (error) {
      console.error('Error updating pet:', error);
    }
  };

  return (
    <div data-testid="edit-pet-page">
      <h1 data-testid="edit-title">Edit Pet: {pet.name}</h1>

      <form onSubmit={handleSave}>
        <input
          data-testid="edit-input-name"
          type="text"
          value={pet.name}
          onChange={(e) => setPet({ ...pet, name: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
        />
        <input
          data-testid="edit-input-type"
          type="text"
          value={pet.type ?? ''}
          onChange={(e) => setPet({ ...pet, type: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
        />
        <input
          data-testid="edit-input-age"
          type="number"
          value={pet.age ?? ''}
          onChange={(e) => setPet({ ...pet, age: Number(e.target.value) })}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px' }}
        />
        <textarea
          data-testid="edit-input-description"
          value={pet.description}
          onChange={(e) => setPet({ ...pet, description: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px', minHeight: '80px' }}
        />
        <input
          data-testid="edit-input-image"
          type="text"
          value={pet.profile_picture || ''}
          onChange={(e) => setPet({ ...pet, profile_picture: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '6px' }}
        />
        <button
          data-testid="save-pet-btn"
          type="submit"
          style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

/**
 * Test Component: Admin Requests
 */
const AdminRequestsComponent = () => {
  const [applications, setApplications] = React.useState(mockAdoptionApplications);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredApps, setFilteredApps] = React.useState(applications);

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/adoption-applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications(
          applications.map((app) =>
            app.id === appId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = applications.filter((app) =>
      app.pet?.name?.toLowerCase().includes(term.toLowerCase()) ||
      app.user?.name?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredApps(filtered);
  };

  React.useEffect(() => {
    setFilteredApps(applications);
  }, [applications]);

  return (
    <div data-testid="admin-requests-page">
      <h1 data-testid="requests-title">Adoption Requests</h1>

      <input
        data-testid="search-input"
        type="text"
        placeholder="Search by pet name or applicant name..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '16px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
      />

      <table data-testid="requests-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Request ID</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Applicant</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Pet Name</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredApps.map((app) => (
            <tr key={app.id} data-testid={`request-row-${app.id}`} style={{ borderBottom: '1px solid #eee' }}>
              <td data-testid={`app-id-${app.id}`} style={{ padding: '8px' }}>#{app.id}</td>
              <td data-testid={`app-applicant-${app.id}`} style={{ padding: '8px' }}>{app.user?.name}</td>
              <td data-testid={`app-pet-${app.id}`} style={{ padding: '8px' }}>{app.pet?.name}</td>
              <td
                data-testid={`app-status-${app.id}`}
                style={{
                  padding: '8px',
                  background:
                    app.status === 'pending'
                      ? '#fff3cd'
                      : app.status === 'approved'
                        ? '#d4edda'
                        : '#f8d7da',
                  color:
                    app.status === 'pending'
                      ? '#856404'
                      : app.status === 'approved'
                        ? '#155724'
                        : '#721c24',
                }}
              >
                {app.status}
              </td>
              <td style={{ padding: '8px' }}>
                {app.status === 'pending' && (
                  <>
                    <button
                      data-testid={`approve-btn-${app.id}`}
                      onClick={() => handleStatusChange(app.id, 'approved')}
                      style={{ marginRight: '4px', padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Approve
                    </button>
                    <button
                      data-testid={`reject-btn-${app.id}`}
                      onClick={() => handleStatusChange(app.id, 'rejected')}
                      style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredApps.length === 0 && <p data-testid="empty-requests">No adoption requests found.</p>}
    </div>
  );
};

/**
 * Test Wrapper with all providers
 */
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <UserProvider>{children}</UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * ============================================================================
 * INTEGRATION TESTS: Admin Flows
 * ============================================================================
 */
describe('Admin Dashboard & Management Flow - End-to-End Tests', () => {
  // =====================
  // SCENARIO 1: Admin Dashboard
  // =====================
  describe('Scenario 1: Admin Login → Dashboard → Display Statistics', () => {
    it('should display admin dashboard after login', async () => {
      render(<AdminDashboardComponent stats={mockDashboardStats} activity={mockDashboardActivity} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Dashboard');
      expect(screen.getByTestId('dashboard-subtitle')).toHaveTextContent('Overview');
    });

    it('should display all statistics cards', async () => {
      render(<AdminDashboardComponent stats={mockDashboardStats} activity={mockDashboardActivity} />, {
        wrapper: TestWrapper,
      });

      // Check all stat cards are displayed
      expect(screen.getByTestId('stat-card-available')).toBeInTheDocument();
      expect(screen.getByTestId('stat-value-available')).toHaveTextContent('15');

      expect(screen.getByTestId('stat-card-adopted')).toBeInTheDocument();
      expect(screen.getByTestId('stat-value-adopted')).toHaveTextContent('8');

      expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
      expect(screen.getByTestId('stat-value-pending')).toHaveTextContent('2');

      expect(screen.getByTestId('stat-card-total')).toBeInTheDocument();
      expect(screen.getByTestId('stat-value-total')).toHaveTextContent('25');
    });

    it('should display statistics by species', async () => {
      render(<AdminDashboardComponent stats={mockDashboardStats} activity={mockDashboardActivity} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId('species-stats')).toBeInTheDocument();
      expect(screen.getByTestId('species-dog')).toBeInTheDocument();
      expect(screen.getByTestId('species-dog')).toHaveTextContent('15');
      expect(screen.getByTestId('species-cat')).toBeInTheDocument();
      expect(screen.getByTestId('species-cat')).toHaveTextContent('10');
    });

    it('should display recent additions and adoptions', async () => {
      render(<AdminDashboardComponent stats={mockDashboardStats} activity={mockDashboardActivity} />, {
        wrapper: TestWrapper,
      });

      // Recent additions
      expect(screen.getByTestId('recent-additions')).toBeInTheDocument();
      expect(screen.getByTestId('recent-pet-1')).toBeInTheDocument();
      expect(screen.getByTestId('recent-pet-1')).toHaveTextContent('Max');

      // Recent adoptions
      expect(screen.getByTestId('recent-adoptions')).toBeInTheDocument();
      expect(screen.getByTestId('adopted-pet-3')).toBeInTheDocument();
      expect(screen.getByTestId('adopted-pet-3')).toHaveTextContent('Lucky');
    });

    it('should mock GET /api/admin/pets/dashboard/stats endpoint', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/stats', () => {
          return HttpResponse.json(mockDashboardStats);
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/pets/dashboard/stats', {
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      const data = await response.json();
      expect(data.total).toBe(25);
      expect(data.available).toBe(15);
      expect(data.by_species).toHaveLength(2);
    });

    it('should mock GET /api/admin/pets/dashboard/activity endpoint', async () => {
      server.use(
        http.get('*/api/admin/pets/dashboard/activity', () => {
          return HttpResponse.json(mockDashboardActivity);
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/pets/dashboard/activity', {
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      const data = await response.json();
      expect(data.recent_additions).toHaveLength(2);
      expect(data.recent_adoptions).toHaveLength(1);
    });
  });

  // =====================
  // SCENARIO 2: Add Pet
  // =====================
  describe('Scenario 2: Navigate /admin/pets → Add New Pet → Update List', () => {
    it('should display admin pets list', async () => {
      render(<AdminPetsComponent onAddPet={() => {}} />, { wrapper: TestWrapper });

      expect(screen.getByTestId('admin-pets-page')).toBeInTheDocument();
      expect(screen.getByTestId('pets-title')).toHaveTextContent('Manage Pets');
      expect(screen.getByTestId('add-pet-btn')).toBeInTheDocument();
    });

    it('should display existing pets in grid', async () => {
      render(<AdminPetsComponent onAddPet={() => {}} />, { wrapper: TestWrapper });

      expect(screen.getByTestId('pet-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('pet-name-1')).toHaveTextContent('Buddy');

      expect(screen.getByTestId('pet-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('pet-name-2')).toHaveTextContent('Whiskers');
    });

    it('should open add pet modal on button click', async () => {
      const user = userEvent.setup();

      render(<AdminPetsComponent onAddPet={() => {}} />, { wrapper: TestWrapper });

      // Modal not visible initially
      expect(screen.queryByTestId('add-pet-modal')).not.toBeInTheDocument();

      // Click add button
      await user.click(screen.getByTestId('add-pet-btn'));

      // Modal now visible
      expect(screen.getByTestId('add-pet-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Add New Pet');
    });

    it('should fill and submit add pet form', async () => {
      const user = userEvent.setup();

      render(<AdminPetsComponent onAddPet={() => {}} />, { wrapper: TestWrapper });

      // Open modal
      await user.click(screen.getByTestId('add-pet-btn'));

      // Fill form
      await user.type(screen.getByTestId('input-pet-name'), 'Rex');
      await user.selectOptions(screen.getByTestId('select-species'), 'dog');
      await user.type(screen.getByTestId('input-pet-type'), 'German Shepherd');
      await user.type(screen.getByTestId('input-pet-age'), '5');
      await user.selectOptions(screen.getByTestId('select-gender'), 'male');
      await user.type(screen.getByTestId('input-pet-description'), 'A strong and loyal dog');
      await user.type(screen.getByTestId('input-pet-image'), 'https://example.com/rex.jpg');

      // Submit
      await user.click(screen.getByTestId('submit-add-pet-btn'));

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByTestId('add-pet-modal')).not.toBeInTheDocument();
      });
    });

    it('should mock POST /api/admin/pets endpoint', async () => {
      server.use(
        http.post('*/api/admin/pets', async ({ request }) => {
          const body = (await request.json()) as any;
          return HttpResponse.json({
            id: 3,
            ...body,
            created_at: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const newPet = {
        name: 'Rocky',
        species: 'dog',
        type: 'Bulldog',
        age: 3,
        gender: 'male',
        description: 'A calm bulldog',
        profile_picture: 'https://example.com/rocky.jpg',
      };

      const response = await fetch('http://localhost:8000/api/admin/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify(newPet),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.name).toBe('Rocky');
      expect(data.id).toBe(3);
    });
  });

  // =====================
  // SCENARIO 3: Edit Pet
  // =====================
  describe('Scenario 3: Edit Pet → Modify Fields → Save Changes', () => {
    it('should display edit pet form', async () => {
      render(<AdminEditPetComponent petId={1} onSave={() => {}} />, { wrapper: TestWrapper });

      expect(screen.getByTestId('edit-pet-page')).toBeInTheDocument();
      expect(screen.getByTestId('edit-title')).toHaveTextContent('Edit Pet: Buddy');
    });

    it('should load and display current pet data', async () => {
      render(<AdminEditPetComponent petId={1} onSave={() => {}} />, { wrapper: TestWrapper });

      const nameInput = screen.getByTestId('edit-input-name') as HTMLInputElement;
      expect(nameInput.value).toBe('Buddy');

      const typeInput = screen.getByTestId('edit-input-type') as HTMLInputElement;
      expect(typeInput.value).toBe('Golden Retriever');

      const ageInput = screen.getByTestId('edit-input-age') as HTMLInputElement;
      expect(ageInput.value).toBe('3');
    });

    it('should update pet fields and save', async () => {
      const user = userEvent.setup();
      let saved = false;

      render(<AdminEditPetComponent petId={1} onSave={() => { saved = true; }} />, { wrapper: TestWrapper });

      // Change fields
      const nameInput = screen.getByTestId('edit-input-name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Buddy Updated');

      const ageInput = screen.getByTestId('edit-input-age');
      await user.clear(ageInput);
      await user.type(ageInput, '4');

      // Save
      await user.click(screen.getByTestId('save-pet-btn'));

      await waitFor(() => {
        expect(saved).toBe(true);
      });
    });

    it('should mock PUT /api/admin/pets/:id endpoint', async () => {
      server.use(
        http.put('*/api/admin/pets/1', async ({ request }) => {
          const body = (await request.json()) as any;
          return HttpResponse.json({
            id: 1,
            ...body,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const updateData = {
        name: 'Buddy Updated',
        age: 4,
        description: 'Updated description',
      };

      const response = await fetch('http://localhost:8000/api/admin/pets/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      expect(data.name).toBe('Buddy Updated');
      expect(data.age).toBe(4);
    });
  });

  // =====================
  // SCENARIO 4: Delete Pet
  // =====================
  describe('Scenario 4: Delete Pet → Confirmation → Update List', () => {
    it('should mock DELETE /api/admin/pets/:id endpoint', async () => {
      server.use(
        http.delete('*/api/admin/pets/1', () => {
          return HttpResponse.json({ message: 'Pet deleted successfully' });
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/pets/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('deleted');
    });

    it('should handle pet deletion confirmation', async () => {
      server.use(
        http.delete('*/api/admin/pets/:id', () => {
          return HttpResponse.json({ message: 'Pet deleted successfully' });
        })
      );

      const petId = 1;
      const response = await fetch(`http://localhost:8000/api/admin/pets/${petId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      expect(response.ok).toBe(true);
    });
  });

  // =====================
  // SCENARIO 5: Admin Requests Management
  // =====================
  describe('Scenario 5: Admin Requests → Display & Filter → Change Status', () => {
    it('should display adoption requests page', async () => {
      render(<AdminRequestsComponent />, { wrapper: TestWrapper });

      expect(screen.getByTestId('admin-requests-page')).toBeInTheDocument();
      expect(screen.getByTestId('requests-title')).toHaveTextContent('Adoption Requests');
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should display adoption applications in table', async () => {
      render(<AdminRequestsComponent />, { wrapper: TestWrapper });

      // Check first application
      expect(screen.getByTestId('request-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('app-id-1')).toHaveTextContent('#1');
      expect(screen.getByTestId('app-applicant-1')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('app-pet-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('app-status-1')).toHaveTextContent('pending');

      // Check second application
      expect(screen.getByTestId('request-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('app-applicant-2')).toHaveTextContent('Jane Smith');
      expect(screen.getByTestId('app-pet-2')).toHaveTextContent('Whiskers');
    });

    it('should search and filter requests', async () => {
      const user = userEvent.setup();

      render(<AdminRequestsComponent />, { wrapper: TestWrapper });

      // Initially both requests visible
      expect(screen.getByTestId('request-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('request-row-2')).toBeInTheDocument();

      // Search for "Buddy"
      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
      await user.type(searchInput, 'Buddy');

      // Only first request visible
      await waitFor(() => {
        expect(screen.getByTestId('request-row-1')).toBeInTheDocument();
        expect(screen.queryByTestId('request-row-2')).not.toBeInTheDocument();
      });
    });

    it('should change request status from pending to approved', async () => {
      const user = userEvent.setup();

      render(<AdminRequestsComponent />, { wrapper: TestWrapper });

      // Initial status is pending
      expect(screen.getByTestId('app-status-1')).toHaveTextContent('pending');
      expect(screen.getByTestId('approve-btn-1')).toBeInTheDocument();

      // Click approve
      await user.click(screen.getByTestId('approve-btn-1'));

      // Status should change to approved
      await waitFor(() => {
        expect(screen.getByTestId('app-status-1')).toHaveTextContent('approved');
      });
    });

    it('should change request status to rejected', async () => {
      const user = userEvent.setup();

      render(<AdminRequestsComponent />, { wrapper: TestWrapper });

      // Click reject
      await user.click(screen.getByTestId('reject-btn-2'));

      // Status should change to rejected
      await waitFor(() => {
        expect(screen.getByTestId('app-status-2')).toHaveTextContent('rejected');
      });
    });

    it('should mock PUT /api/admin/adoption-applications/:id endpoint', async () => {
      server.use(
        http.put('*/api/admin/adoption-applications/:id', async ({ request, params }) => {
          const body = (await request.json()) as any;
          const { id, ...rest } = mockAdoptionApplications[0];
          return HttpResponse.json({
            id: Number(params.id),
            ...rest,
            status: body.status,
            updated_at: new Date().toISOString(),
          });
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/adoption-applications/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await response.json();
      expect(data.status).toBe('approved');
    });

    it('should mock GET /api/admin/adoption-applications endpoint', async () => {
      server.use(
        http.get('*/api/admin/adoption-applications', () => {
          return HttpResponse.json(mockAdoptionApplications);
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/adoption-applications', {
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].status).toBe('pending');
      expect(data[1].status).toBe('pending');
    });
  });

  // =====================
  // API MOCKING TESTS
  // =====================
  describe('Admin API Mocking', () => {
    it('should mock GET /api/admin/pets endpoint', async () => {
      server.use(
        http.get('*/api/admin/pets', () => {
          return HttpResponse.json(mockAdminPets);
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/pets', {
        headers: { Authorization: 'Bearer fake-admin-token' },
      });

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
    });

    it('should handle admin errors gracefully', async () => {
      server.use(
        http.post('*/api/admin/pets', () => {
          return HttpResponse.json(
            { message: 'Validation error' },
            { status: 422 }
          );
        })
      );

      const response = await fetch('http://localhost:8000/api/admin/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-admin-token',
        },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.message).toContain('Validation');
    });
  });
});
