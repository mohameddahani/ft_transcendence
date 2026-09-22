"use client";

/**
 * The owner's gym documents (task 3.7): upload, list, delete.
 *
 * The assistant answers questions about the gym's rules from these files and cites
 * them. Owner only -- the service answers 403 to staff and members, and this page
 * says so instead of showing an empty list.
 */

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { AI_BASE_URL, readToken } from "@/lib/assistant/session";
import type { DocumentRow } from "@/lib/assistant/types";

/** Mirrors the service's MAX_UPLOAD_MB: checked here so the user is told before the
 *  upload is spent, and again by the service, which is the check that counts. */
const MAX_UPLOAD_MB = 10;
const ACCEPTED = [".pdf", ".txt", ".md"];

async function errorMessage(response: Response): Promise<string> {
  if (response.status === 429) {
    return `Too many uploads. Try again in ${response.headers.get("Retry-After") ?? "a few"} seconds.`;
  }
  if (response.status === 403) return "Only the gym owner can manage documents.";
  if (response.status === 401) return "That session has expired. Sign in again from the assistant.";
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

/** The token lives outside React, in localStorage. This is React's way to read an
 *  outside store: no effect, and `null` on the server so hydration matches. */
function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentManager() {
  const token = useSyncExternalStore(subscribeToStorage, readToken, () => null);
  const [documents, setDocuments] = useState<DocumentRow[] | null>(null);
  const [reload, setReload] = useState(0);                 // bump it to fetch the list again
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"member" | "staff">("member");
  const [uploading, setUploading] = useState(false);
  const [inputKey, setInputKey] = useState(0);            // bumping it clears the file input
  const [confirming, setConfirming] = useState<string | null>(null);   // doc_id awaiting a second click

  // The one place the list is fetched. State is only set in the callbacks, after the
  // response arrives.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetch(`${AI_BASE_URL}/ai/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.ok) setDocuments((await response.json()) as DocumentRow[]);
        else setError(await errorMessage(response));
      })
      .catch((failure: unknown) => {
        if ((failure as Error)?.name !== "AbortError") {
          setError(`Cannot reach the assistant service at ${AI_BASE_URL}.`);
        }
      });
    return () => controller.abort();
  }, [token, reload]);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !file) return;
    if (!ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      setError("Only PDF, TXT and Markdown files are accepted.");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Files are limited to ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    const form = new FormData();          // the browser sets the multipart boundary itself
    form.append("file", file);
    form.append("visibility", visibility);
    setUploading(true);
    setError(null);
    try {
      const response = await fetch(`${AI_BASE_URL}/ai/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        setError(await errorMessage(response));
        return;
      }
      setFile(null);
      setInputKey((key) => key + 1);
      setReload((count) => count + 1);
    } catch {
      setError(`Cannot reach the assistant service at ${AI_BASE_URL}.`);
    } finally {
      setUploading(false);
    }
  }

  async function remove(docId: string) {
    if (!token) return;
    // Two clicks, not a browser dialog: a `confirm()` blocks the whole tab.
    if (confirming !== docId) {
      setConfirming(docId);
      return;
    }
    setConfirming(null);
    const response = await fetch(`${AI_BASE_URL}/ai/documents/${encodeURIComponent(docId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      setError(await errorMessage(response));
      return;
    }
    setReload((count) => count + 1);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-baseline justify-between gap-3">
          <h1 className="text-sm font-semibold">Gym documents</h1>
          <Link href="/assistant" className="text-xs text-black/55 underline dark:text-white/55">
            Back to the assistant
          </Link>
        </header>

        <p className="text-sm text-black/60 dark:text-white/60">
          The assistant answers questions about your rules from these files and cites them.
          <strong className="font-medium"> Member</strong> files can be quoted to members;
          <strong className="font-medium"> staff</strong> files only to you and your staff.
        </p>

        {!token ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Sign in from the <Link href="/assistant" className="underline">assistant</Link> first.
          </p>
        ) : (
          <form
            onSubmit={(event) => void upload(event)}
            className="flex flex-col gap-3 rounded-xl border border-black/10 p-4 sm:flex-row sm:items-end dark:border-white/15"
          >
            <label className="flex flex-1 flex-col gap-1 text-xs text-black/55 dark:text-white/55">
              File (PDF, TXT or Markdown, up to {MAX_UPLOAD_MB} MB)
              <input
                key={inputKey}
                type="file"
                accept={ACCEPTED.join(",")}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-black/15 file:bg-transparent file:px-3 file:py-1.5 file:text-xs dark:file:border-white/15"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-black/55 dark:text-white/55">
              Who may see it
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as "member" | "staff")}
                className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm text-foreground dark:border-white/15"
              >
                <option value="member">Members</option>
                <option value="staff">Staff only</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={!file || uploading}
              className="rounded-lg bg-black/85 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-white/90 dark:text-black"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </form>
        )}

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}

        {documents && documents.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">No documents yet.</p>
        ) : null}

        {documents && documents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-black/50 dark:text-white/50">
                <tr>
                  <th className="py-2 pr-3 font-normal">File</th>
                  <th className="py-2 pr-3 font-normal">Visible to</th>
                  <th className="py-2 pr-3 font-normal">Size</th>
                  <th className="py-2 pr-3 font-normal">Uploaded</th>
                  <th className="py-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.doc_id} className="border-t border-black/10 dark:border-white/10">
                    <td className="py-2 pr-3 break-all">{document.filename}</td>
                    <td className="py-2 pr-3">{document.visibility === "staff" ? "Staff only" : "Members"}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatSize(document.bytes)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(document.created_at * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void remove(document.doc_id)}
                        onBlur={() => setConfirming(null)}
                        className="rounded-lg border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      >
                        {confirming === document.doc_id ? "Click again to delete" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
