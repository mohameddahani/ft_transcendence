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
  BookOpen,
  Layers,
  Users,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  ApiError,
  DocumentInfo,
} from "@/lib/assistant/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          // Do not redirect to /login to avoid the middleware bounce to /dashboard
          setForbidden(true);
          setForbiddenMessage("Session expired or unauthorized for document management. Please re-authenticate.");
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
      toast.error(t("onlyAllowedFileTypes") || "Only .md, .txt and .pdf files are accepted");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("fileTooLarge") || "The file is larger than 10 MB");
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

    // Check if replacing an existing document
    const alreadyExists = documents.some((d) => d.filename === selectedFile.name);
    if (alreadyExists) {
      const confirmed = window.confirm(
        t("documentOverwriteConfirm", { filename: selectedFile.name }) ||
          `This will replace the existing ${selectedFile.name}. Do you want to continue?`
      );
      if (!confirmed) return;
    }

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
        toast.error(t("documentUploadFailed") || "Failed to upload document. Please try again.");
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
        toast.error(t("documentDeleteFailed") || "Failed to delete document");
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
      <div className="max-w-md mx-auto mt-16">
        <Card className="toota-card border-none text-center p-8 space-y-4">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Shield className="size-6" />
          </div>
          <h2 className="font-semibold text-lg text-toota-ink">
            Access Restricted
          </h2>
          <p className="text-xs text-toota-muted leading-relaxed">
            {forbiddenMessage}
          </p>
          <div className="pt-2">
            <Link
              href="/assistant"
              className="toota-pill inline-flex items-center justify-center h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5 me-1.5 rtl:rotate-180" />
              <span suppressHydrationWarning>{t("backToAssistant", "Back to Assistant")}</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-12 select-none">
      {/* 1. Top Header Card */}
      <Card className="toota-card border-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/assistant"
              className="toota-pill size-10 border border-border/50 text-toota-ink hover:bg-toota-inner shrink-0 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer"
              title={t("backToAssistant", "Back to Assistant")}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1
                  suppressHydrationWarning
                  className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
                >
                  {t("documentsTitle", "Gym Knowledge Base")}
                </h1>
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / Owner Admin
                </span>
                <span
                  suppressHydrationWarning
                  className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums"
                >
                  / {documents.length} {t("documents", "documents")}
                </span>
              </div>
              <p
                suppressHydrationWarning
                className="text-xs sm:text-sm text-toota-muted mt-1 font-normal"
              >
                {t(
                  "documentsSubtitle",
                  "Upload policies, terms, and procedures that the assistant references when answering inquiries."
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Bento Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Documents */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Total Documents
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <BookOpen className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {documents.length}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / total files
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Active knowledge source documents
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Members & Staff Visibility */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Members & Staff
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-green">
              <Users className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {memberDocsCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Public</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Accessible to all members and staff
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Staff Only Visibility */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Staff Only
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-amber-500">
              <ShieldAlert className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {staffDocsCount}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Restricted</span>
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Concealed strictly from member queries
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Total Chunks */}
        <Card className="toota-card border-none flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-toota-muted">
              Vector Chunks
            </span>
            <div className="size-10 rounded-full bg-toota-inner flex items-center justify-center text-toota-ink">
              <Layers className="size-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-toota-ink">
                {totalChunks}
              </span>
              <span className="font-mono text-xs text-toota-muted tabular-nums">
                / embeddings
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-2">
              Indexed passages available for semantic lookup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Upload Zone Card */}
      <Card className="toota-card border-none space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <UploadCloud className="size-4 text-toota-ink" />
              <span>{t("uploadDocument") || "Upload New Knowledge Document"}</span>
            </CardTitle>
          </div>
          <span className="font-mono text-[11px] text-toota-muted">
            .md, .txt, .pdf ≤ 10MB
          </span>
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
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
              isDragOver
                ? "border-toota-green bg-toota-green/5 ring-2 ring-toota-green/20"
                : selectedFile
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-border/60 hover:border-border bg-toota-inner"
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
                <div className="size-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <div className="font-semibold text-xs sm:text-sm text-toota-ink">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-toota-muted font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="size-10 rounded-2xl bg-card border border-border/40 text-toota-muted flex items-center justify-center">
                  <UploadCloud className="size-5" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-toota-ink">
                  {t("dragDropText") || "Click or drag & drop a file here"}
                </div>
                <div className="text-xs text-toota-muted">
                  Markdown (.md), Text (.txt), or PDF (.pdf) documents up to 10MB
                </div>
              </div>
            )}
          </div>

          {/* Visibility Controls & Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-toota-muted">
                {t("visibility") || "Visibility"}:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-toota-inner border border-border/40">
                <button
                  type="button"
                  onClick={() => setVisibility("member")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    visibility === "member"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "text-toota-muted hover:text-toota-ink"
                  }`}
                >
                  {t("visibilityMember") || "Members & Staff"}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("staff")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    visibility === "staff"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-toota-muted hover:text-toota-ink"
                  }`}
                >
                  {t("visibilityStaff") || "Staff Only"}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="toota-pill h-9 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin me-1.5" />
                  <span>{t("uploadingDocument") || "Uploading & Indexing..."}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="size-3.5 me-1.5" />
                  <span>{t("uploadDocument") || "Upload to Knowledge Base"}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Document Library Card */}
      <Card className="toota-card border-none space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Document Knowledge Library
              </h2>
              <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                / {filteredDocs.length} of {documents.length}
              </span>
            </div>
            <p className="text-xs text-toota-muted mt-0.5">
              Active documents referenced by Gemini when responding to queries
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="size-3.5 text-toota-muted absolute left-3 rtl:left-auto rtl:right-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="h-8 text-xs pl-8 pr-3 rtl:pl-3 rtl:pr-8 bg-toota-inner border-border/40 text-toota-ink placeholder:text-toota-muted rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400"
            />
          </div>
        </div>

        {/* Notice Callout */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-toota-inner border border-border/40 text-xs text-toota-muted leading-relaxed">
          <Info className="size-4 text-toota-ink shrink-0 mt-0.5" />
          <p>
            {t("visibilityDescription") ||
              "Documents marked 'Members & Staff' are referenced in answers to members and staff. 'Staff Only' documents are strictly concealed from member inquiries."}
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-toota-muted text-xs">
            <Loader2 className="size-6 animate-spin text-toota-ink" />
            <span>Loading document library...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-12 text-center text-toota-muted text-xs border border-dashed border-border/40 rounded-2xl bg-toota-inner/40">
            {documents.length === 0
              ? t("emptyDocuments") ||
                "No documents uploaded yet. Upload policies, pricing, or rules to enrich the assistant."
              : "No documents matching your search criteria."}
          </div>
        ) : (
          <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden bg-card">
            {filteredDocs.map((doc) => {
              const isStaffOnly = doc.visibility === "staff";
              return (
                <div
                  key={doc.filename}
                  className="flex items-center justify-between gap-3 p-3.5 hover:bg-toota-inner/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-toota-inner border border-border/40 flex items-center justify-center text-toota-ink shrink-0">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-toota-ink truncate">
                        {doc.filename}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Crisp Outlined Micro-Badge */}
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs">
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${
                              isStaffOnly ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>
                            {isStaffOnly
                              ? t("visibilityStaff") || "Staff Only"
                              : t("visibilityMember") || "Members & Staff"}
                          </span>
                        </span>
                        <span className="font-mono text-[11px] text-toota-muted tabular-nums">
                          {t("docChunks", { count: doc.chunks }) ||
                            `${doc.chunks} chunks`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDocToDelete(doc)}
                    className="size-8 rounded-lg text-toota-muted hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                    title={`Delete ${doc.filename}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertCircle className="size-4" />
                <span>{t("deleteDocumentTitle") || "Delete Knowledge Document"}</span>
              </div>
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="size-7 rounded-lg text-toota-muted hover:text-toota-ink flex items-center justify-center cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-toota-muted leading-relaxed">
              {t("deleteDocumentConfirm", { filename: docToDelete.filename }) ||
                `Are you sure you want to delete '${docToDelete.filename}'? The assistant will immediately cease referencing this document.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="toota-pill h-9 px-4 text-xs font-semibold border-border/50 text-toota-ink cursor-pointer"
              >
                {t("cancel") || "Cancel"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="toota-pill h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin me-1.5" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5 me-1.5" />
                    <span>{t("delete") || "Delete"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
