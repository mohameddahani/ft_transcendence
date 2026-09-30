"use client";

import React, { useState } from "react";
import { Receipt, Download, Plus } from "lucide-react";
import { toast } from "react-toastify";

export default function PaymentsPage() {
  const [transactions] = useState<any[]>([]);

  return (
    <div className="space-y-6 max-w-container-max mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Payments & Billing
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Track member subscription revenue, gateway settlements, and invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.info("No transaction ledger to export yet.")}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest border border-outline-variant rounded-xl text-label-md font-semibold text-on-surface hover:bg-surface-variant transition-all cursor-pointer w-fit"
        >
          <Download className="w-4 h-4 text-on-surface-variant" />
          <span>Export Transactions</span>
        </button>
      </div>

      {/* Empty State / Awaiting Payments API */}
      {transactions.length === 0 && (
        <div className="p-16 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface">
            No Transactions Recorded
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1 mb-6">
            Payment records, gateway settlements, and member invoices will automatically be populated once connected to the payments API.
          </p>
        </div>
      )}
    </div>
  );
}
