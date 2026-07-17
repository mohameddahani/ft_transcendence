// app/dashboard/members/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// --- Types based on your API data ---
interface Member {
  id: number;
  col1: string;
  isUser: boolean;
  rating: string;
  fullName: string;
}

interface ApiResponse {
  data: Member[];
  total: number;
  page: number;
  limit: number;
}

// --- API Service (using your Retool endpoints) ---
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

// --- Main Component ---
export default function MembersPage() {
  // --- State ---
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({
    fullName: '',
    isUser: true,
    rating: '⭐⭐⭐',
  });

  const limit = 10;

  // --- Fetch Members ---
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/data?_page=${currentPage}&_limit=${limit}`;
      if (searchTerm.trim()) {
        url = `/data?fullName=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(`${API_BASE}${url}`);
      if (!response.ok) throw new Error('Failed to fetch');

      // Retool's pagination returns the data array directly
      const data = await response.json();

      // For paginated search, we need to handle the response differently
      if (searchTerm.trim()) {
        // Search endpoint returns array directly
        setMembers(data);
        setTotalMembers(data.length);
      } else {
        // Paginated endpoint returns array directly
        setMembers(data);
        // Since we can't get total count from Retool, estimate based on page size
        setTotalMembers(data.length === limit ? currentPage * limit + 1 : (currentPage - 1) * limit + data.length);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, limit]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // --- CRUD Operations ---
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      await apiClient(`/data/${id}`, { method: 'DELETE' });
      await fetchMembers();
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
      await fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Failed to save member. Please try again.');
    }
  };

  // --- UI Helpers ---
  const totalPages = Math.ceil(totalMembers / limit) || 1;

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Members</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your gym members
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <PlusIcon className="w-5 h-5" />
          Add Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No members found. {searchTerm ? 'Try a different search.' : 'Start by adding one!'}
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
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
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
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
            {!searchTerm.trim() && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * limit + 1} -{' '}
                  {Math.min(currentPage * limit, totalMembers)} of {totalMembers}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="⭐">⭐</option>
                  <option value="⭐⭐">⭐⭐</option>
                  <option value="⭐⭐⭐">⭐⭐⭐</option>
                  <option value="⭐⭐⭐⭐">⭐⭐⭐⭐</option>
                  <option value="⭐⭐⭐⭐⭐">⭐⭐⭐⭐⭐</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isUser"
                  checked={formData.isUser ?? true}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isUser: e.target.checked }))
                  }
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isUser" className="text-sm text-gray-700">
                  Active Member
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  {editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}