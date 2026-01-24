// src/pages/listepets.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PetCard from '../components/petCard';
import PetFilters from '../components/PetFilters';
import Sidebar from '../components/SideBar';
import TopNavBar from '~/components/TopNavBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTheme } from '~/contexts/themeContext';
import {
  faChevronLeft,
  faChevronRight,
  faSpinner,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

interface Pet {
  id: number;
  name: string;
  profile_picture: string;
  species: string;
  type: string;
  age: number;
  description: string;
  shelter_id: number;
  added_by: number;
  adopted_by: number | null;
  gender: string;
  status: string;
  created_at: string;
  updated_at: string;
  shelter: {
    id: number;
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    created_at: string | null;
    updated_at: string | null;
  };
}

interface FilterState {
  species: string[];
  ageRange: string[];
}

const PetsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    species: [],
    ageRange: [],
  });
  const { isDarkMode } = useTheme();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 8;
const API_URL = `${import.meta.env.VITE_API_URL}/pets`; // ← Fixed!

  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(prev => !prev);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      setPets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les animaux');
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const speciesOptions = useMemo(() => {
    const unique = [...new Set(pets.map(p => p.species))];
    return unique.map(s => {
      let label = s;
      if (s === 'dog') label = 'Dogs';
      if (s === 'cat') label = 'Cats';
      if (!['dog', 'cat'].includes(s.toLowerCase())) {
        label = s.charAt(0).toUpperCase() + s.slice(1);
      }
      return { label, value: s };
    });
  }, [pets]);

  const ageOptions = [
    { label: '<12 months', value: '<12' },
    { label: 'Between 1 & 3 years', value: '1-3' },
    { label: 'More than 3 years', value: '>3' },
  ];

  const toggleSection = useCallback((section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  const filteredPets = useMemo(() => {
    return pets.filter(pet => {
      if (selectedFilters.species.length > 0 && !selectedFilters.species.includes(pet.species)) {
        return false;
      }
      if (selectedFilters.ageRange.length > 0) {
        const age = pet.age;
        const hasMatch = selectedFilters.ageRange.some(range => {
          if (range === '<12') return age < 1;
          if (range === '1-3') return age >= 1 && age <= 3;
          if (range === '>3') return age > 3;
          return false;
        });
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [pets, selectedFilters]);

  const totalPages = Math.ceil(filteredPets.length / itemsPerPage);
  const currentPets = filteredPets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => setCurrentPage(1), [selectedFilters]);

  const adaptPetForCard = (pet: Pet) => ({
    id: pet.id,
    name: pet.name,
    species: pet.species,
    type: pet.type,
    age: pet.age,
    gender: pet.gender,
    profile_picture: pet.profile_picture,
    status: pet.status,
    description: pet.description,
    shelter: pet.shelter,
  });

  // Loading & Error
  if (loading) {
    return (
      <div
        className="flex min-h-screen duration-300 lg:mb-16 mb-10"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
      >
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

        {/* Main content with TopNavBar */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavBar />
          <div className={`flex-1 pt-16 transition-all duration-300 ${isOpen ? 'ml-52 lg:ml-52' : 'ml-0 lg:ml-20'}`}>
            <div className="flex items-center justify-center h-full">
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="text-3xl animate-spin"
                style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen duration-300"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
      >
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

        {/* Main content with TopNavBar */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavBar />
          <div className={`flex-1 pt-16 transition-all duration-300 ${isOpen ? 'ml-52 lg:ml-52' : 'ml-0 lg:ml-20'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FontAwesomeIcon 
                  icon={faExclamationTriangle} 
                  className="text-4xl mb-4"
                  style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
                />
                <p style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen duration-300"
      style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
    >
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      {/* Main content with TopNavBar */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavBar />

        {/* Page content */}
        <div className={`flex-1 pt-16 transition-all duration-300 ${isOpen ? 'ml-52 lg:ml-52' : 'ml-0 lg:ml-20'}`}>
          <div className="w-full px-4 md:px-6 lg:px-8">
            <div className="max-w-[1920px] mx-auto">
              <div
                className="rounded-2xl shadow-sm overflow-hidden duration-300"
                style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.3)" : "white" }}
              >
                {/* Header */}
                <div
                  className="p-5 md:p-8 border-b duration-300"
                  style={{ borderColor: isDarkMode ? "#73655B" : "#e5e7eb" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2
                      className="text-2xl font-semibold duration-300"
                      style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                    >
                      Pets list
                      <span
                        className="text-base font-normal ml-3 duration-300"
                        style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
                      >
                        ({filteredPets.length})
                      </span>
                    </h2>

                    <PetFilters
                      isFilterOpen={isFilterOpen}
                      setIsFilterOpen={setIsFilterOpen}
                      selectedFilters={selectedFilters}
                      setSelectedFilters={setSelectedFilters}
                      speciesOptions={speciesOptions}
                      ageOptions={ageOptions}
                      openSections={openSections}
                      toggleSection={toggleSection}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-8">
                  {filteredPets.length > 0 ? (
                    <>
                      {/* Pet Grid */}
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {currentPets.map(pet => (
                          <PetCard key={pet.id} props={adaptPetForCard(pet)} />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div
                          className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t duration-300"
                          style={{ borderColor: isDarkMode ? "#73655B" : "#e5e7eb" }}
                        >
                          <p
                            className="text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
                          >
                            Page {currentPage} sur {totalPages}
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 rounded-lg border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white",
                                borderColor: isDarkMode ? "#73655B" : "#ddd",
                                color: isDarkMode ? "#F7F5EA" : "#666"
                              }}
                              onMouseEnter={(e) => {
                                if (currentPage !== 1) {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f8f8f8";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== 1) {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white";
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                            <button
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 rounded-lg border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white",
                                borderColor: isDarkMode ? "#73655B" : "#ddd",
                                color: isDarkMode ? "#F7F5EA" : "#666"
                              }}
                              onMouseEnter={(e) => {
                                if (currentPage !== totalPages) {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f8f8f8";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (currentPage !== totalPages) {
                                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white";
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <p
                        className="text-lg mb-6 duration-300"
                        style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
                      >
                        Aucun animal trouvé avec ces filtres.
                      </p>
                      <button
                        onClick={() => setSelectedFilters({ species: [], ageRange: [] })}
                        className="px-6 py-3 text-white rounded-lg transition-colors duration-300"
                        style={{ backgroundColor: isDarkMode ? "#D9915B" : "#D29059" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? "#C77D47" : "#c57a45";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? "#D9915B" : "#D29059";
                        }}
                      >
                        Effacer les filtres
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetsPage;