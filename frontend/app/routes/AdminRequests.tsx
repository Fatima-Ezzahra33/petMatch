import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { petsService } from '../api/petsService';
import type { AdoptionApplication } from '../api/petsService';
import AuthenticatedLayout from '../components/AuthenticatedLayout';
import { useTheme } from '../contexts/themeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faCheck,
  faXmark,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

const AdminRequests: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<AdoptionApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'approve' | 'deny';
    application: AdoptionApplication;
  } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await petsService.getAdminAdoptionApplications();
      console.log('Fetched applications:', data);
      setApplications(data);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load adoption applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id: number, status: string) => {
    try {
      await petsService.updateAdoptionApplicationStatus(id, status);
      
      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status } : app
        )
      );
      
      showSuccessMessage(`Application ${status} successfully!`);
      setShowDetailsModal(false);
      setShowActionModal(false);
      setShowOptionsMenu(null);
      setPendingAction(null);
    } catch (err: any) {
      console.error('Error updating application status:', err);
      alert(err.message || 'Failed to update application status');
    }
  };

  const handleApprove = (application: AdoptionApplication) => {
    setPendingAction({
      type: 'approve',
      application
    });
    setShowActionModal(true);
    setShowOptionsMenu(null);
  };

  const handleDeny = (application: AdoptionApplication) => {
    setPendingAction({
      type: 'deny',
      application
    });
    setShowActionModal(true);
    setShowOptionsMenu(null);
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    const { type, application } = pendingAction;
    const status = type === 'approve' ? 'approved' : 'denied';
    updateApplicationStatus(application.id, status);
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const getStatusStyle = (status: string) => {
    if (isDarkMode) {
      switch (status) {
        case 'pending':
          return { bg: 'rgba(217, 144, 91, 0.2)', text: '#D9915B', label: 'Pending' };
        case 'approved':
          return { bg: 'rgba(5, 150, 105, 0.2)', text: '#10b981', label: 'Approved' };
        case 'denied':
          return { bg: 'rgba(220, 38, 38, 0.2)', text: '#f87171', label: 'Denied' };
        case 'canceled':
          return { bg: 'rgba(204, 71, 104, 0.2)', text: '#f472b6', label: 'Canceled' };
        default:
          return { bg: 'rgba(115, 101, 91, 0.2)', text: '#9ca3af', label: status };
      }
    } else {
      switch (status) {
        case 'pending':
          return { bg: '#ffeee1', text: '#d29059', label: 'Pending' };
        case 'approved':
          return { bg: '#d1fae5', text: '#059669', label: 'Approved' };
        case 'denied':
          return { bg: '#fee2e2', text: '#dc2626', label: 'Denied' };
        case 'canceled':
          return { bg: '#ffdae3', text: '#cc4768', label: 'Canceled' };
        default:
          return { bg: '#f3f4f6', text: '#6b7280', label: status };
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const capitalizeFirst = (str: string | null | undefined) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const filteredApplications = applications.filter(app =>
    app.id.toString().includes(searchTerm) ||
    app.pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.pet?.species?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDetailsModal = (application: AdoptionApplication) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
    setShowOptionsMenu(null);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div
          className="flex justify-center items-center h-screen duration-300"
          style={{ backgroundColor: isDarkMode ? "#36332E" : "#F7F5EA" }}
        >
          <div className="text-center">
            <FontAwesomeIcon 
              icon={faSpinner} 
              spin 
              className="text-5xl mb-4"
              style={{ color: isDarkMode ? "#D9915B" : "#D29059" }}
            />
            <p style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}>Loading adoption applications...</p>
          </div>
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
          {/* Success Message */}
          {successMessage && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3 shadow-lg transition-all duration-300"
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
              <div className="flex-1">
                <p style={{ color: isDarkMode ? "#6ee7b7" : "#059669", fontWeight: 500 }}>
                  {successMessage}
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-xl"
                style={{ color: isDarkMode ? "#6ee7b7" : "#059669" }}
              >
                ×
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-8" data-cy="admin-requests-header">
            <h1
              className="text-3xl font-bold mb-2 duration-300"
              style={{ color: isDarkMode ? "#F5F3ED" : "#8B6F47" }}
            >
              Adoption Applications
            </h1>
            <p
              className="text-sm duration-300"
              style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
            >
              Review and manage adoption requests from users
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
              All Applications
            </h2>

            {/* Search */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search by pet name, user name, or species..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border outline-none focus:border-[#D9915B] transition-colors duration-300"
                  style={{
                    borderColor: isDarkMode ? "#73655B" : "#d1d5db",
                    color: isDarkMode ? "#F7F5EA" : "#1f2937",
                    backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "white"
                  }}
                  data-cy="admin-requests-search"
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
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon 
                    icon={faExclamationTriangle}
                    style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}
                  />
                  <p style={{ color: isDarkMode ? "#fca5a5" : "#dc2626" }}>{error}</p>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      Applicant
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
                      Species
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-8 duration-300"
                        style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                      >
                        {applications.length === 0 
                          ? 'No adoption applications found' 
                          : 'No applications match your search'}
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((application) => {
                      const statusStyle = getStatusStyle(application.status);
                      const isPending = application.status === 'pending';

                      return (
                        <motion.tr
                          key={application.id}
                          className="border-b transition-colors duration-300"
                          style={{
                            borderColor: isDarkMode ? "#73655B" : "#f3f4f6"
                          }}
                          whileHover={{
                            backgroundColor: isDarkMode ? 'rgba(115, 101, 91, 0.15)' : 'rgba(0,0,0,0.02)'
                          }}
                          data-cy={`admin-request-row-${application.id}`}
                        >
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                          >
                            #{application.id}
                          </td>
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                          >
                            <div>
                              <div className="font-medium">{application.user?.name || 'Unknown'}</div>
                              <div 
                                className="text-xs"
                                style={{ color: isDarkMode ? "#cfcac4" : "#6B5B4A" }}
                              >
                                {application.user?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td
                            className="py-4 px-4 text-sm font-medium duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                          >
                            {application.pet?.name || 'Unknown Pet'}
                          </td>
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                          >
                            {capitalizeFirst(application.pet?.species) || 'Unknown'}
                          </td>
                          <td
                            className="py-4 px-4 text-sm duration-300"
                            style={{ color: isDarkMode ? "#F7F5EA" : "#6B5B4A" }}
                          >
                            {formatDate(application.created_at)}
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
                              to={`/admin/pets/${application.pet_id}/edit`}
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
                              onClick={() => setShowOptionsMenu(showOptionsMenu === application.id ? null : application.id)}
                              className="p-1 transition-colors duration-300 hover:opacity-70"
                              style={{ color: isDarkMode ? "#F7F5EA" : "#9ca3af" }}
                            >
                              ⋮
                            </button>

                            {/* Options Dropdown */}
                            {showOptionsMenu === application.id && (
                              <div
                                className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 duration-300"
                                style={{
                                  backgroundColor: isDarkMode ? "rgba(54, 51, 46, 0.95)" : "white",
                                  borderColor: isDarkMode ? "#73655B" : "#e5e7eb"
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => openDetailsModal(application)}
                                    className="block w-full text-left px-4 py-2 text-sm transition-colors duration-300"
                                    style={{
                                      color: isDarkMode ? "#F7F5EA" : "#1f2937"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f9fafb";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                  >
                                    View Details
                                  </button>
                                  
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleApprove(application)}
                                        className="block w-full text-left px-4 py-2 text-sm transition-colors duration-300"
                                        style={{
                                          color: isDarkMode ? "#6ee7b7" : "#059669"
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(16, 185, 129, 0.15)" : "#d1fae5";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                      >
                                        Approve Request
                                      </button>
                                      <button
                                        onClick={() => handleDeny(application)}
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
                                        Deny Request
                                      </button>
                                    </>
                                  )}
                                  
                                  {!isPending && (
                                    <div
                                      className="px-4 py-2 text-sm italic duration-300"
                                      style={{ color: isDarkMode ? "#D9915B" : "#9ca3af" }}
                                    >
                                      Application already {application.status}
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
                1 - {filteredApplications.length} of {applications.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 z-10 p-6 border-b flex items-center justify-between"
              style={{ 
                backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
                borderColor: isDarkMode ? "#73655B" : "#e5e7eb"
              }}
            >
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                >
                  Application Details
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                >
                  Request #{selectedApplication.id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg transition-colors duration-200"
                style={{ 
                  color: isDarkMode ? "#F7F5EA" : "#666",
                  backgroundColor: "transparent"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6" data-cy="admin-request-details-modal">
              {/* Basic Info */}
              <div>
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                >
                  Basic Information
                </h3>
                <div
                  className="p-4 rounded-lg space-y-2"
                  style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "#f9fafb" }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Applicant:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }} className="font-medium">
                      {selectedApplication?.user?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Email:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}>
                      {selectedApplication?.user?.email || 'No email'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Pet:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }} className="font-medium">
                      {selectedApplication?.pet?.name || 'Unknown'} ({capitalizeFirst(selectedApplication?.pet?.species) || 'Unknown'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Submitted:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}>
                      {selectedApplication ? formatDate(selectedApplication.created_at) : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Status:</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: selectedApplication ? getStatusStyle(selectedApplication.status).bg : 'transparent',
                        color: selectedApplication ? getStatusStyle(selectedApplication.status).text : '#6b7280'
                      }}
                    >
                      {selectedApplication ? getStatusStyle(selectedApplication.status).label : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Data */}
              {selectedApplication?.form_data && Object.keys(selectedApplication.form_data).length > 0 && (
                <div>
                  <h3
                    className="text-lg font-semibold mb-3"
                    style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                  >
                    Application Form
                  </h3>
                  <div
                    className="p-4 rounded-lg space-y-3"
                    style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "#f9fafb" }}
                  >
                    {Object.entries(selectedApplication.form_data).map(([key, value]) => (
                      <div key={key}>
                        <div
                          className="text-sm font-medium mb-1"
                          style={{ color: isDarkMode ? "#D9915B" : "#8B6F47" }}
                        >
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}
                        >
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedApplication?.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => selectedApplication && handleApprove(selectedApplication)}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#059669";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#10B981";
                    }}
                    data-cy="admin-approve-application-btn"
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Approve Application
                  </button>
                  <button
                    onClick={() => selectedApplication && handleDeny(selectedApplication)}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#EF4444", color: "#FFFFFF" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#dc2626";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#EF4444";
                    }}
                    data-cy="admin-deny-application-btn"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                    Deny Application
                  </button>
                </div>
              )}

              {selectedApplication?.status !== 'pending' && (
                <div
                  className="text-center text-sm italic p-4"
                  style={{ color: isDarkMode ? "#D9915B" : "#9ca3af" }}
                >
                  This application has been {selectedApplication.status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && pendingAction && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowActionModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl"
            style={{ backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-6 border-b"
              style={{ 
                backgroundColor: isDarkMode ? "#2A2724" : "#FFFFFF",
                borderColor: isDarkMode ? "#73655B" : "#e5e7eb"
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-3 rounded-full"
                  style={{ 
                    backgroundColor: pendingAction.type === 'approve' 
                      ? (isDarkMode ? "rgba(16, 185, 129, 0.2)" : "#d1fae5")
                      : (isDarkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2")
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faInfoCircle}
                    className="text-xl"
                    style={{ 
                      color: pendingAction.type === 'approve' 
                        ? (isDarkMode ? "#6ee7b7" : "#059669")
                        : (isDarkMode ? "#fca5a5" : "#dc2626")
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2
                    className="text-xl font-bold"
                    style={{ color: isDarkMode ? "#F5F3ED" : "#333" }}
                  >
                    {pendingAction.type === 'approve' ? 'Approve Application' : 'Deny Application'}
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: isDarkMode ? "#cfcac4" : "#666" }}
                  >
                    Request #{pendingAction.application.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p
                className="mb-6"
                style={{ color: isDarkMode ? "#F7F5EA" : "#4b5563" }}
              >
                Are you sure you want to <strong>{pendingAction.type}</strong> this adoption request?
              </p>
              
              <div
                className="p-4 rounded-lg mb-6"
                style={{ backgroundColor: isDarkMode ? "rgba(115, 101, 91, 0.2)" : "#f9fafb" }}
              >
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Applicant:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }} className="font-medium">
                      {pendingAction.application.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Pet:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }} className="font-medium">
                      {pendingAction.application.pet.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: isDarkMode ? "#D9915B" : "#666" }}>Species:</span>
                    <span style={{ color: isDarkMode ? "#F7F5EA" : "#1f2937" }}>
                      {capitalizeFirst(pendingAction.application.pet.species)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  style={{
                    border: `1px solid ${isDarkMode ? "#73655B" : "#d1d5db"}`,
                    color: isDarkMode ? "#F7F5EA" : "#4b5563",
                    backgroundColor: "transparent"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "rgba(115, 101, 91, 0.3)" : "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  data-cy="admin-action-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: pendingAction.type === 'approve' ? "#10B981" : "#EF4444",
                    color: "#FFFFFF"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = pendingAction.type === 'approve' ? "#059669" : "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = pendingAction.type === 'approve' ? "#10B981" : "#EF4444";
                  }}
                  data-cy={`admin-action-confirm-btn-${pendingAction.type}`}
                >
                  <FontAwesomeIcon icon={pendingAction.type === 'approve' ? faCheck : faXmark} />
                  {pendingAction.type === 'approve' ? 'Approve' : 'Deny'}
                </button>
              </div>

              <p
                className="text-xs text-center mt-4"
                style={{ color: isDarkMode ? "#D9915B" : "#9ca3af" }}
              >
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
};

export default AdminRequests;