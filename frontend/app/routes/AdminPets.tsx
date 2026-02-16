'use client';

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { petsService } from "../api/petsService";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import AddPetModal from "../components/AddPetModal";
import AdminPetCard from "../components/AdminPetCard";
import { useTheme } from "../contexts/themeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEllipsisV,
  faEdit,
  faTrash,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faExclamationCircle,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { Pet } from "../api/petsService";

// Confirmation Modal Component
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  petName: string;
  isDarkMode: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  petName,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all duration-300 ${isDarkMode ? "bg-[#2A2724]" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-[#36332E] text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="flex justify-center mb-4">
          <div
            className={`p-4 rounded-full ${isDarkMode ? "bg-red-500/20" : "bg-red-100"}`}
          >
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="text-3xl"
              style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
            />
          </div>
        </div>

        <div className="text-center">
          <h3
            className={`text-xl font-semibold mb-3 ${isDarkMode ? "text-[#F5F3ED]" : "text-gray-900"}`}
          >
            Delete {petName}?
          </h3>

          <p
            className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Are you sure you want to delete{" "}
            <span className="font-semibold">{petName}</span>? This action cannot
            be undone and all associated data will be permanently removed.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${isDarkMode ? "bg-[#36332E] text-gray-300 hover:bg-[#404040]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-300 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete Pet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPets: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    petId: number | null;
    petName: string;
  }>({
    isOpen: false,
    petId: null,
    petName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8; // 2 rows of 4 items on xl screens

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId === null) return;

      const menuElement = menuRefs.current.get(openMenuId);
      const target = event.target as Node;

      if (menuElement && !menuElement.contains(target)) {
        let isMenuButtonClick = false;
        const allMenuButtons = document.querySelectorAll("[data-menu-button]");
        allMenuButtons.forEach((button) => {
          if (button.contains(target)) {
            const petId = parseInt(button.getAttribute("data-pet-id") || "");
            if (petId === openMenuId) {
              isMenuButtonClick = true;
            }
          }
        });

        if (!isMenuButtonClick) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const data = await petsService.getAdminPets();
      setPets(data);
      setError(null);
    } catch (err) {
      setError("Failed to load pets");
      console.error("Error fetching pets:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPetSuccess = () => {
    setShowAddModal(false);
    fetchPets();
    showSuccessMessage("Pet added successfully!");
  };

  const handleEdit = (petId: number) => {
    navigate(`/admin/pets/${petId}/edit`);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (petId: number, petName: string) => {
    setOpenMenuId(null);
    setDeleteModal({
      isOpen: true,
      petId,
      petName,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.petId) return;

    try {
      setIsDeleting(true);
      await petsService.deletePet(deleteModal.petId);
      fetchPets();
      showSuccessMessage(
        `${deleteModal.petName} has been deleted successfully.`
      );
    } catch (err) {
      console.error("Error deleting pet:", err);
      showSuccessMessage(
        `Failed to delete ${deleteModal.petName}. Please try again.`
      );
    } finally {
      setIsDeleting(false);
      setDeleteModal({
        isOpen: false,
        petId: null,
        petName: "",
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      petId: null,
      petName: "",
    });
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const toggleMenu = (petId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setOpenMenuId(openMenuId === petId ? null : petId);
  };

  // Pagination calculations
  const totalPages = Math.ceil(pets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPets = pets.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div
          className="flex items-center justify-center min-h-screen duration-300"
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-5xl mb-4"
              style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
            />
            <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>
              Loading pets...
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div
          className="flex min-h-screen items-center justify-center duration-300"
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-5xl mb-4"
              style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
            />
            <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>{error}</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div
        className="min-h-screen duration-300"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        data-cy="admin-pets"
      >
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-[1920px] mx-auto">
            {/* Success Message */}
            {successMessage && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 shadow-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-[rgba(34,197,94,0.2)] border border-green-500/30"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className={`text-xl mt-0.5 ${isDarkMode ? "text-green-400" : "text-green-600"}`}
                />
                <div className="flex-1">
                  <p
                    className={`font-medium ${isDarkMode ? "text-green-300" : "text-green-800"}`}
                  >
                    {successMessage}
                  </p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className={`text-xl ${isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-700"}`}
                >
                  ×
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2
                    className="text-2xl font-semibold duration-300"
                    style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                  >
                    Manage Pets
                    <span
                      className="text-base font-normal ml-3 duration-300"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
                    >
                      ({pets.length})
                    </span>
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                  >
                    Add, edit, and manage pets in your shelter
                  </p>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                  style={{
                    backgroundColor: isDarkMode ? "#D9915B" : "#D29059",
                    color: "#FFFFFF",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#C77D47"
                      : "#c57a45";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? "#D9915B"
                      : "#D29059";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  data-cy="add-pet-button"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add New Pet
                </button>
              </div>
            </div>

            {/* Content */}
            <div>
              {pets.length > 0 ? (
                <>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8" data-cy="pets-list">
                    {currentPets.map((pet) => (
                      <AdminPetCard
                        key={pet.id}
                        pet={pet}
                        isDarkMode={isDarkMode}
                        isMenuOpen={openMenuId === pet.id}
                        onToggleMenu={toggleMenu}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={previousPage}
                        disabled={currentPage === 1}
                        className={`p-3 rounded-lg transition-all duration-300 ${
                          currentPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-md"
                        }`}
                        style={{
                          backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
                          color: isDarkMode ? "#F7F5EA" : "#333",
                          border: `1px solid ${isDarkMode ? "#73655B" : "#e5e7eb"}`,
                        }}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                              currentPage === page ? "shadow-md" : ""
                            }`}
                            style={{
                              backgroundColor:
                                currentPage === page
                                  ? isDarkMode
                                    ? "#D9915B"
                                    : "#D29059"
                                  : isDarkMode
                                    ? "#2A2724"
                                    : "#FFFFFF",
                              color:
                                currentPage === page
                                  ? "#FFFFFF"
                                  : isDarkMode
                                    ? "#F7F5EA"
                                    : "#333",
                              border: `1px solid ${
                                currentPage === page
                                  ? "transparent"
                                  : isDarkMode
                                    ? "#73655B"
                                    : "#e5e7eb"
                              }`,
                            }}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`p-3 rounded-lg transition-all duration-300 ${
                          currentPage === totalPages
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:shadow-md"
                        }`}
                        style={{
                          backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
                          color: isDarkMode ? "#F7F5EA" : "#333",
                          border: `1px solid ${isDarkMode ? "#73655B" : "#e5e7eb"}`,
                        }}
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <p
                    className="text-lg mb-6"
                    style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
                  >
                    No pets found. Add your first pet!
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 rounded-lg font-medium transition-colors duration-300"
                    style={{
                      backgroundColor: isDarkMode ? "#D9915B" : "#D29059",
                      color: "#FFFFFF",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? "#C77D47"
                        : "#c57a45";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? "#D9915B"
                        : "#D29059";
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Your First Pet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Pet Modal */}
      <AddPetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddPetSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        petName={deleteModal.petName}
        isDarkMode={isDarkMode}
      />

      {/* Loading Overlay for Delete */}
      {isDeleting && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className={`p-6 rounded-xl ${isDarkMode ? "bg-[#2A2724]" : "bg-white"} shadow-2xl`}
          >
            <div className="flex items-center gap-4">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-2xl"
                style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
              />
              <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                Deleting {deleteModal.petName}...
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
};

export default AdminPets;
