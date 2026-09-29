"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, deleteDocument, listDocuments, uploadDocument, type DocumentInfo } from "@/lib/assistant/api";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".md", ".txt", ".pdf"];

function errorText(e: unknown): string {
  if (e instanceof ApiError && e.status === 401) return "Please sign in first, on the assistant page.";
  if (e instanceof ApiError && e.detail) return e.detail;
  return "Can't reach the assistant right now.";
}

export default function DocumentManager() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState("member");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then((list) => {
        setDocs(list);
        setAllowed(true);
      })
      .catch((e) => setMessage(errorText(e)))
      .finally(() => setLoading(false));
  }, []);

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!file) return;
    // checked here for a quick answer, and checked again by the server
    if (!ALLOWED.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setMessage("Only .md, .txt and .pdf files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("The file is larger than 10 MB.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const doc = await uploadDocument(file, visibility);
      setMessage(`${doc.filename} added (${doc.chunks} part${doc.chunks === 1 ? "" : "s"}). The assistant can use it now.`);
      form.reset();
      setFile(null);
      setDocs(await listDocuments());
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  // two clicks instead of a confirm() popup: the first one asks, the second one deletes
  async function onDelete(filename: string) {
    if (confirming !== filename) {
      setConfirming(filename);
      return;
    }
    setConfirming(null);
    try {
      await deleteDocument(filename);
      setMessage(`${filename} deleted.`);
      setDocs(await listDocuments());
    } catch (err) {
      setMessage(errorText(err));
    }
  }

  if (loading) return <p className="p-4 text-neutral-500">Loading…</p>;

  return (
    <section className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-neutral-300 p-4 dark:border-neutral-700">
      <header className="flex items-center justify-between">
        <h1 className="font-semibold">Gym documents</h1>
        <Link href="/assistant" className="text-sm text-blue-600 hover:underline">Back to the assistant</Link>
      </header>

      {!allowed ? (
        <p className="text-sm text-red-600">{message}</p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            The assistant answers questions from these documents. Members only see documents marked
            &quot;member&quot;; you and your staff see all of them.
          </p>

          <form onSubmit={onUpload} className="flex flex-wrap items-center gap-2">
            <input type="file" accept={ALLOWED.join(",")} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                   className="max-w-full text-sm" />
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
                    className="rounded-md border bg-transparent px-2 py-1 text-sm">
              <option value="member">Members and staff</option>
              <option value="staff">Staff only</option>
            </select>
            <button type="submit" disabled={!file || busy}
                    className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50">
              {busy ? "Uploading…" : "Upload"}
            </button>
          </form>

          {message && <p className="text-sm">{message}</p>}

          {docs.length === 0 ? (
            <p className="text-sm text-neutral-500">No documents yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-300 dark:divide-neutral-700">
              {docs.map((d) => (
                <li key={d.filename} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 truncate">{d.filename}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-neutral-500">{d.visibility === "staff" ? "Staff only" : "Members and staff"}</span>
                    <button onClick={() => onDelete(d.filename)} className="text-red-600 hover:underline">
                      {confirming === d.filename ? "Confirm delete?" : "Delete"}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
