"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Trash2,
  Shield,
  AlertCircle,
  Loader2,
  Search,
  Info,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  toLogin,
  ApiError,
  DocumentInfo,
} from "@/lib/assistant/api";

export default function AssistantDocumentsPage() {
  const { t } = useTranslation();

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState("");

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"member" | "staff">("member");
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Deletion Modal State
  const [docToDelete, setDocToDelete] = useState<DocumentInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Documents
  const loadDocs = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await listDocuments();
      setDocuments(docs || []);
      setForbidden(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          toLogin();
          return;
        }
        if (err.status === 403) {
          setForbidden(true);
          setForbiddenMessage(
            err.detail || t("forbiddenStaffNotice") || "Only the gym owner can manage documents."
          );
          return;
        }
      }
      toast.error(t("failedToLoadDocs") || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  // Validate and stage file
  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["md", "txt", "pdf"].includes(ext)) {
      toast.error("Only .md, .txt and .pdf files are accepted");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("The file is larger than 10 MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    try {
      setIsUploading(true);
      const res = await uploadDocument(selectedFile, visibility);
      toast.success(
        t("uploadSuccess", {
          filename: res.filename,
          chunks: res.chunks,
        }) || `'${res.filename}' added (${res.chunks} parts). The assistant can use it now.`
      );
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocs();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.detail) {
        toast.error(err.detail);
      } else {
        toast.error("Failed to upload document. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm and Delete
  const handleConfirmDelete = async () => {
    if (!docToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteDocument(docToDelete.filename);
      toast.success(
        t("documentDeleted", { filename: docToDelete.filename }) ||
          `'${docToDelete.filename}' deleted from knowledge base.`
      );
      setDocToDelete(null);
      await loadDocs();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.detail) {
        toast.error(err.detail);
      } else {
        toast.error("Failed to delete document");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered documents list
  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const memberDocsCount = documents.filter((d) => d.visibility === "member").length;
  const staffDocsCount = documents.filter((d) => d.visibility === "staff").length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);

  // If user is Staff or Member trying to access documents page
  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto mt-16 p-8 bg-surface-container border border-outline-variant rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="font-headline font-bold text-xl text-on-surface">
          Access Restricted
        </h2>
        <p className="text-sm text-on-surface-variant">{forbiddenMessage}</p>
        <div className="pt-2">
          <Link
            href="/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-on-primary hover:opacity-95 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("backToAssistant") || "Back to Assistant"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <Link
            href="/assistant"
            className="w-9 h-9 rounded-xl bg-surface-container border border-outline-variant hover:border-primary/50 text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title={t("backToAssistant") || "Back to Assistant"}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-bold text-xl sm:text-2xl text-on-surface">
                {t("documentsTitle") || "Gym Knowledge Base"}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Owner Only
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {t("documentsSubtitle") ||
                "Upload policies, terms, and procedures that the assistant references when answering inquiries."}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
          <span className="text-xs font-medium text-on-surface-variant block mb-1">
            Total Documents
          </span>
          <span className="text-xl sm:text-2xl font-bold font-headline text-on-surface">
            {documents.length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
          <span className="text-xs font-medium text-on-surface-variant block mb-1">
            Members & Staff
          </span>
          <span className="text-xl sm:text-2xl font-bold font-headline text-primary">
            {memberDocsCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
          <span className="text-xs font-medium text-on-surface-variant block mb-1">
            Staff Only
          </span>
          <span className="text-xl sm:text-2xl font-bold font-headline text-amber-500">
            {staffDocsCount}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-2xs">
          <span className="text-xs font-medium text-on-surface-variant block mb-1">
            Indexed Chunks
          </span>
          <span className="text-xl sm:text-2xl font-bold font-headline text-emerald-500">
            {totalChunks}
          </span>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/70 text-xs text-on-surface-variant leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p>
          {t("visibilityDescription") ||
            "Documents marked 'Members & Staff' are referenced in answers to members and staff. 'Staff Only' documents are strictly concealed from member inquiries."}
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            <span>{t("uploadDocument") || "Upload New Knowledge Document"}</span>
          </h2>
          <span className="text-[11px] text-on-surface-variant">.md, .txt, .pdf ≤ 10MB</span>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
              isDragOver
                ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                : selectedFile
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-outline-variant hover:border-primary/60 bg-surface-container-low hover:bg-surface-container"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-on-surface">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium text-on-surface">
                  {t("dragDropText") || "Click or drag & drop a file here"}
                </div>
                <div className="text-xs text-on-surface-variant">
                  Markdown (.md), Text (.txt), or PDF (.pdf) documents
                </div>
              </div>
            )}
          </div>

          {/* Visibility Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-on-surface">
                {t("visibility") || "Visibility"}:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-surface-container-low border border-outline-variant">
                <button
                  type="button"
                  onClick={() => setVisibility("member")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    visibility === "member"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("visibilityMember") || "Members & Staff"}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("staff")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    visibility === "staff"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("visibilityStaff") || "Staff Only"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary hover:bg-primary/90 text-on-primary disabled:opacity-40 transition-all cursor-pointer shadow-2xs disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("uploadingDocument") || "Uploading & Indexing..."}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{t("uploadDocument") || "Upload to Knowledge Base"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Document Library List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-headline font-bold text-base text-on-surface">
              Document Knowledge Library
            </h2>
            <p className="text-xs text-on-surface-variant">
              Active documents referenced by Gemini for user queries
            </p>
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary/80"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Loading document library...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant text-xs sm:text-sm border border-dashed border-outline-variant/60 rounded-xl">
            {documents.length === 0
              ? t("emptyDocuments") ||
                "No documents uploaded yet. Upload policies, pricing, or rules to enrich the assistant."
              : "No documents matching your search filter."}
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40 border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container-low">
            {filteredDocs.map((doc) => {
              const isStaffOnly = doc.visibility === "staff";
              return (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between gap-3 p-3.5 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-outline-variant/60 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-on-surface truncate">
                        {doc.filename}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isStaffOnly
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {isStaffOnly
                            ? t("visibilityStaff") || "Staff Only"
                            : t("visibilityMember") || "Members & Staff"}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {t("docChunks", { count: doc.chunks }) ||
                            `${doc.chunks} chunks`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDocToDelete(doc)}
                    className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={`Delete ${doc.filename}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-surface-container border border-outline-variant p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-error font-headline font-bold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>{t("deleteDocumentTitle") || "Delete Knowledge Document"}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="w-7 h-7 rounded-lg text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t("deleteDocumentConfirm", { filename: docToDelete.filename }) ||
                `Are you sure you want to delete '${docToDelete.filename}'? The assistant will immediately cease referencing this document.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-error text-on-error hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("delete") || "Delete"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
