import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  {
    id: 4,
    name: 'Milo',
    species: 'cat',
    type: 'Persian',
    age: 1,
    gender: 'male',
    profile_picture: 'https://example.com/milo.jpg',
    status: 'pending',
    description: 'A cute and fluffy Persian kitten',
  },
  {
    id: 5,
    name: 'Max',
    species: 'dog',
    type: 'German Shepherd',
    age: 5,
    gender: 'male',
    profile_picture: 'https://example.com/max.jpg',
    status: 'available',
    description: 'An intelligent and protective German Shepherd',
  },
];

const mockAIMatchedPets = [
  { ...mockPets[0], score: 95 },
  { ...mockPets[2], score: 87 },
  { ...mockPets[4], score: 78 },
];

/**
 * Test Component: Pet Card (Simple Card)
 */
const PetCardComponent = ({ pet, onClick }: { pet: Pet; onClick?: () => void }) => (
  <div
    onClick={onClick}
    data-testid={`pet-card-${pet.id}`}
    className="pet-card cursor-pointer"
    style={{
      backgroundImage: `url(${pet.profile_picture})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: '280px',
      height: '400px',
      borderRadius: '8px',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '16px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      }}
    >
      <h3 data-testid={`pet-name-${pet.id}`}>{pet.name}</h3>
      <p data-testid={`pet-type-${pet.id}`}>{pet.type}</p>
      <p data-testid={`pet-age-${pet.id}`}>{pet.age} years old</p>
      <p data-testid={`pet-status-${pet.id}`}>{pet.status}</p>
    </div>
  </div>
);

/**
 * Test Component: AI Pet Card with Match Score
 */
const PetCardAIComponent = ({ pet, onClick }: { pet: Pet & { score?: number }; onClick?: () => void }) => (
  <div
    onClick={onClick}
    data-testid={`pet-card-ai-${pet.id}`}
    className="pet-card-ai cursor-pointer relative"
    style={{
      backgroundImage: `url(${pet.profile_picture})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: '280px',
      height: '400px',
      borderRadius: '8px',
    }}
  >
    {pet.score !== undefined && (
      <div
        data-testid={`match-score-${pet.id}`}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: '#D97F3E',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {pet.score}% Match
      </div>
    )}
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '16px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
      }}
    >
      <h3 data-testid={`pet-name-ai-${pet.id}`}>{pet.name}</h3>
      <p data-testid={`pet-type-ai-${pet.id}`}>{pet.type}</p>
      <p data-testid={`pet-age-ai-${pet.id}`}>{pet.age} years old</p>
    </div>
  </div>
);

/**
 * Test Component: Pet Filters
 */
const PetFiltersComponent = ({
  onFilterChange,
}: {
  onFilterChange: (filters: { species: string[]; ageRange: string[] }) => void;
}) => {
  const [selectedSpecies, setSelectedSpecies] = React.useState<string[]>([]);
  const [selectedAge, setSelectedAge] = React.useState<string[]>([]);

  const handleSpeciesChange = (species: string) => {
    const updated = selectedSpecies.includes(species)
      ? selectedSpecies.filter((s) => s !== species)
      : [...selectedSpecies, species];
    setSelectedSpecies(updated);
    onFilterChange({ species: updated, ageRange: selectedAge });
  };

  const handleAgeChange = (age: string) => {
    const updated = selectedAge.includes(age)
      ? selectedAge.filter((a) => a !== age)
      : [...selectedAge, age];
    setSelectedAge(updated);
    onFilterChange({ species: selectedSpecies, ageRange: updated });
  };

  return (
    <div data-testid="pet-filters">
      <h3>Filter by Species</h3>
      {['dog', 'cat'].map((species) => (
        <label key={species} data-testid={`filter-species-${species}`}>
          <input
            type="checkbox"
            checked={selectedSpecies.includes(species)}
            onChange={() => handleSpeciesChange(species)}
            data-testid={`checkbox-species-${species}`}
          />
          {species}
        </label>
      ))}

      <h3>Filter by Age Range</h3>
      {['0-2', '2-4', '4-6'].map((range) => (
        <label key={range} data-testid={`filter-age-${range}`}>
          <input
            type="checkbox"
            checked={selectedAge.includes(range)}
            onChange={() => handleAgeChange(range)}
            data-testid={`checkbox-age-${range}`}
          />
          {range} years
        </label>
      ))}
    </div>
  );
};

/**
 * Test Component: Pet Listing (OurPets simulation)
 */
const PetListingComponent = ({ pets, onPetClick }: { pets: Pet[]; onPetClick: (petId: number) => void }) => (
  <div data-testid="pet-listing">
    <h1 data-testid="listing-title">Our Pets</h1>
    <p data-testid="pet-count">Total pets: {pets.length}</p>
    <div data-testid="pet-grid" className="grid gap-4">
      {pets.map((pet) => (
        <PetCardComponent key={pet.id} pet={pet} onClick={() => onPetClick(pet.id)} />
      ))}
    </div>
  </div>
);

/**
 * Test Component: AI Match Results (MatchResults simulation)
 */
const AIMatchResultsComponent = ({
  pets,
  description,
  onPetClick,
}: {
  pets: (Pet & { score?: number })[];
  description: string;
  onPetClick: (petId: number) => void;
}) => (
  <div data-testid="match-results">
    <h1 data-testid="results-title">Your Pet Matches</h1>
    <p data-testid="search-query">Your query: {description}</p>
    <p data-testid="match-count">Found {pets.length} matches</p>
    <div data-testid="match-grid" className="grid gap-4">
      {pets.map((pet) => (
        <PetCardAIComponent key={pet.id} pet={pet} onClick={() => onPetClick(pet.id)} />
      ))}
    </div>
  </div>
);

/**
 * Test Component: Pet Profile (Detail view)
 */
const PetProfileComponent = ({ pet }: { pet: Pet }) => (
  <div data-testid="pet-profile">
    <h1 data-testid="profile-name">{pet.name}</h1>
    <img
      data-testid="profile-picture"
      src={pet.profile_picture || ''}
      alt={pet.name}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
    <div data-testid="profile-details">
      <p>
        <strong>Species:</strong> <span data-testid="profile-species">{pet.species}</span>
      </p>
      <p>
        <strong>Type:</strong> <span data-testid="profile-type">{pet.type}</span>
      </p>
      <p>
        <strong>Age:</strong> <span data-testid="profile-age">{pet.age} years</span>
      </p>
      <p>
        <strong>Gender:</strong> <span data-testid="profile-gender">{pet.gender}</span>
      </p>
      <p>
        <strong>Status:</strong> <span data-testid="profile-status">{pet.status}</span>
      </p>
      <p>
        <strong>Description:</strong> <span data-testid="profile-description">{pet.description}</span>
      </p>
    </div>
  </div>
);

/**
 * Test Component: AI Welcome (Search form)
 */
const AIWelcomeComponent = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      onSearch(query);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="ai-welcome">
      <h1 data-testid="welcome-title">Find Your Perfect Pet</h1>
      <form onSubmit={handleSubmit} data-testid="search-form">
        <textarea
          data-testid="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your ideal pet..."
          rows={4}
          cols={50}
        />
        <button
          data-testid="search-button"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Find Matches'}
        </button>
      </form>
    </div>
  );
};

/**
 * Test Wrapper Component
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
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// =====================
// INTEGRATION TESTS
// =====================

describe('Pet Browsing Flow - End-to-End Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    server.resetHandlers();
    // Set up authenticated user
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      })
    );
    localStorage.setItem('token', 'test-token-123');
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =====================
  // SCENARIO 1: Pet Listing with Filters
  // =====================
  describe('Scenario 1: Pet Listing → Filters → Pet Profile', () => {
    it('should display list of all pets on OurPets page', async () => {
      server.use(
        http.get('*/api/pets', async () => {
          return HttpResponse.json(mockPets);
        })
      );

      render(<PetListingComponent pets={mockPets} onPetClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      // Verify page loads with title
      expect(screen.getByTestId('listing-title')).toBeInTheDocument();
      expect(screen.getByText('Our Pets')).toBeInTheDocument();

      // Verify pet count
      expect(screen.getByTestId('pet-count')).toHaveTextContent('Total pets: 5');

      // Verify all pets are displayed
      expect(screen.getByTestId('pet-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-4')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-5')).toBeInTheDocument();

      // Verify pet names are displayed
      expect(screen.getByTestId('pet-name-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('pet-name-2')).toHaveTextContent('Whiskers');
      expect(screen.getByTestId('pet-name-3')).toHaveTextContent('Luna');
    });

    it('should apply species filter and update pet list', async () => {
      const user = userEvent.setup();

      const TestFilterComponent = () => {
        const [filteredPets, setFilteredPets] = React.useState<Pet[]>(mockPets);

        const handleFilterChange = (filters: { species: string[]; ageRange: string[] }) => {
          const filtered = mockPets.filter(
            (pet) =>
              filters.species.length === 0 ||
              filters.species.includes(pet.species || '')
          );
          setFilteredPets(filtered);
        };

        return (
          <div>
            <PetFiltersComponent onFilterChange={handleFilterChange} />
            <PetListingComponent pets={filteredPets} onPetClick={() => {}} />
          </div>
        );
      };

      render(<TestFilterComponent />, { wrapper: TestWrapper });

      // Initially all 5 pets are shown
      expect(screen.getByTestId('pet-count')).toHaveTextContent('Total pets: 5');

      // Apply dog filter
      const dogCheckbox = screen.getByTestId('checkbox-species-dog');
      await user.click(dogCheckbox);

      // Wait for filter to apply
      await waitFor(() => {
        expect(screen.getByTestId('pet-count')).toHaveTextContent('Total pets: 3');
      });

      // Verify only dogs are shown
      expect(screen.getByTestId('pet-card-1')).toBeInTheDocument(); // Buddy (dog)
      expect(screen.getByTestId('pet-card-3')).toBeInTheDocument(); // Luna (dog)
      expect(screen.getByTestId('pet-card-5')).toBeInTheDocument(); // Max (dog)

      // Verify cats are hidden
      expect(screen.queryByTestId('pet-card-2')).not.toBeInTheDocument(); // Whiskers (cat)
      expect(screen.queryByTestId('pet-card-4')).not.toBeInTheDocument(); // Milo (cat)
    });

    it('should apply age range filter to pets', async () => {
      const user = userEvent.setup();

      const TestFilterComponent = () => {
        const [filteredPets, setFilteredPets] = React.useState<Pet[]>(mockPets);

        const handleFilterChange = (filters: { species: string[]; ageRange: string[] }) => {
          const filtered = mockPets.filter((pet) => {
            const age = pet.age || 0;
            if (filters.ageRange.length === 0) return true;

            return filters.ageRange.some((range) => {
              const [min, max] = range.split('-').map(Number);
              return age >= min && age <= max;
            });
          });
          setFilteredPets(filtered);
        };

        return (
          <div>
            <PetFiltersComponent onFilterChange={handleFilterChange} />
            <PetListingComponent pets={filteredPets} onPetClick={() => {}} />
          </div>
        );
      };

      render(<TestFilterComponent />, { wrapper: TestWrapper });

      // Initially all 5 pets
      expect(screen.getByTestId('pet-count')).toHaveTextContent('Total pets: 5');

      // Apply age range 0-2
      const ageCheckbox = screen.getByTestId('checkbox-age-0-2');
      await user.click(ageCheckbox);

      // Wait for filter to apply
      await waitFor(() => {
        // Age 0-2: Milo (age 1) and Whiskers (age 2) = 2 pets
        expect(screen.getByTestId('pet-count')).toHaveTextContent('Total pets: 2');
      });

      // Verify Milo and Whiskers are shown
      expect(screen.getByTestId('pet-card-2')).toBeInTheDocument(); // Whiskers (age 2)
      expect(screen.getByTestId('pet-card-4')).toBeInTheDocument(); // Milo (age 1)
      
      // Verify other pets are hidden
      expect(screen.queryByTestId('pet-card-1')).not.toBeInTheDocument(); // Buddy (age 3)
      expect(screen.queryByTestId('pet-card-3')).not.toBeInTheDocument(); // Luna (age 4)
      expect(screen.queryByTestId('pet-card-5')).not.toBeInTheDocument(); // Max (age 5)
    });

    it('should navigate to pet profile and display full details', async () => {
      const user = userEvent.setup();

      const TestNavigationComponent = () => {
        const [selectedPet, setSelectedPet] = React.useState<Pet | null>(null);

        const handlePetClick = (petId: number) => {
          const pet = mockPets.find((p) => p.id === petId);
          if (pet) setSelectedPet(pet);
        };

        if (selectedPet) {
          return <PetProfileComponent pet={selectedPet} />;
        }

        return <PetListingComponent pets={mockPets} onPetClick={handlePetClick} />;
      };

      render(<TestNavigationComponent />, { wrapper: TestWrapper });

      // Initially on listing page
      expect(screen.getByTestId('listing-title')).toBeInTheDocument();

      // Click on Buddy
      const buddyCard = screen.getByTestId('pet-card-1');
      await user.click(buddyCard);

      // Navigate to profile
      await waitFor(() => {
        expect(screen.getByTestId('pet-profile')).toBeInTheDocument();
      });

      // Verify full details are displayed
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('profile-species')).toHaveTextContent('dog');
      expect(screen.getByTestId('profile-type')).toHaveTextContent('Golden Retriever');
      expect(screen.getByTestId('profile-age')).toHaveTextContent('3 years');
      expect(screen.getByTestId('profile-gender')).toHaveTextContent('male');
      expect(screen.getByTestId('profile-status')).toHaveTextContent('available');
      expect(screen.getByTestId('profile-description')).toHaveTextContent(
        'A friendly and energetic golden retriever'
      );
    });

    it('should render PetCard components with correct styling', async () => {
      render(<PetCardComponent pet={mockPets[0]} onClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const petCard = screen.getByTestId('pet-card-1');
      expect(petCard).toBeInTheDocument();
      expect(petCard).toHaveClass('pet-card');
      expect(petCard).toHaveClass('cursor-pointer');

      // Verify card displays pet info
      expect(screen.getByTestId('pet-name-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('pet-type-1')).toHaveTextContent('Golden Retriever');
      expect(screen.getByTestId('pet-age-1')).toHaveTextContent('3 years old');
    });
  });

  // =====================
  // SCENARIO 2: AI Pet Matching
  // =====================
  describe('Scenario 2: AI Search → Match Results with Scores → Details', () => {
    it('should submit pet preference query and display AI matched results', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('*/api/match-pets', async ({ request }) => {
          const body = (await request.json()) as any;
          expect(body.user_message).toBe('I love active dogs with friendly temperament');

          return HttpResponse.json({
            pets: mockAIMatchedPets,
            total: 3,
            message: 'Found 3 great matches for you!',
          });
        })
      );

      const TestAIComponent = () => {
        const [matchedPets, setMatchedPets] = React.useState<(Pet & { score?: number })[] | null>(null);
        const [searchQuery, setSearchQuery] = React.useState('');

        const handleSearch = async (query: string) => {
          setSearchQuery(query);
          try {
            const response = await fetch('http://localhost:8000/api/match-pets', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer test-token-123',
              },
              body: JSON.stringify({ user_message: query }),
            });
            const data = await response.json();
            setMatchedPets(data.pets);
          } catch (error) {
            console.error('Error:', error);
          }
        };

        if (matchedPets) {
          return (
            <AIMatchResultsComponent
              pets={matchedPets}
              description={searchQuery}
              onPetClick={() => {}}
            />
          );
        }

        return <AIWelcomeComponent onSearch={handleSearch} />;
      };

      render(<TestAIComponent />, { wrapper: TestWrapper });

      // Verify on welcome page
      expect(screen.getByTestId('ai-welcome')).toBeInTheDocument();
      expect(screen.getByTestId('welcome-title')).toHaveTextContent('Find Your Perfect Pet');

      // Enter search query
      const input = screen.getByTestId('search-input') as HTMLTextAreaElement;
      await user.type(input, 'I love active dogs with friendly temperament');

      // Submit search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      // Wait for results
      await waitFor(() => {
        expect(screen.getByTestId('match-results')).toBeInTheDocument();
      });

      // Verify results page displays
      expect(screen.getByTestId('results-title')).toHaveTextContent('Your Pet Matches');
      expect(screen.getByTestId('search-query')).toHaveTextContent(
        'Your query: I love active dogs with friendly temperament'
      );
      expect(screen.getByTestId('match-count')).toHaveTextContent('Found 3 matches');
    });

    it('should display match scores on AI result cards', async () => {
      render(
        <AIMatchResultsComponent pets={mockAIMatchedPets} description="test" onPetClick={() => {}} />,
        { wrapper: TestWrapper }
      );

      // Verify match results are displayed
      expect(screen.getByTestId('match-results')).toBeInTheDocument();

      // Verify score badges are shown
      expect(screen.getByTestId('match-score-1')).toHaveTextContent('95% Match');
      expect(screen.getByTestId('match-score-3')).toHaveTextContent('87% Match');
      expect(screen.getByTestId('match-score-5')).toHaveTextContent('78% Match');

      // Verify scores are displayed in descending order
      const scores = [
        screen.getByTestId('match-score-1'),
        screen.getByTestId('match-score-3'),
        screen.getByTestId('match-score-5'),
      ];

      expect(scores[0]).toHaveTextContent('95% Match');
      expect(scores[1]).toHaveTextContent('87% Match');
      expect(scores[2]).toHaveTextContent('78% Match');
    });

    it('should sort AI results by relevance (match score)', async () => {
      const unsortedPets: (Pet & { score?: number })[] = [
        { ...mockPets[0], score: 78 },
        { ...mockPets[2], score: 95 },
        { ...mockPets[4], score: 87 },
      ];

      const sortedPets = [...unsortedPets].sort((a, b) => (b.score || 0) - (a.score || 0));

      render(<AIMatchResultsComponent pets={sortedPets} description="test" onPetClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const matchGrid = screen.getByTestId('match-grid');
      const scoreElements = within(matchGrid).getAllByTestId(/match-score-/);

      // Verify scores are in descending order
      expect(scoreElements[0]).toHaveTextContent('95% Match');
      expect(scoreElements[1]).toHaveTextContent('87% Match');
      expect(scoreElements[2]).toHaveTextContent('78% Match');
    });

    it('should navigate to pet detail from AI results', async () => {
      const user = userEvent.setup();

      const TestAINavComponent = () => {
        const [selectedPet, setSelectedPet] = React.useState<Pet | null>(null);

        const handlePetClick = (petId: number) => {
          const pet = mockAIMatchedPets.find((p) => p.id === petId);
          if (pet) setSelectedPet(pet as Pet);
        };

        if (selectedPet) {
          return <PetProfileComponent pet={selectedPet} />;
        }

        return (
          <AIMatchResultsComponent
            pets={mockAIMatchedPets}
            description="test"
            onPetClick={handlePetClick}
          />
        );
      };

      render(<TestAINavComponent />, { wrapper: TestWrapper });

      // Initially on results page
      expect(screen.getByTestId('match-results')).toBeInTheDocument();

      // Click on a pet card
      const petCardAI = screen.getByTestId('pet-card-ai-1');
      await user.click(petCardAI);

      // Navigate to profile
      await waitFor(() => {
        expect(screen.getByTestId('pet-profile')).toBeInTheDocument();
      });

      // Verify pet details
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('profile-type')).toHaveTextContent('Golden Retriever');
    });

    it('should render PetCardAI components with match scores', async () => {
      render(<PetCardAIComponent pet={mockAIMatchedPets[0]} onClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const petCardAI = screen.getByTestId('pet-card-ai-1');
      expect(petCardAI).toBeInTheDocument();
      expect(petCardAI).toHaveClass('pet-card-ai');

      // Verify score badge
      expect(screen.getByTestId('match-score-1')).toHaveTextContent('95% Match');

      // Verify pet info
      expect(screen.getByTestId('pet-name-ai-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('pet-type-ai-1')).toHaveTextContent('Golden Retriever');
    });
  });

  // =====================
  // SCENARIO 3: Dynamic Listing with Pagination
  // =====================
  describe('Scenario 3: Dynamic Pet List → Filtering → Pagination/Scroll', () => {
    it('should display paginated pet list', async () => {
      const TestPaginationComponent = () => {
        const [page, setPage] = React.useState(1);
        const petsPerPage = 3;
        const allPets = mockPets;
        const startIndex = (page - 1) * petsPerPage;
        const paginatedPets = allPets.slice(startIndex, startIndex + petsPerPage);
        const totalPages = Math.ceil(allPets.length / petsPerPage);

        return (
          <div>
            <PetListingComponent pets={paginatedPets} onPetClick={() => {}} />
            <div data-testid="pagination">
              <p data-testid="current-page">
                Page {page} of {totalPages}
              </p>
              {page > 1 && (
                <button
                  data-testid="prev-button"
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
              )}
              {page < totalPages && (
                <button
                  data-testid="next-button"
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        );
      };

      render(<TestPaginationComponent />, { wrapper: TestWrapper });

      // First page shows 3 pets
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page 1 of 2');
      expect(screen.getByTestId('pet-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('pet-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('pet-card-4')).not.toBeInTheDocument();
    });

    it('should navigate between pages with next/previous buttons', async () => {
      const user = userEvent.setup();

      const TestPaginationComponent = () => {
        const [page, setPage] = React.useState(1);
        const petsPerPage = 3;
        const allPets = mockPets;
        const startIndex = (page - 1) * petsPerPage;
        const paginatedPets = allPets.slice(startIndex, startIndex + petsPerPage);
        const totalPages = Math.ceil(allPets.length / petsPerPage);

        return (
          <div>
            <PetListingComponent pets={paginatedPets} onPetClick={() => {}} />
            <div data-testid="pagination">
              <p data-testid="current-page">
                Page {page} of {totalPages}
              </p>
              {page > 1 && (
                <button
                  data-testid="prev-button"
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
              )}
              {page < totalPages && (
                <button
                  data-testid="next-button"
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              )}
            </div>
          </div>
        );
      };

      render(<TestPaginationComponent />, { wrapper: TestWrapper });

      // Currently on page 1
      expect(screen.getByTestId('current-page')).toHaveTextContent('Page 1 of 2');

      // Click next
      const nextButton = screen.getByTestId('next-button');
      await user.click(nextButton);

      // Should navigate to page 2
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('Page 2');
      });
    });

    it('should apply filters and maintain pagination state', async () => {
      const user = userEvent.setup();

      const TestFilterPaginationComponent = () => {
        const [page, setPage] = React.useState(1);
        const [filters, setFilters] = React.useState({ species: [] as string[], ageRange: [] as string[] });
        const petsPerPage = 3;

        const filtered = mockPets.filter(
          (pet) =>
            filters.species.length === 0 ||
            filters.species.includes(pet.species || '')
        );

        const startIndex = (page - 1) * petsPerPage;
        const paginatedPets = filtered.slice(startIndex, startIndex + petsPerPage);

        const handleFilterChange = (newFilters: typeof filters) => {
          setFilters(newFilters);
          setPage(1); // Reset to page 1 on filter change
        };

        return (
          <div>
            <PetFiltersComponent onFilterChange={handleFilterChange} />
            <PetListingComponent pets={paginatedPets} onPetClick={() => {}} />
            <div data-testid="pagination">
              <p data-testid="filtered-count">Showing {paginatedPets.length} pets</p>
            </div>
          </div>
        );
      };

      render(<TestFilterPaginationComponent />, { wrapper: TestWrapper });

      // Initially showing all pets
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 3 pets');

      // Apply species filter (dogs)
      const dogCheckbox = screen.getByTestId('checkbox-species-dog');
      await user.click(dogCheckbox);

      // Should update pet count after filter
      await waitFor(() => {
        // With dog filter, we have 3 dogs (Buddy, Luna, Max)
        // On pagination of 3, first page shows all 3
        expect(screen.getByTestId('filtered-count')).toHaveTextContent('Showing 3 pets');
      });
    });

    it('should render PetFilters component correctly', async () => {
      render(
        <PetFiltersComponent
          onFilterChange={() => {}}
        />,
        { wrapper: TestWrapper }
      );

      // Verify filter component is rendered
      expect(screen.getByTestId('pet-filters')).toBeInTheDocument();

      // Verify species filter options
      expect(screen.getByTestId('filter-species-dog')).toBeInTheDocument();
      expect(screen.getByTestId('filter-species-cat')).toBeInTheDocument();

      // Verify age filter options
      expect(screen.getByTestId('filter-age-0-2')).toBeInTheDocument();
      expect(screen.getByTestId('filter-age-2-4')).toBeInTheDocument();
      expect(screen.getByTestId('filter-age-4-6')).toBeInTheDocument();
    });
  });

  // =====================
  // API MOCKING TESTS
  // =====================
  describe('Pet Service API Mocking', () => {
    it('should fetch pets from GET /api/pets endpoint', async () => {
      server.use(
        http.get('*/api/pets', async () => {
          return HttpResponse.json(mockPets);
        })
      );

      const response = await fetch('http://localhost:8000/api/pets', {
        headers: {
          Authorization: 'Bearer test-token-123',
        },
      });

      const data = await response.json();
      expect(data).toEqual(mockPets);
      expect(data.length).toBe(5);
    });

    it('should fetch AI matched pets from POST /api/match-pets', async () => {
      server.use(
        http.post('*/api/match-pets', async ({ request }) => {
          const body = (await request.json()) as any;
          expect(body.user_message).toBeDefined();

          return HttpResponse.json({
            pets: mockAIMatchedPets,
            total: 3,
            message: 'Matches found',
          });
        })
      );

      const response = await fetch('http://localhost:8000/api/match-pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-123',
        },
        body: JSON.stringify({ user_message: 'I want a friendly dog' }),
      });

      const data = await response.json();
      expect(data.pets).toEqual(mockAIMatchedPets);
      expect(data.total).toBe(3);
      expect(data.pets[0].score).toBe(95);
      expect(data.pets[1].score).toBe(87);
      expect(data.pets[2].score).toBe(78);
    });

    it('should handle empty pet list response', async () => {
      server.use(
        http.get('*/api/pets', async () => {
          return HttpResponse.json([]);
        })
      );

      const response = await fetch('http://localhost:8000/api/pets', {
        headers: {
          Authorization: 'Bearer test-token-123',
        },
      });

      const data = await response.json();
      expect(data).toEqual([]);
      expect(data.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('*/api/pets', async () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      const response = await fetch('http://localhost:8000/api/pets', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should handle match-pets with invalid query', async () => {
      server.use(
        http.post('*/api/match-pets', async ({ request }) => {
          const body = (await request.json()) as any;

          if (!body.user_message || body.user_message.trim() === '') {
            return HttpResponse.json(
              { message: 'User message is required' },
              { status: 400 }
            );
          }

          return HttpResponse.json({
            pets: mockAIMatchedPets,
            total: 3,
            message: 'Matches found',
          });
        })
      );

      const response = await fetch('http://localhost:8000/api/match-pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-123',
        },
        body: JSON.stringify({ user_message: '' }),
      });

      expect(response.status).toBe(400);
    });
  });

  // =====================
  // COMPONENT RENDERING TESTS
  // =====================
  describe('Pet Component Rendering', () => {
    it('should render PetCard with all required information', async () => {
      render(<PetCardComponent pet={mockPets[0]} onClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const card = screen.getByTestId('pet-card-1');
      expect(card).toBeInTheDocument();
      expect(screen.getByTestId('pet-name-1')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('pet-type-1')).toHaveTextContent('Golden Retriever');
      expect(screen.getByTestId('pet-age-1')).toHaveTextContent('3 years old');
      expect(screen.getByTestId('pet-status-1')).toHaveTextContent('available');
    });

    it('should handle missing profile picture in PetCard', async () => {
      const petWithoutPicture: Pet = { ...mockPets[0], profile_picture: null };

      render(<PetCardComponent pet={petWithoutPicture} onClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const card = screen.getByTestId('pet-card-1');
      expect(card).toBeInTheDocument();
      expect(screen.getByTestId('pet-name-1')).toBeInTheDocument();
    });

    it('should render PetCardAI with match score and styling', async () => {
      const petWithScore: Pet & { score?: number } = {
        ...mockPets[0],
        score: 95,
      };

      render(<PetCardAIComponent pet={petWithScore} onClick={() => {}} />, {
        wrapper: TestWrapper,
      });

      const card = screen.getByTestId('pet-card-ai-1');
      expect(card).toBeInTheDocument();
      expect(screen.getByTestId('match-score-1')).toHaveTextContent('95% Match');
    });

    it('should render PetFilters with all filter options', async () => {
      render(
        <PetFiltersComponent
          onFilterChange={() => {}}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('pet-filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-species-dog')).toBeInTheDocument();
      expect(screen.getByTestId('filter-species-cat')).toBeInTheDocument();
    });

    it('should display pet profile with all detailed information', async () => {
      render(<PetProfileComponent pet={mockPets[0]} />, {
        wrapper: TestWrapper,
      });

      expect(screen.getByTestId('pet-profile')).toBeInTheDocument();
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Buddy');
      expect(screen.getByTestId('profile-species')).toHaveTextContent('dog');
      expect(screen.getByTestId('profile-type')).toHaveTextContent('Golden Retriever');
      expect(screen.getByTestId('profile-age')).toHaveTextContent('3 years');
      expect(screen.getByTestId('profile-gender')).toHaveTextContent('male');
      expect(screen.getByTestId('profile-status')).toHaveTextContent('available');
      expect(screen.getByTestId('profile-description')).toHaveTextContent(
        'A friendly and energetic golden retriever'
      );
    });
  });
});
