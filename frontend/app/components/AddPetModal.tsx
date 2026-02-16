import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUpload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../contexts/themeContext';

interface AddPetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPetModal: React.FC<AddPetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    type: '',
    age: '',
    gender: 'male',
    status: 'available',
    description: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
  setLoading(true);

  try {
    const token = localStorage.getItem('token');
    
    // Create FormData for multipart/form-data
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('gender', formData.gender);
    submitData.append('status', formData.status);
    submitData.append('description', formData.description);
    
    // Only append if values exist
    if (formData.species) submitData.append('species', formData.species);
    if (formData.type) submitData.append('type', formData.type);
    if (formData.age) submitData.append('age', formData.age);
    
    // Append the actual file, not base64
    if (imageFile) {
      submitData.append('profile_picture', imageFile);
    }

    const response = await fetch('http://127.0.0.1:8000/api/admin/pets', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary for FormData
      },
      body: submitData
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Handle validation errors
      if (errorData.errors) {
        const errorMessages = Object.values(errorData.errors).flat().join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(errorData.message || 'Failed to create pet');
    }

    // Reset form
    setFormData({
      name: '',
      species: '',
      type: '',
      age: '',
      gender: 'male',
      status: 'available',
      description: ''
    });
    setImagePreview(null);
    setImageFile(null);
    
    onSuccess();
  } catch (err: any) {
    console.error('Error creating pet:', err);
    setError(err.message || 'Failed to create pet. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        species: '',
        type: '',
        age: '',
        gender: 'male',
        status: 'available',
        description: ''
      });
      setImagePreview(null);
      setImageFile(null);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 p-6 border-b flex items-center justify-between"
          style={{ 
            backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
            borderColor: isDarkMode ? "#73655B" : "#e5e7eb"
          }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
          >
            Add New Pet
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ 
              color: isDarkMode ? "#F7F5EA" : "#666",
              backgroundColor: "transparent"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Image Upload */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
            >
              Profile Picture
            </label>
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200"
              style={{ 
                borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.1)" : "#f9fafb"
              }}
              onClick={() => document.getElementById('image-upload')?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? "#D9915B" : "#D29059";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? "#73655B" : "#d1d5db";
              }}
            >
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                data-cy="pet-image-upload"
              />
              
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p
                    className="text-sm"
                    style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                  >
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <FontAwesomeIcon
                    icon={faUpload}
                    className="text-4xl"
                    style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
                  >
                    Click to upload an image
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                  >
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-name"
              />
            </div>

            {/* Species */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-species"
              />
            </div>

            {/* Type/Breed */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-type"
              />
            </div>

            {/* Age */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-age"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-gender"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                disabled={loading}
                data-cy="pet-status"
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
              className="block text-sm font-medium mb-2"
              style={{ color: isDarkMode ? "#F7F5EA" : "#333" }}
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 resize-none"
              style={{
                backgroundColor: isDarkMode ? "#36332E" : "#FFFFFF",
                color: isDarkMode ? "#F7F5EA" : "#333",
                borderColor: isDarkMode ? "#73655B" : "#d1d5db"
              }}
              placeholder="Tell us about this pet..."
              required
              disabled={loading}
              data-cy="pet-description"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: isDarkMode ? "#D9915B" : "#D29059",
                color: "#FFFFFF"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? "#C77D47" : "#c57a45";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? "#D9915B" : "#D29059";
                }
              }}
              data-cy="create-pet-submit"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Creating...
                </>
              ) : (
                'Create Pet'
              )}
            </button>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold border transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                color: isDarkMode ? "#F7F5EA" : "#333",
                backgroundColor: "transparent"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.1)" : "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
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
  );
};

export default AddPetModal;