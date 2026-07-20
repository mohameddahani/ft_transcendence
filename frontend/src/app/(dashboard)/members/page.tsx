// app/dashboard/members/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/app/providers/ThemeProvider';

// --- Types ---
interface Member {
  id: number;
  col1: string;
  isUser: boolean;
  rating: string;
  fullName: string;
}

// --- API Service ---
const API_BASE = 'https://api-generator.retool.com/pAkdHA';

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API error' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  return response.json();
}

// --- Helper: Get star count from rating string ---
const getStarCount = (rating: string): number => {
  if (!rating) return 0;
  const match = rating.match(/⭐/g);
  return match ? match.length : 0;
};

// --- Main Component ---
export default function MembersPage() {
  const { theme } = useTheme();

  // --- State ---
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    isUser: true,
    rating: '⭐⭐⭐',
  });

  const limit = 10;

  // --- Fetch All Members ---
  const fetchAllMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<Member[]>('/data');
      setAllMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
      setAllMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Initial fetch ---
  useEffect(() => {
    fetchAllMembers();
  }, [fetchAllMembers]);

  // --- Client-side search/filter ---
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) {
      return allMembers;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return allMembers.filter((member) => {
      if (member.fullName?.toLowerCase().includes(searchLower)) {
        return true;
      }
      return false;
    });
  }, [allMembers, searchTerm]);

  // --- Pagination ---
  const totalMembers = filteredMembers.length;
  const totalPages = Math.ceil(totalMembers / limit) || 1;
  
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    return filteredMembers.slice(start, end);
  }, [filteredMembers, currentPage, limit]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- CRUD Operations ---
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await apiClient(`/data/${id}`, { method: 'DELETE' });
      fetchAllMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName,
      isUser: member.isUser,
      rating: member.rating,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      isUser: true,
      rating: '⭐⭐⭐',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        fullName: formData.fullName,
        isUser: formData.isUser,
        rating: formData.rating,
      };

      if (editingMember) {
        await apiClient(`/data/${editingMember.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/data', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      fetchAllMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member. Please try again.');
    }
  };

  // --- Render Stars ---
  const renderStars = (rating: string) => {
    const count = getStarCount(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-sm">
            {i < count ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  // --- Render ---
  return (
    <div className="space-y-4 md:space-y-6" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.primaryDark }}>
            Members
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your gym members
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 text-white px-4 py-2.5 rounded-lg transition text-sm md:text-base w-full sm:w-auto"
          style={{ 
            backgroundColor: theme.primary,
            hover: { backgroundColor: theme.primaryDark }
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryDark}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
        >
          <PlusIcon className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-full md:max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
          style={{ 
            borderColor: theme.primaryLight,
            '--tw-ring-color': theme.primary,
          } as React.CSSProperties}
          onFocus={(e) => e.currentTarget.style.outlineColor = theme.primary}
          onBlur={(e) => e.currentTarget.style.outlineColor = 'transparent'}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {searchTerm ? (
          <p>Found {filteredMembers.length} {filteredMembers.length === 1 ? 'result' : 'results'} for "{searchTerm}"</p>
        ) : (
          <p>Showing {Math.min(currentPage * limit, totalMembers)} of {totalMembers} members</p>
        )}
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primary }}></div>
          </div>
        ) : paginatedMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border" style={{ borderColor: theme.primaryLight }}>
            {searchTerm ? (
              <>No members found for "<strong>{searchTerm}</strong>"</>
            ) : (
              'No members found. Start by adding one!'
            )}
          </div>
        ) : (
          paginatedMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition"
              style={{ borderColor: theme.primaryLight }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
                    >
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-gray-500">ID: {member.id}</p>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                    member.isUser
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {member.isUser ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>{renderStars(member.rating)}</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 rounded-lg transition"
                    style={{ color: theme.primary }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    aria-label="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden"
        style={{ borderColor: theme.primaryLight }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: theme.primary }}></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: theme.primaryLight }}>
                <thead style={{ backgroundColor: `${theme.primary}10` }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y" style={{ borderColor: theme.primaryLight }}>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? (
                          <>No members found for "<strong>{searchTerm}</strong>"</>
                        ) : (
                          'No members found. Start by adding one!'
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                          {member.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.rating || 'No rating'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              member.isUser
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.isUser ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleEdit(member)}
                            className="mr-3 transition"
                            style={{ color: theme.primary }}
                            onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryDark}
                            onMouseLeave={(e) => e.currentTarget.style.color = theme.primary}
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !searchTerm && (
              <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: theme.primaryLight }}>
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * limit + 1} -{' '}
                  {Math.min(currentPage * limit, totalMembers)} of {totalMembers}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    style={{ borderColor: theme.primaryLight }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    style={{ borderColor: theme.primaryLight }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && !searchTerm && (
        <div className="md:hidden flex items-center justify-between px-2 py-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: theme.primaryLight }}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-4 py-2 border rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            style={{ borderColor: theme.primaryLight }}
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Modal - Mobile Optimized */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up md:animate-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  style={{ borderColor: theme.primaryLight }}
                  onFocus={(e) => e.currentTarget.style.outlineColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.outlineColor = 'transparent'}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  value={formData.rating || '⭐⭐⭐'}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rating: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent text-gray-900 text-sm md:text-base"
                  style={{ borderColor: theme.primaryLight }}
                  onFocus={(e) => e.currentTarget.style.outlineColor = theme.primary}
                  onBlur={(e) => e.currentTarget.style.outlineColor = 'transparent'}
                >
                  <option value="⭐">⭐</option>
                  <option value="⭐⭐">⭐⭐</option>
                  <option value="⭐⭐⭐">⭐⭐⭐</option>
                  <option value="⭐⭐⭐⭐">⭐⭐⭐⭐</option>
                  <option value="⭐⭐⭐⭐⭐">⭐⭐⭐⭐⭐</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="isUser"
                  checked={formData.isUser ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isUser: e.target.checked }))
                  }
                  className="w-5 h-5 border rounded focus:ring-2"
                  style={{ 
                    borderColor: theme.primaryLight,
                    accentColor: theme.primary,
                  }}
                />
                <label htmlFor="isUser" className="text-sm text-gray-700">
                  Active Member
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.primaryLight }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-white rounded-lg transition text-sm md:text-base"
                  style={{ 
                    backgroundColor: theme.primary,
                    hover: { backgroundColor: theme.primaryDark }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryDark}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                >
                  {editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add CSS animation for mobile modal */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 768px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}