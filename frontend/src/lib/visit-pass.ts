/**
 * Utility for persisting and retrieving member visit QR pass tokens
 * in localStorage so members can view their QR code pass at any time
 * until check-in.
 */

const PASS_STORAGE_KEY = "sportium_member_visit_passes";

export interface StoredVisitPass {
  token: string;
  visitDateAndTime: string;
  visitId?: string;
  savedAt: number;
}

function getStoredPasses(): StoredVisitPass[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PASS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveVisitPass(pass: {
  token: string;
  visitDateAndTime: string;
  visitId?: string;
}): void {
  if (typeof window === "undefined" || !pass.token) return;
  try {
    const passes = getStoredPasses();
    const isoDate = new Date(pass.visitDateAndTime).toISOString();
    const targetTime = new Date(isoDate).getTime();

    // Remove any existing pass with the same visitId or within 5 minutes of same visit time
    const filtered = passes.filter((p) => {
      if (pass.visitId && p.visitId === pass.visitId) return false;
      const pTime = new Date(p.visitDateAndTime).getTime();
      if (Math.abs(pTime - targetTime) <= 5 * 60 * 1000) return false;
      return true;
    });

    filtered.push({
      token: pass.token,
      visitDateAndTime: isoDate,
      visitId: pass.visitId,
      savedAt: Date.now(),
    });

    // Prune passes older than 7 days
    const now = Date.now();
    const pruned = filtered.filter(
      (p) => now - p.savedAt < 7 * 24 * 60 * 60 * 1000
    );

    localStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(pruned));
  } catch (err) {
    console.error("Failed to save visit pass:", err);
  }
}

export function getVisitPassToken(params?: {
  visitId?: string;
  visitDateAndTime?: string;
}): string | null {
  if (typeof window === "undefined") return null;
  try {
    const passes = getStoredPasses();
    if (!passes.length) return null;

    if (params?.visitId) {
      const match = passes.find((p) => p.visitId === params.visitId);
      if (match) return match.token;
    }

    if (params?.visitDateAndTime) {
      const targetTime = new Date(params.visitDateAndTime).getTime();
      const match = passes.find((p) => {
        const pTime = new Date(p.visitDateAndTime).getTime();
        return Math.abs(pTime - targetTime) <= 5 * 60 * 1000;
      });
      if (match) return match.token;
    }

    // Fallback: If only 1 pass exists and no specific visit is queried, return it
    if (!params?.visitId && !params?.visitDateAndTime && passes.length > 0) {
      return passes[passes.length - 1].token;
    }

    return null;
  } catch {
    return null;
  }
}

export function linkVisitPass(visitDateAndTime: string, visitId: string): void {
  if (typeof window === "undefined" || !visitId) return;
  try {
    const passes = getStoredPasses();
    const targetTime = new Date(visitDateAndTime).getTime();
    let updated = false;

    for (const p of passes) {
      if (
        !p.visitId &&
        Math.abs(new Date(p.visitDateAndTime).getTime() - targetTime) <=
          5 * 60 * 1000
      ) {
        p.visitId = visitId;
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(passes));
    }
  } catch {}
}

export function removeVisitPass(params: {
  visitId?: string;
  visitDateAndTime?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const passes = getStoredPasses();
    const filtered = passes.filter((p) => {
      if (params.visitId && p.visitId === params.visitId) return false;
      if (params.visitDateAndTime) {
        const diff = Math.abs(
          new Date(p.visitDateAndTime).getTime() -
            new Date(params.visitDateAndTime).getTime()
        );
        if (diff <= 5 * 60 * 1000) return false;
      }
      return true;
    });
    localStorage.setItem(PASS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function syncVisitsWithPasses(
  visits: Array<{
    id: string;
    visitDateAndTime: string;
    visitStatus: string;
  }>
): void {
  if (!visits || !visits.length) return;
  for (const v of visits) {
    if (v.visitStatus === "READY") {
      linkVisitPass(v.visitDateAndTime, v.id);
    } else {
      removeVisitPass({ visitId: v.id, visitDateAndTime: v.visitDateAndTime });
    }
  }
}

