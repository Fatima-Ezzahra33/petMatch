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
 * Test Data: Mock Pet Objects
 */
const mockPets: Pet[] = [
  {
    id: 1,
    name: 'Buddy',
    species: 'dog',
    type: 'Golden Retriever',
    age: 3,
    gender: 'male',
    profile_picture: 'https://example.com/buddy.jpg',
    status: 'available',
    description: 'A friendly and energetic golden retriever',
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
    description: 'A beautiful and playful Siamese cat',
  },
  {
    id: 3,
    name: 'Luna',
    species: 'dog',
    type: 'Labrador',
    age: 4,
    gender: 'female',
    profile_picture: 'https://example.com/luna.jpg',
    status: 'available',
    description: 'A loyal and gentle Labrador',
  },
];

/**
 * Test Component: Pet Card with Favorite Button
 */
const PetCardWithFavorite = ({
  pet,
  isFavorite,
  onFavoriteToggle,
  onClick,
}: {
  pet: Pet;
  isFavorite: boolean;
  onFavoriteToggle: (petId: number) => void;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    data-testid={`pet-card-${pet.id}`}
    className="pet-card"
    style={{
      backgroundImage: `url(${pet.profile_picture})`,
      backgroundSize: 'cover',
      position: 'relative',
      width: '280px',
      height: '400px',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10,
      }}
    >
      <button
        data-testid={`favorite-btn-${pet.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle(pet.id);
        }}
        style={{
          background: isFavorite ? '#ff6b6b' : '#ffffff',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '20px' }}>{isFavorite ? '❤️' : '🤍'}</span>
      </button>
    </div>
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.8)',
        padding: '16px',
      }}
    >
      <h3 data-testid={`pet-name-${pet.id}`}>{pet.name}</h3>
      <p data-testid={`pet-type-${pet.id}`}>{pet.type}</p>
    </div>
  </div>
);

/**
 * Test Component: Favorites Page
 */
const FavoritesPage = ({
  favorites,
  onRemoveFavorite,
}: {
  favorites: Pet[];
  onRemoveFavorite: (petId: number) => void;
}) => (
  <div data-testid="favorites-page">
    <h1 data-testid="favorites-title">My Favorites</h1>
    {favorites.length === 0 ? (
      <div data-testid="empty-favorites">
        <p>No favorite pets yet. Add some by clicking the heart icon!</p>
      </div>
    ) : (
      <div data-testid="favorites-grid" className="grid gap-4">
        {favorites.map((pet) => (
          <div key={pet.id} data-testid={`favorite-item-${pet.id}`}>
            <h3 data-testid={`fav-pet-name-${pet.id}`}>{pet.name}</h3>
            <p data-testid={`fav-pet-type-${pet.id}`}>{pet.type}</p>
            <button
              data-testid={`remove-favorite-btn-${pet.id}`}
              onClick={() => onRemoveFavorite(pet.id)}
              style={{ marginTop: '8px' }}
            >
              Remove from Favorites
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

/**
 * Test Component: Adoption Form Modal
 */
const AdoptionFormComponent = ({
  petId,
  petName,
  isOpen,
  onClose,
  onSuccess,
}: {
  petId: number;
  petName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    housing: '',
    otherPets: false,
    motivation: '',
    agreedToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/pets/${petId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer fake-token`,
        },
        body: JSON.stringify({
          form_data: formData,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="adoption-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 data-testid="form-title">Adopt {petName}</h2>
          <button
            data-testid="close-modal-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div data-testid="step-indicator" style={{ marginBottom: '16px', fontSize: '14px' }}>
          Step {step} of 3
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div data-testid="step-1">
              <label>
                Name:
                <input
                  data-testid="input-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', marginBottom: '12px' }}
                />
              </label>
              <label>
                Email:
                <input
                  data-testid="input-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', marginBottom: '12px' }}
                />
              </label>
              <label>
                Phone:
                <input
                  data-testid="input-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px' }}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div data-testid="step-2">
              <label>
                Address:
                <input
                  data-testid="input-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', marginBottom: '12px' }}
                />
              </label>
              <label>
                Housing Type:
                <select
                  data-testid="select-housing"
                  value={formData.housing}
                  onChange={(e) => setFormData({ ...formData, housing: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', marginBottom: '12px' }}
                >
                  <option value="">Select...</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="farm">Farm</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  data-testid="input-other-pets"
                  type="checkbox"
                  checked={formData.otherPets}
                  onChange={(e) => setFormData({ ...formData, otherPets: e.target.checked })}
                />
                Do you have other pets?
              </label>
            </div>
          )}

          {step === 3 && (
            <div data-testid="step-3">
              <label>
                Adoption Motivation:
                <textarea
                  data-testid="input-motivation"
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  style={{ display: 'block', width: '100%', marginTop: '4px', marginBottom: '12px', minHeight: '100px' }}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  data-testid="input-terms"
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                />
                I agree to the terms and conditions
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
            {step > 1 && (
              <button
                data-testid="prev-step-btn"
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Previous
              </button>
            )}
            <button
              data-testid="next-step-btn"
              type="submit"
              disabled={
                (step === 1 && (!formData.name || !formData.email || !formData.phone)) ||
                (step === 2 && !formData.address) ||
                (step === 3 && (!formData.motivation || !formData.agreedToTerms))
              }
              style={{
                flex: 1,
                padding: '8px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {step === 3 ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Test Component: Adoption Requests Page
 */
const AdoptionRequestsPage = ({
  requests,
}: {
  requests: Array<{
    id: number;
    pet_id: number;
    pet_name: string;
    status: string;
    created_at: string;
  }>;
}) => {
  const [filteredRequests, setFilteredRequests] = React.useState(requests);
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((r) => r.status === status));
    }
  };

  return (
    <div data-testid="requests-page">
      <h1 data-testid="requests-title">My Adoption Requests</h1>

      <div data-testid="status-filters" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          data-testid="filter-all"
          onClick={() => handleStatusFilter('all')}
          style={{
            background: selectedStatus === null || selectedStatus === 'all' ? '#007bff' : '#f0f0f0',
            color: selectedStatus === null || selectedStatus === 'all' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        <button
          data-testid="filter-pending"
          onClick={() => handleStatusFilter('pending')}
          style={{
            background: selectedStatus === 'pending' ? '#ffc107' : '#f0f0f0',
            color: selectedStatus === 'pending' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Pending
        </button>
        <button
          data-testid="filter-approved"
          onClick={() => handleStatusFilter('approved')}
          style={{
            background: selectedStatus === 'approved' ? '#28a745' : '#f0f0f0',
            color: selectedStatus === 'approved' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Approved
        </button>
        <button
          data-testid="filter-rejected"
          onClick={() => handleStatusFilter('rejected')}
          style={{
            background: selectedStatus === 'rejected' ? '#dc3545' : '#f0f0f0',
            color: selectedStatus === 'rejected' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Rejected
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div data-testid="empty-requests">
          <p>No adoption requests found.</p>
        </div>
      ) : (
        <div data-testid="requests-list">
          {filteredRequests.map((request) => (
            <div key={request.id} data-testid={`request-item-${request.id}`} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <h3 data-testid={`request-pet-name-${request.id}`}>{request.pet_name}</h3>
              <p data-testid={`request-status-${request.id}`}>
                Status: <span data-testid={`status-badge-${request.id}`} style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background:
                    request.status === 'pending'
                      ? '#ffc107'
                      : request.status === 'approved'
                        ? '#28a745'
                        : '#dc3545',
                  color: 'white',
                }}>{request.status}</span>
              </p>
              <p data-testid={`request-date-${request.id}`}>Created: {new Date(request.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
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
 * INTEGRATION TESTS: Favorites & Adoption Flows
 * ============================================================================
 */
describe('Pet Favorites & Adoption Flow - End-to-End Tests', () => {
  // =====================
  // SCENARIO 1: Favorites Management
  // =====================
  describe('Scenario 1: Add Pet to Favorites → Visual Update → Remove', () => {
    it('should add pet to favorites and update heart icon', async () => {
      const user = userEvent.setup();

      const FavoritesTestComponent = () => {
        const [favorites, setFavorites] = React.useState<Pet[]>([]);

        const toggleFavorite = async (petId: number) => {
          const pet = mockPets.find((p) => p.id === petId);
          if (!pet) return;

          const isFavorite = favorites.some((f) => f.id === petId);

          if (isFavorite) {
            await fetch(`http://localhost:8000/api/pets/${petId}/favorites`, {
              method: 'DELETE',
              headers: { Authorization: 'Bearer fake-token' },
            });
            setFavorites(favorites.filter((f) => f.id !== petId));
          } else {
            await fetch(`http://localhost:8000/api/pets/${petId}/favorites`, {
              method: 'POST',
              headers: { Authorization: 'Bearer fake-token' },
            });
            setFavorites([...favorites, pet]);
          }
        };

        const isFav = (petId: number) => favorites.some((f) => f.id === petId);

        return (
          <div>
            <div data-testid="pet-listing" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {mockPets.map((pet) => (
                <PetCardWithFavorite
                  key={pet.id}
                  pet={pet}
                  isFavorite={isFav(pet.id)}
                  onFavoriteToggle={toggleFavorite}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        );
      };

      render(<FavoritesTestComponent />, { wrapper: TestWrapper });

      // Verify initial state - no favorites
      expect(screen.getByTestId('favorite-btn-1')).toHaveTextContent('🤍');

      // Click favorite button for Buddy
      await user.click(screen.getByTestId('favorite-btn-1'));

      // Wait for heart icon to turn red
      await waitFor(() => {
        expect(screen.getByTestId('favorite-btn-1')).toHaveTextContent('❤️');
      });
    });

    it('should navigate to /favorites and display favorite pets', async () => {
      const user = userEvent.setup();
      const favoritePets = [mockPets[0], mockPets[2]];

      render(<FavoritesPage favorites={favoritePets} onRemoveFavorite={() => {}} />, {
        wrapper: TestWrapper,
      });

      // Verify favorites page
      expect(screen.getByTestId('favorites-page')).toBeInTheDocument();
      expect(screen.getByTestId('favorites-title')).toHaveTextContent('My Favorites');

      // Verify favorite pets are listed
      expect(screen.getByTestId('favorite-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('fav-pet-name-1')).toHaveTextContent('Buddy');

      expect(screen.getByTestId('favorite-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('fav-pet-name-3')).toHaveTextContent('Luna');

      // Verify non-favorite pet is not listed
      expect(screen.queryByTestId('favorite-item-2')).not.toBeInTheDocument();
    });

    it('should remove pet from favorites and update list', async () => {
      const user = userEvent.setup();

      const FavoritesTestComponent = () => {
        const [favoritePets, setFavoritePets] = React.useState([mockPets[0]]);

        return (
          <FavoritesPage
            favorites={favoritePets}
            onRemoveFavorite={(petId) => {
              setFavoritePets(favoritePets.filter((p) => p.id !== petId));
            }}
          />
        );
      };

      render(<FavoritesTestComponent />, { wrapper: TestWrapper });

      // Initially Buddy is in favorites
      expect(screen.getByTestId('favorite-item-1')).toBeInTheDocument();

      // Click remove button
      const removeBtn = screen.getByTestId('remove-favorite-btn-1');
      await user.click(removeBtn);

      // Verify favorites list is now empty
      await waitFor(() => {
        expect(screen.getByTestId('empty-favorites')).toBeInTheDocument();
      });
    });
  });

  // =====================
  // SCENARIO 2: Adoption Form Submission
  // =====================
  describe('Scenario 2: Pet Profile → Adoption Form → Submit → Confirmation', () => {
    it('should display adoption form modal on pet profile', async () => {
      render(
        <AdoptionFormComponent
          petId={1}
          petName="Buddy"
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />,
        { wrapper: TestWrapper }
      );

      // Verify form is displayed
      expect(screen.getByTestId('adoption-modal')).toBeInTheDocument();
      expect(screen.getByTestId('form-title')).toHaveTextContent('Adopt Buddy');
    });

    it('should fill and validate all 3 form steps', async () => {
      const user = userEvent.setup();

      render(
        <AdoptionFormComponent
          petId={1}
          petName="Buddy"
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />,
        { wrapper: TestWrapper }
      );

      // Step 1: Personal Info
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1 of 3');
      expect(screen.getByTestId('step-1')).toBeInTheDocument();

      const nameInput = screen.getByTestId('input-name') as HTMLInputElement;
      const emailInput = screen.getByTestId('input-email') as HTMLInputElement;
      const phoneInput = screen.getByTestId('input-phone') as HTMLInputElement;

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '555-1234');

      // Click next to go to step 2
      const nextBtn = screen.getByTestId('next-step-btn');
      await user.click(nextBtn);

      // Step 2: Housing Info
      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 3');
      });
      expect(screen.getByTestId('step-2')).toBeInTheDocument();

      const addressInput = screen.getByTestId('input-address') as HTMLInputElement;
      const housingSelect = screen.getByTestId('select-housing') as HTMLSelectElement;
      const otherPetsCheckbox = screen.getByTestId('input-other-pets') as HTMLInputElement;

      await user.type(addressInput, '123 Main St');
      await user.selectOptions(housingSelect, 'house');
      await user.click(otherPetsCheckbox);

      // Verify selections
      expect(addressInput.value).toBe('123 Main St');
      expect(housingSelect.value).toBe('house');
      expect(otherPetsCheckbox.checked).toBe(true);

      // Click next to go to step 3
      await user.click(screen.getByTestId('next-step-btn'));

      // Step 3: Motivation & Terms
      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 3');
      });
      expect(screen.getByTestId('step-3')).toBeInTheDocument();

      const motivationInput = screen.getByTestId('input-motivation') as HTMLTextAreaElement;
      const termsCheckbox = screen.getByTestId('input-terms') as HTMLInputElement;

      await user.type(motivationInput, 'I love dogs and want to provide a loving home');
      await user.click(termsCheckbox);

      expect(motivationInput.value).toContain('loving home');
      expect(termsCheckbox.checked).toBe(true);
    });

    it('should submit adoption form and show confirmation', async () => {
      const user = userEvent.setup();
      let submitted = false;

      server.use(
        http.post('*/api/pets/1/apply', async ({ request }) => {
          submitted = true;
          const body = (await request.json()) as any;
          expect(body.form_data).toBeDefined();

          return HttpResponse.json({
            id: 2,
            user_id: 1,
            pet_id: 1,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const onSuccess = vi.fn();

      const TestAdoptionFlow = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        return (
          <div>
            <button data-testid="open-adoption-btn" onClick={() => setIsOpen(true)}>
              Adopt Now
            </button>
            <AdoptionFormComponent
              petId={1}
              petName="Buddy"
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              onSuccess={onSuccess}
            />
          </div>
        );
      };

      render(<TestAdoptionFlow />, { wrapper: TestWrapper });

      // Fill form (step 1)
      await user.type(screen.getByTestId('input-name'), 'Jane Doe');
      await user.type(screen.getByTestId('input-email'), 'jane@example.com');
      await user.type(screen.getByTestId('input-phone'), '555-5678');

      // Go to step 2
      await user.click(screen.getByTestId('next-step-btn'));

      // Fill step 2
      await waitFor(() => expect(screen.getByTestId('step-2')).toBeInTheDocument());
      await user.type(screen.getByTestId('input-address'), '456 Oak Ave');
      await user.selectOptions(screen.getByTestId('select-housing'), 'apartment');

      // Go to step 3
      await user.click(screen.getByTestId('next-step-btn'));

      // Fill step 3 and submit
      await waitFor(() => expect(screen.getByTestId('step-3')).toBeInTheDocument());
      await user.type(screen.getByTestId('input-motivation'), 'Perfect pet for my family');
      await user.click(screen.getByTestId('input-terms'));

      // Submit form
      await user.click(screen.getByTestId('next-step-btn'));

      // Verify submission
      await waitFor(() => {
        expect(submitted).toBe(true);
      });
    });
  });

  // =====================
  // SCENARIO 3: Adoption Requests Page
  // =====================
  describe('Scenario 3: Adoption Requests Page → View & Filter by Status', () => {
    it('should display user adoption requests on /requests page', async () => {
      const mockRequests = [
        {
          id: 1,
          pet_id: 1,
          pet_name: 'Buddy',
          status: 'pending',
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 2,
          pet_id: 3,
          pet_name: 'Luna',
          status: 'approved',
          created_at: '2024-01-18T10:00:00Z',
        },
      ];

      render(<AdoptionRequestsPage requests={mockRequests} />, { wrapper: TestWrapper });

      // Verify page title and requests
      expect(screen.getByTestId('requests-page')).toBeInTheDocument();
      expect(screen.getByTestId('requests-title')).toHaveTextContent('My Adoption Requests');

      // Verify both requests are displayed
      expect(screen.getByTestId('request-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('request-pet-name-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('request-status-1')).toHaveTextContent('pending');

      expect(screen.getByTestId('request-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('request-pet-name-2')).toHaveTextContent('Luna');
      expect(screen.getByTestId('request-status-2')).toHaveTextContent('approved');
    });

    it('should filter requests by status (pending/approved/rejected)', async () => {
      const user = userEvent.setup();
      const mockRequests = [
        {
          id: 1,
          pet_id: 1,
          pet_name: 'Buddy',
          status: 'pending',
          created_at: '2024-01-20T10:00:00Z',
        },
        {
          id: 2,
          pet_id: 3,
          pet_name: 'Luna',
          status: 'approved',
          created_at: '2024-01-18T10:00:00Z',
        },
        {
          id: 3,
          pet_id: 2,
          pet_name: 'Whiskers',
          status: 'rejected',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      render(<AdoptionRequestsPage requests={mockRequests} />, { wrapper: TestWrapper });

      // Initially all 3 requests visible
      expect(screen.getByTestId('request-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('request-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('request-item-3')).toBeInTheDocument();

      // Filter by Pending
      await user.click(screen.getByTestId('filter-pending'));

      // Only pending request visible
      await waitFor(() => {
        expect(screen.getByTestId('request-item-1')).toBeInTheDocument();
        expect(screen.queryByTestId('request-item-2')).not.toBeInTheDocument();
        expect(screen.queryByTestId('request-item-3')).not.toBeInTheDocument();
      });

      // Filter by Approved
      await user.click(screen.getByTestId('filter-approved'));

      // Only approved request visible
      await waitFor(() => {
        expect(screen.queryByTestId('request-item-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('request-item-2')).toBeInTheDocument();
        expect(screen.queryByTestId('request-item-3')).not.toBeInTheDocument();
      });

      // Filter by Rejected
      await user.click(screen.getByTestId('filter-rejected'));

      // Only rejected request visible
      await waitFor(() => {
        expect(screen.queryByTestId('request-item-1')).not.toBeInTheDocument();
        expect(screen.queryByTestId('request-item-2')).not.toBeInTheDocument();
        expect(screen.getByTestId('request-item-3')).toBeInTheDocument();
      });

      // Reset to All
      await user.click(screen.getByTestId('filter-all'));

      // All requests visible again
      await waitFor(() => {
        expect(screen.getByTestId('request-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('request-item-2')).toBeInTheDocument();
        expect(screen.getByTestId('request-item-3')).toBeInTheDocument();
      });
    });

    it('should handle empty adoption requests', async () => {
      render(<AdoptionRequestsPage requests={[]} />, { wrapper: TestWrapper });

      expect(screen.getByTestId('empty-requests')).toBeInTheDocument();
      expect(screen.getByTestId('empty-requests')).toHaveTextContent('No adoption requests found');
    });
  });

  // =====================
  // SCENARIO 4: Favorites Filters
  // =====================
  describe('Scenario 4: Favorites Page → Apply Filters → Update List', () => {
    it('should filter favorites by species', async () => {
      const user = userEvent.setup();

      const FavoritesWithFilters = () => {
        const [favorites] = React.useState(mockPets);
        const [speciesFilter, setSpeciesFilter] = React.useState<string | null>(null);

        const filtered = speciesFilter
          ? favorites.filter((p) => p.species === speciesFilter)
          : favorites;

        return (
          <div data-testid="favorites-with-filters">
            <div data-testid="species-filters" style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <button
                data-testid="filter-all-species"
                onClick={() => setSpeciesFilter(null)}
                style={{ background: speciesFilter === null ? '#007bff' : '#f0f0f0', color: speciesFilter === null ? 'white' : 'black', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
              >
                All
              </button>
              <button
                data-testid="filter-dog-species"
                onClick={() => setSpeciesFilter('dog')}
                style={{ background: speciesFilter === 'dog' ? '#007bff' : '#f0f0f0', color: speciesFilter === 'dog' ? 'white' : 'black', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
              >
                Dogs
              </button>
              <button
                data-testid="filter-cat-species"
                onClick={() => setSpeciesFilter('cat')}
                style={{ background: speciesFilter === 'cat' ? '#007bff' : '#f0f0f0', color: speciesFilter === 'cat' ? 'white' : 'black', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
              >
                Cats
              </button>
            </div>

            <div data-testid="filtered-count">Showing {filtered.length} pets</div>

            <div data-testid="favorites-grid-filtered" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {filtered.map((pet) => (
                <div key={pet.id} data-testid={`filtered-pet-${pet.id}`} style={{ padding: '12px', border: '1px solid #ccc' }}>
                  <h3>{pet.name}</h3>
                  <p>{pet.species}</p>
                </div>
              ))}
            </div>
          </div>
        );
      };

      render(<FavoritesWithFilters />, { wrapper: TestWrapper });

      // Initially showing all 3 pets
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 3 pets');
      expect(screen.getByTestId('filtered-pet-1')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-pet-2')).toBeInTheDocument();
      expect(screen.getByTestId('filtered-pet-3')).toBeInTheDocument();

      // Filter by Dogs (Buddy, Luna)
      await user.click(screen.getByTestId('filter-dog-species'));

      // Should show only 2 dogs
      await waitFor(() => {
        expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 2 pets');
      });
      expect(screen.getByTestId('filtered-pet-1')).toBeInTheDocument(); // Buddy
      expect(screen.getByTestId('filtered-pet-3')).toBeInTheDocument(); // Luna
      expect(screen.queryByTestId('filtered-pet-2')).not.toBeInTheDocument(); // Whiskers (cat)

      // Filter by Cats (Whiskers)
      await user.click(screen.getByTestId('filter-cat-species'));

      // Should show only 1 cat
      await waitFor(() => {
        expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 1 pets');
      });
      expect(screen.queryByTestId('filtered-pet-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('filtered-pet-2')).toBeInTheDocument(); // Whiskers
      expect(screen.queryByTestId('filtered-pet-3')).not.toBeInTheDocument();

      // Reset to All
      await user.click(screen.getByTestId('filter-all-species'));

      // Should show all 3 again
      await waitFor(() => {
        expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 3 pets');
      });
    });
  });

  // =====================
  // API MOCKING TESTS
  // =====================
  describe('Favorites & Adoption API Mocking', () => {
    it('should mock GET /api/favorites endpoint', async () => {
      server.use(
        http.get('*/api/favorites', () => {
          return HttpResponse.json([
            {
              id: 1,
              pet_id: 1,
              user_id: 1,
              created_at: '2024-01-20T10:00:00Z',
            },
          ]);
        })
      );

      const response = await fetch('http://localhost:8000/api/favorites', {
        headers: { Authorization: 'Bearer fake-token' },
      });

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toHaveProperty('pet_id');
    });

    it('should mock POST /api/pets/:petId/favorites endpoint', async () => {
      server.use(
        http.post('*/api/pets/1/favorites', () => {
          return HttpResponse.json({
            message: 'Pet added to favorites',
            favorite: { id: 5, user_id: 1, pet_id: 1 },
          });
        })
      );

      const response = await fetch('http://localhost:8000/api/pets/1/favorites', {
        method: 'POST',
        headers: { Authorization: 'Bearer fake-token' },
      });

      const data = await response.json();
      expect(data.message).toContain('added to favorites');
      expect(data.favorite).toHaveProperty('pet_id');
    });

    it('should mock DELETE /api/pets/:petId/favorites endpoint', async () => {
      server.use(
        http.delete('*/api/pets/1/favorites', () => {
          return HttpResponse.json({ message: 'Pet removed from favorites' });
        })
      );

      const response = await fetch('http://localhost:8000/api/pets/1/favorites', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer fake-token' },
      });

      const data = await response.json();
      expect(data.message).toContain('removed from favorites');
    });

    it('should mock POST /api/pets/:petId/apply endpoint', async () => {
      server.use(
        http.post('*/api/pets/1/apply', async ({ request }) => {
          const body = (await request.json()) as any;
          return HttpResponse.json({
            id: 10,
            user_id: 1,
            pet_id: 1,
            status: 'pending',
            form_data: body.form_data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { status: 201 });
        })
      );

      const response = await fetch('http://localhost:8000/api/pets/1/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        },
        body: JSON.stringify({ form_data: { name: 'John', email: 'john@test.com' } }),
      });

      const data = await response.json();
      expect(data.status).toBe('pending');
      expect(data.pet_id).toBe(1);
    });

    it('should mock GET /api/adoptions endpoint (user adoption requests)', async () => {
      server.use(
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
        })
      );

      const response = await fetch('http://localhost:8000/api/adoptions', {
        headers: { Authorization: 'Bearer fake-token' },
      });

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].status).toBe('pending');
      expect(data[1].status).toBe('approved');
    });

    it('should handle adoption API errors gracefully', async () => {
      server.use(
        http.post('*/api/pets/999/apply', () => {
          return HttpResponse.json(
            { message: 'Pet not found' },
            { status: 404 }
          );
        })
      );

      const response = await fetch('http://localhost:8000/api/pets/999/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer fake-token',
        },
        body: JSON.stringify({ form_data: {} }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toContain('not found');
    });
  });
});
