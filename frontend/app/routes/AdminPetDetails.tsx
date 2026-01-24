import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faUpload,
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import { useTheme } from '../contexts/themeContext';
import { petsService } from '../api/petsService';
import type { Pet } from '../api/petsService';

const AdminPetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    type: '',
    age: '',
    gender: 'male',
    status: 'available',
    description: '',
    profile_picture: ''
  });

  useEffect(() => {
    if (id) {
      fetchPet();
    }
  }, [id]);
const API_URL = import.meta.env.VITE_API_URL;

  const fetchPet = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/admin/pets/${id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data: Pet = await response.json();
      
      setPet(data);
      setFormData({
        name: data.name,
        species: data.species || '',
        type: data.type || '',
        age: data.age?.toString() || '',
        gender: data.gender,
        status: data.status,
        description: data.description,
        profile_picture: data.profile_picture || ''
      });
      setImagePreview(data.profile_picture || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load pet');
      console.error('Error fetching pet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSaving(true);

  try {
    const token = localStorage.getItem('token');
    
    // Use FormData for file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('gender', formData.gender);
    submitData.append('status', formData.status);
    submitData.append('description', formData.description);
    submitData.append('_method', 'PUT'); // Laravel method spoofing for FormData
    
    // Only append if values exist
    if (formData.species) submitData.append('species', formData.species);
    if (formData.type) submitData.append('type', formData.type);
    if (formData.age) submitData.append('age', formData.age);
    
    // Append new image file if changed
    if (imageFile) {
      submitData.append('profile_picture', imageFile);
    }

    const response = await fetch(`${API_URL}/admin/pets/${id}`, {
      method: 'POST', // Use POST with _method spoofing for file uploads
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type
      },
      body: submitData
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors) {
        const errorMessages = Object.values(errorData.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(errorData.message || 'Failed to update pet');
    }

    setSuccessMessage('Pet updated successfully!');
    setTimeout(() => {
      navigate('/admin/pets');
    }, 1500);
  } catch (err: any) {
    console.error('Error updating pet:', err);
    setError(err.message || 'Failed to update pet. Please try again.');
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div 
          className="flex min-h-screen items-center justify-center" 
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center">
            <FontAwesomeIcon 
              icon={faSpinner} 
              spin 
              className="text-5xl mb-4"
              style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
            />
            <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>Loading pet details...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !pet) {
    return (
      <AuthenticatedLayout>
        <div 
          className="flex min-h-screen items-center justify-center p-5" 
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center max-w-md">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="text-5xl mb-4"
              style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
            />
            <h3 
              className="text-2xl font-bold mb-3"
              style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
            >
              Pet Not Found
            </h3>
            <p 
              className="mb-6"
              style={{ color: isDarkMode ? "#F7F5EA" : "#666" }}
            >
              {error}
            </p>
            <button
              onClick={() => navigate('/admin/pets')}
              className="px-6 py-3 rounded-lg font-medium transition-colors duration-300"
              style={{ backgroundColor: isDarkMode ? "#D9915B" : "#D29059", color: "#FFFFFF" }}
            >
              Back to Pets
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div 
        className="min-h-screen" 
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
      >
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => navigate('/admin/pets')}
              className="mb-6 flex items-center gap-2 transition-colors duration-200"
              style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#D9915B" : "#D29059";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDarkMode ? "#cfcac4" : "#666";
              }}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Pets
            </button>

            {/* Success Message */}
            {successMessage && (
              <div
                className="mb-6 p-4 rounded-xl flex items-start gap-3 shadow-lg"
                style={{
                  backgroundColor: isDarkMode ? "rgba(34,197,94,0.2)" : "#d1fae5",
                  border: `1px solid ${isDarkMode ? "rgba(34,197,94,0.3)" : "#6ee7b7"}`
                }}
              >
                <FontAwesomeIcon 
                  icon={faCheckCircle} 
                  className="text-xl mt-0.5"
                  style={{ color: isDarkMode ? "#6ee7b7" : "#059669" }}
                />
                <p style={{ color: isDarkMode ? "#6ee7b7" : "#059669", fontWeight: 500 }}>
                  {successMessage}
                </p>
              </div>
            )}

            {/* Form Container */}
            <div
              className="rounded-2xl shadow-xl overflow-hidden"
              style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.3)" : "white" }}
            >
              {/* Header */}
              <div
                className="p-6 md:p-8 border-b"
                style={{ borderColor: isDarkMode ? "#73655B" : "#e5e7eb" }}
              >
                <h1
                  className="text-3xl font-bold"
                  style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                >
                  Edit Pet Details
                </h1>
                <p
                  className="text-sm mt-1"
                  style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                >
                  Update information for {pet?.name}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                {/* Error Message */}
                {error && (
                  <div
                    className="p-4 rounded-lg"
                    style={{ 
                      backgroundColor: isDarkMode ? "rgba(220, 38, 38, 0.1)" : "#fee2e2",
                      color: isDarkMode ? "#fca5a5" : "#dc2626"
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Image Upload Section */}
                <div>
                  <label
                    className="block text-lg font-semibold mb-4"
                    style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                  >
                    Profile Picture
                  </label>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Current Image Preview */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-48 h-48 rounded-xl overflow-hidden"
                        style={{ 
                          backgroundColor: isDarkMode ? "#2A2724" : "#f3f4f6",
                          border: `2px solid ${isDarkMode ? "#73655B" : "#e5e7eb"}`
                        }}
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Pet preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span style={{ color: isDarkMode ? "#73655B" : "#9ca3af" }}>
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Button */}
                    <div className="flex-1">
                      <div
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200"
                        style={{ 
                          borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                          backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.1)" : "#f9fafb"
                        }}
                        onClick={() => document.getElementById('image-upload')?.click()}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = isDarkMode ? "#D9915B" : "#D29059";
                          e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(217, 145, 91, 0.1)" : "#fef3dd";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isDarkMode ? "#73655B" : "#d1d5db";
                          e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.1)" : "#f9fafb";
                        }}
                      >
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={saving}
                        />
                        
                        <FontAwesomeIcon
                          icon={faUpload}
                          className="text-4xl mb-3"
                          style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
                        />
                        <p
                          className="font-medium mb-1"
                          style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                        >
                          Click to upload new image
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                        >
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* Species */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Species
                    </label>
                    <input
                      type="text"
                      value={formData.species}
                      onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                      placeholder="e.g., Dog, Cat"
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      disabled={saving}
                    />
                  </div>

                  {/* Type/Breed */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Type/Breed
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      placeholder="e.g., Labrador, Persian"
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      disabled={saving}
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Age (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      disabled={saving}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      required
                      disabled={saving}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                    >
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                        color: isDarkMode ? "#F7F5EA" : "#333",
                        borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                      }}
                      required
                      disabled={saving}
                    >
                      <option value="available">Available</option>
                      <option value="adopted">Adopted</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                      color: isDarkMode ? "#F7F5EA" : "#333",
                      borderColor: isDarkMode ? "#73655B" : "#d1d5db"
                    }}
                    placeholder="Tell us about this pet..."
                    required
                    disabled={saving}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    style={{ 
                      backgroundColor: isDarkMode ? "#D9915B" : "#D29059",
                      color: "#FFFFFF"
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? "#C77D47" : "#c57a45";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? "#D9915B" : "#D29059";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} />
                        Save Changes
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/pets')}
                    disabled={saving}
                    className="px-8 py-4 rounded-lg font-bold border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                      color: isDarkMode ? "#F7F5EA" : "#333",
                      backgroundColor: "transparent"
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default AdminPetDetails;