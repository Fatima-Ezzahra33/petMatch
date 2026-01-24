import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faHeart as faHeartRegular,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../components/SideBar';
import TopNavBar from '~/components/TopNavBar';
import AdoptionFormModal from '~/components/AdoptionForm';
import { UserContext } from '~/contexts/UserContext';
import { useTheme } from '~/contexts/themeContext';

interface Pet {
  id: number;
  name: string;
  profile_picture: string;
  species: string;
  type: string;
  age: number;
  gender: string;
  description: string;
  eye_color?: string;
  coat_color?: string;
  shelter: {
    id: number;
    name: string;
    city: string;
  };
}

const PetProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useContext(UserContext)!;
  const { isDarkMode } = useTheme();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleSidebar = () => setIsOpen(prev => !prev);

  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const API_URL = `${import.meta.env.VITE_API_URL}/pets/${id}`;

  const isFavorite = pet ? favorites.some((fav: any) => fav.id === pet.id) : false;

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL, {
          headers: {
            Accept: 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) throw new Error(`Erreur ${response.status}`);
        const data: Pet = await response.json();
        setPet(data);
      } catch (err: any) {
        setError(err.message || "Impossible de charger l'animal");
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id, token]);

  const handleToggleFavorite = async () => {
    if (!pet) return;
    await toggleFavorite(pet.id, isFavorite);
  };

  const handleAdoptionSuccess = () => {
    setSuccessMessage(`Your adoption request for ${pet?.name} has been submitted successfully! We'll review it and contact you soon.`);
    
    // Auto-hide success message after 8 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 8000);
  };

  const handleAdoptionError = (error: string) => {
    // Error is already shown in the modal, so we don't need to do anything here
    console.error('Adoption error:', error);
  };

  /* ===================== LOADING ===================== */
  if (loading) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#F7F5EA]'}`}>
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <TopNavBar />
          <div className="flex-1 flex items-center justify-center">
            <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#D29059" />
          </div>
        </div>
      </div>
    );
  }

  /* ===================== ERROR ===================== */
  if (error || !pet) {
    return (
      <div className={`flex min-h-screen ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#E5E5E5]'}`}>
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 flex flex-col">
          <TopNavBar />
          <div className="flex-1 flex items-center justify-center p-5">
            <div
              className={`text-center p-10 rounded-2xl shadow-xl max-w-md transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-[rgba(115,101,91,0.3)] text-[#F5F3ED]'
                  : 'bg-white text-[#333]'
              }`}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} size="3x" color="#ff6b6b" className="mb-4" />
              <h3 className="text-2xl font-bold mb-3">Animal non trouvé</h3>
              <p className={isDarkMode ? 'text-[#fca5a5] mb-6' : 'text-[#666] mb-6'}>
                {error || "Cet animal n'existe pas ou a été supprimé."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="px-8 py-3 bg-[#D29059] text-white rounded-xl hover:bg-[#c57a45] transition"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ===================== MAIN ===================== */
  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col">
        <TopNavBar />

        <div className={`flex-1 transition-all duration-300 ${isOpen ? 'lg:ml-52' : 'lg:ml-0'}`}>
          <div className="p-5 md:p-8 lg:p-10 max-w-7xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className={`mb-8 flex items-center gap-3 text-lg font-medium transition-colors ${
                isDarkMode ? 'text-[#cfcac4] hover:text-[#D29059]' : 'text-[#666] hover:text-[#D29059]'
              }`}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Retour à la liste
            </button>

            {/* Success Message */}
            {successMessage && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 shadow-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-[rgba(34,197,94,0.2)] border border-green-500/30'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <FontAwesomeIcon 
                  icon={faCheckCircle} 
                  className={`text-xl mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                />
                <div className="flex-1">
                  <p 
                    className={`font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}
                  >
                    {successMessage}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className={`text-xl ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                >
                  ×
                </button>
              </div>
            )}

            <div
              className={`rounded-3xl shadow-xl overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-[rgba(115,101,91,0.3)]' : 'bg-white'
              }`}
            >
              <div className="p-6 md:p-10 lg:p-12">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10">
                  <div>
                    <h1
                      className={`text-4xl md:text-5xl font-bold ${
                        isDarkMode ? 'text-[#F5F3ED]' : 'text-[#333]'
                      }`}
                    >
                      {pet.name}
                    </h1>
                    <p className={`text-xl mt-2 ${isDarkMode ? 'text-[#cfcac4]' : 'text-[#666]'}`}>
                      {pet.gender === 'male' ? 'Mâle' : 'Femelle'} • {pet.age} an{pet.age > 1 ? 's' : ''}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleFavorite}
                    className={`p-4 rounded-2xl transition-all ${
                      isDarkMode
                        ? 'bg-[rgba(115,101,91,0.3)] hover:bg-[#73655B]'
                        : 'bg-[#f9f9f9] hover:bg-[#FEF3DD]'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={isFavorite ? faHeartSolid : faHeartRegular}
                      className={`text-4xl ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                    />
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
                  <img
                    src={pet.profile_picture || '/placeholder-pet.jpg'}
                    alt={pet.name}
                    className="w-full h-[500px] object-cover rounded-3xl shadow-2xl"
                  />

                  <div className="space-y-8">
                    <Section title="Informations">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InfoItem label="Espèce" value={pet.species} />
                        <InfoItem label="Race" value={pet.type || 'Non spécifiée'} />
                        <InfoItem label="Âge" value={`${pet.age} an${pet.age > 1 ? 's' : ''}`} />
                        <InfoItem label="Sexe" value={pet.gender === 'male' ? 'Mâle' : 'Femelle'} />
                        {pet.coat_color && <InfoItem label="Pelage" value={pet.coat_color} />}
                        {pet.eye_color && <InfoItem label="Yeux" value={pet.eye_color} />}
                      </div>
                    </Section>

                    <Section title="Refuge">
                      <div
                        className={`p-5 rounded-2xl ${
                          isDarkMode
                            ? 'bg-[rgba(115,101,91,0.3)] text-[#F7F5EA]'
                            : 'bg-[#f9f9f9] text-[#333]'
                        }`}
                      >
                        <p className="font-medium">{pet.shelter.name}</p>
                        <p className={isDarkMode ? 'text-[#cfcac4]' : 'text-[#666]'}>
                          {pet.shelter.city}
                        </p>
                      </div>
                    </Section>

                    <Section title="À propos">
                      <p className={isDarkMode ? 'text-[#F7F5EA]' : 'text-[#555]'}>
                        {pet.description}
                      </p>
                    </Section>

                    <button 
                      onClick={() => setIsAdoptionModalOpen(true)}
                      className="w-full py-5 bg-gradient-to-r from-[#D29059] to-[#c57a45] text-white text-xl font-bold rounded-2xl hover:scale-105 transition"
                    >
                      Je veux adopter {pet.name}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Form Modal */}
      <AdoptionFormModal
        petId={pet.id}
        petName={pet.name}
        isOpen={isAdoptionModalOpen}
        onClose={() => setIsAdoptionModalOpen(false)}
        onSuccess={handleAdoptionSuccess}
        onError={handleAdoptionError}
      />
    </div>
  );
};

/* ===================== HELPERS ===================== */

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { isDarkMode } = useTheme();
  return (
    <div>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-[#F7F5EA]' : 'text-[#333]'}`}>
        {title}
      </h3>
      {children}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { isDarkMode } = useTheme();
  return (
    <div>
      <p className={`text-sm mb-1 ${isDarkMode ? 'text-[#cfcac4]' : 'text-[#999]'}`}>{label}</p>
      <p
        className={`px-4 py-3 rounded-xl font-medium ${
          isDarkMode
            ? 'bg-[rgba(115,101,91,0.3)] text-[#F7F5EA] border border-[#73655B]'
            : 'bg-[#f9f9f9] text-[#333]'
        }`}
      >
        {value}
      </p>
    </div>
  );
};

export default PetProfile;