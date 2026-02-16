import { useEffect, useState } from 'react';
import api from '~/api/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import AuthenticatedLayout from '~/components/AuthenticatedLayout';
import { useTheme } from '~/contexts/themeContext';

interface Pet {
  id: number;
  name: string;
  species: string | null;
}

interface AdoptionRequest {
  id: number;
  pet_id: number;
  pet?: Pet;
  status: 'pending' | 'approved' | 'denied' | 'canceled';
  created_at: string;
  form_data: any;
}

export default function Requests() {
  const { isDarkMode } = useTheme();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/adoptions');
      
      // Fetch pet details for each request
      const requestsWithPets = await Promise.all(
        response.data.map(async (req: AdoptionRequest) => {
          try {
            const petResponse = await api.get(`/api/pets/${req.pet_id}`);
            return { ...req, pet: petResponse.data };
          } catch {
            return req;
          }
        })
      );
      
      setRequests(requestsWithPets);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load adoption requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!confirm('Are you sure you want to cancel this adoption request? This action cannot be undone.')) return;
    
    try {
      await api.put(`/api/adoptions/${requestId}/cancel`);
      
      // Refresh the list
      await fetchRequests();
      setShowOptionsMenu(null);
      alert('Request canceled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusStyle = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'pending':
          return { bg: 'rgba(217, 144, 91, 0.2)', text: '#D9915B', label: 'En Attente' };
        case 'approved':
          return { bg: 'rgba(5, 150, 105, 0.2)', text: '#10b981', label: 'Acceptée' };
        case 'denied':
          return { bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171', label: 'Rejetée' };
        case 'canceled':
          return { bg: 'rgba(204, 71, 104, 0.2)', text: '#f472b6', label: 'Annulée' };
        default:
          return { bg: 'rgba(115, 101, 91, 0.2)', text: '#9ca3af', label: status };
      }
    } else {
      switch (status) {
        case 'pending':
          return { bg: '#ffeee1', text: '#d29059', label: 'En Attente' };
        case 'approved':
          return { bg: '#d1fae5', text: '#059669', label: 'Acceptée' };
        case 'denied':
          return { bg: '#fee2e2', text: '#dc2626', label: 'Rejetée' };
        case 'canceled':
          return { bg: '#ffdae3', text: '#cc4768', label: 'Annulée' };
        default:
          return { bg: '#f3f4f6', text: '#6b7280', label: status };
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredRequests = requests.filter(req =>
    req.id.toString().includes(searchTerm) || 
    req.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.pet?.species?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const capitalizeFirst = (str: string | null | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div
          className="flex justify-center items-center h-screen duration-300"
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div 
            className="animate-spin rounded-full h-12 w-12 border-t-3 border-b-3" 
            style={{ borderColor: isDarkMode ? "#D9915B" : "#d97706" }} 
          />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div
        className="p-8 duration-300 min-h-screen"
        style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2 duration-300"
              style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
            >
              Requests
            </h1>
            <p
              className="text-sm duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
            >
              View all pet requests and their status
            </p>
          </div>

          {/* Main Content Card */}
          <div
            className="rounded-2xl p-8 shadow-sm duration-300"
            style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.3)" : "white" }}
          >
            <h2
              className="text-xl font-bold mb-6 duration-300"
              style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
            >
              Demandes d'adoption
            </h2>

            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search for a request"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#D9915B] transition-colors duration-300"
                  style={{
                    borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                    color: isDarkMode ? "#F7F5EA" : "#1f2937",
                    backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white"
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="mb-6 p-4 rounded-lg duration-300"
                style={{
                  backgroundColor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "#fee2e2",
                  borderColor: isDarkMode ? "#dc2626" : "#fecaca",
                  borderWidth: 1
                }}
              >
                <p style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full" data-cy="requests-table">
                <thead>
                  <tr
                    className="border-b duration-300"
                    style={{ borderColor: isDarkMode ? "#73655B" : "#e5e7eb" }}
                  >
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Request ID
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Species
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Pet Name
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Date
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Status
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      View Pet
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium duration-300"
                      style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                    >
                      Option
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 duration-300"
                        style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                      >
                        No adoption requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => {
                      const statusStyle = getStatusStyle(request.status);
                      const isPending = request.status === 'pending';

                      return (
                        <motion.tr
                          key={request.id}
                          className="border-b transition-colors duration-300"
                          style={{
                            borderColor: isDarkMode ? "#73655B" : "#f3f4f6"
                          }}
                          whileHover={{
                            backgroundColor: isDarkMode ? 'rgba(115, 101, 91, 0.15)' : 'rgba(0,0,0,0.02)'
                          }}
                        >
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                          >
                            #{request.id}
                          </td>
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                          >
                            {capitalizeFirst(request.pet?.species) || 'Unknown'}
                          </td>
                          <td
                            className="py-4 px-4 text-sm font-medium duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                          >
                            {request.pet?.name || 'Unknown Pet'}
                          </td>
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                          >
                            {formatDate(request.created_at)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.text
                              }}
                            >
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              to={`/pet/${request.pet_id}`}
                              className="px-4 py-1 rounded-lg border text-sm transition-all inline-block duration-300"
                              style={{
                                borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                                color: isDarkMode ? "#F7F5EA" : "#1f2937",
                                backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.4)" : "#f9fafb";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white";
                              }}
                            >
                              View
                            </Link>
                          </td>
                          <td className="py-4 px-4 relative">
                            <button
                              onClick={() => setShowOptionsMenu(showOptionsMenu === request.id ? null : request.id)}
                              className="p-1 transition-colors duration-300 hover:opacity-70"
                              style={{ color: isDarkMode ? "#F7F5EA" : "#9ca3af" }}
                            >
                              ⋮
                            </button>

                            {/* Options Dropdown */}
                            {showOptionsMenu === request.id && (
                              <div
                                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-10 duration-300"
                                style={{
                                  backgroundColor: isDarkMode ? "rgba(54, 51, 46, 0.95)" : "white",
                                  borderColor: isDarkMode ? "#73655B" : "#e5e7eb"
                                }}
                              >
                                <div className="py-1">
                                  {isPending ? (
                                    <button
                                      onClick={() => handleCancel(request.id)}
                                      className="block w-full text-left px-4 py-2 text-sm transition-colors duration-300"
                                      style={{
                                        color: isDarkMode ? "#fca5a5" : "#dc2626"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(220, 38, 38, 0.15)" : "#fee2e2";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                      }}
                                    >
                                      Cancel Request
                                    </button>
                                  ) : (
                                    <div
                                      className="px-4 py-2 text-sm italic duration-300"
                                      style={{ color: isDarkMode ? "#D9915B" : "#9ca3af" }}
                                    >
                                      No actions available for {request.status} requests
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <p
                className="text-sm duration-300"
                style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
              >
                1 - {filteredRequests.length} of {requests.length}
              </p>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border transition-all duration-300"
                  style={{
                    borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                    color: isDarkMode ? "#F7F5EA" : "#6b7280",
                    backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.4)" : "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white";
                  }}
                >
                  ←
                </button>
                <button
                  className="px-3 py-1 rounded border transition-all duration-300"
                  style={{
                    borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                    color: isDarkMode ? "#F7F5EA" : "#6b7280",
                    backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.4)" : "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white";
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}