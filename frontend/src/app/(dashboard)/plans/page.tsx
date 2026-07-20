// app/dashboard/plans/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// --- Types ---
interface Plan {
  id: number;
  col1: string;
  isUser: string;
  fullName: string;
  description: string;
}

// --- API Service ---
const API_BASE = 'https://api-generator.retool.com/uMLaXT';

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
export default function PlansPage() {
  // --- State ---
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<Partial<Plan>>({
    fullName: '',
    isUser: '',
    description: '',
  });

  // --- Fetch Plans ---
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<Plan[]>('/plans');
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // --- CRUD Operations ---
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      await apiClient(`/plans/${id}`, { method: 'DELETE' });
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      fullName: plan.fullName,
      isUser: plan.isUser,
      description: plan.description,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      fullName: '',
      isUser: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.isUser || !formData.description) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        isUser: String(formData.isUser),
        description: formData.description,
      };

      if (editingPlan) {
        await apiClient(`/plans/${editingPlan.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/plans', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    }
  };

  // --- Helpers ---
  const getFeatures = (description: string) => {
    const items = description.split(/\n|\.\s*/).filter(item => item.trim().length > 0);
    if (items.length <= 1) {
      return description.split(/\s+(?=\w+[ -])/).filter(item => item.trim().length > 0);
    }
    return items;
  };

  const planIcons = [
    <UserGroupIcon key="user" className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />,
    <SparklesIcon key="sparkle" className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />,
    <ChartBarIcon key="chart" className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />,
    <ClockIcon key="clock" className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />,
  ];

  // --- Render ---
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your gym subscription plans
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm md:text-base w-full sm:w-auto"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Plan
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No plans found. Start by creating one!
            </div>
          ) : (
            plans.map((plan, index) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* Plan Header */}
                <div className="p-4 md:p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        {planIcons[index % planIcons.length]}
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                        {plan.fullName}
                      </h3>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl md:text-3xl font-bold text-gray-900">
                      ${plan.isUser}
                    </span>
                    <span className="text-sm text-gray-500">/ month</span>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="flex-1 p-4 md:p-6">
                  <ul className="space-y-1.5 md:space-y-2">
                    {getFeatures(plan.description).slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckIcon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-base">{feature.trim()}</span>
                      </li>
                    ))}
                    {getFeatures(plan.description).length > 4 && (
                      <li className="text-sm text-indigo-600 font-medium pl-6">
                        +{getFeatures(plan.description).length - 4} more features
                      </li>
                    )}
                  </ul>
                </div>

                {/* Plan Action */}
                <div className="px-4 md:px-6 pb-4 md:pb-6">
                  <button className="w-full py-2.5 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium text-sm">
                    Choose Plan
                  </button>
                </div>
              </div>
            ))
          )}
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
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
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
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  placeholder="e.g., Pro Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={formData.isUser || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isUser: e.target.value }))
                  }
                  required
                  min="0"
                  step="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  placeholder="e.g., 49"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features / Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 text-sm md:text-base"
                  placeholder="e.g., AI Advisor, Unlimited auto tracking, 24/7 support"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Separate features with a new line, period, or comma.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm md:text-base"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation for Mobile Modal */}
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