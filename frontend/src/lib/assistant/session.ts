/**
 * Where the access token comes from, in exactly one place.
 *
 * Dahani's login lives in the Nest app and this panel has no way to obtain a token
 * on its own, so today it reads whatever the app stored and offers a paste box in
 * development. **When the team's auth context lands, this file is the only one that
 * changes** -- nothing else in the panel knows how a token is obtained.
 *
 * `localStorage` is the current holder because that is where a Next.js app without a
 * cookie session puts it, not because it is the best place: anything that can run
 * script on this origin can read it. If Dahani ever issues an httpOnly cookie, this
 * module and `allow_credentials` on the service are the two things to revisit -- and
 * the panel above will not notice.
 */

const TOKEN_KEY = "access_token";

/** Never called during render: `localStorage` does not exist on the server, and
 *  reading it while rendering is how a hydration mismatch gets into the console. */
export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Safari in private mode, or a browser with site data blocked. A missing token
    // is a state this panel already handles; a thrown one would be a blank screen.
    return null;
  }
}

export function writeToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* Same as above: storage being unavailable must not break the page. */
  }
}

const THREAD_KEY = "assistant_thread";

/** Per tab, not per browser. Two tabs are two conversations, which is what a person
 *  means by opening a second one -- and it is `sessionStorage` rather than
 *  `localStorage` so closing the tab ends the thread the way closing a chat does. */
export function readThreadId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(THREAD_KEY);
  } catch {
    return null;
  }
}

export function writeThreadId(threadId: string | null): void {
  try {
    if (threadId) window.sessionStorage.setItem(THREAD_KEY, threadId);
    else window.sessionStorage.removeItem(THREAD_KEY);
  } catch {
    /* storage unavailable: the conversation still works, it just will not survive a reload */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignored */
  }
}

/** The AI service's origin. Public by necessity -- the browser is what calls it. */
export const AI_BASE_URL = (
  process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

/** Mirrors MAX_MESSAGE_CHARS. The subject requires validation on both sides, and
 *  this half exists so the user is told before the request is spent, not after. */
export const MAX_MESSAGE_CHARS = 2000;

export const IS_DEV = process.env.NODE_ENV !== "production";
