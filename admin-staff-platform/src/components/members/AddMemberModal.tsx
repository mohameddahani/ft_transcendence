"use client";

import React, { useState } from "react";
import { X, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: (member: {
    fullName: string;
    email: string;
    plan: string;
    duration: string;
  }) => void;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  onMemberAdded,
}: AddMemberModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("Premium Elite");
  const [duration, setDuration] = useState("12 Months");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please fill in member name and email.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(`Member ${fullName} successfully registered!`);
      if (onMemberAdded) {
        onMemberAdded({ fullName, email, plan, duration });
      }
      setFullName("");
      setEmail("");
      setPhone("");
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Add New Member
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jordan Smith"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan.smith@example.com"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 234-5678"
              className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Membership Tier
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
              >
                <option value="Premium Elite">Premium Elite</option>
                <option value="Standard Plus">Standard Plus</option>
                <option value="Basic Monthly">Basic Monthly</option>
                <option value="Trial Pass">Trial Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm text-on-surface focus:ring-2 focus:ring-primary-container outline-none"
              >
                <option value="12 Months">12 Months (Annual)</option>
                <option value="6 Months">6 Months</option>
                <option value="3 Months">3 Months</option>
                <option value="Monthly">Monthly</option>
                <option value="7 Days">7 Days Trial</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white primary-gradient rounded-xl shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? "Enrolling..." : "Enroll Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
