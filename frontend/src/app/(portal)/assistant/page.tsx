"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Send,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  User,
  Clock,
  Layers,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Terminal,
  Activity,
  ShieldCheck,
  Building2,
  CalendarCheck,
  ChevronRight,
  AlertCircle,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Trash2,
  Search,
  X,
  History,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getMe,
  getThread,
  listThreads,
  deleteThreadApi,
  streamChat,
  toLogin,
  ApiError,
  Role,
  SavedMessage,
} from "@/lib/assistant/api";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  tool?: string | null;
  isStreaming?: boolean;
  timestamp?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messageCount?: number;
}

interface SidebarContentProps {
  isMobile?: boolean;
  threads: ChatThread[];
  activeThreadId: string | null;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (e: React.MouseEvent, id: string) => void;
  onNewChat: () => void;
  onClearAll: () => void;
  onCloseMobile: () => void;
  onCollapseDesktop: () => void;
  isStreaming: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function SidebarContent({
  isMobile = false,
  threads,
  activeThreadId,
  searchQuery,
  onSearchChange,
  onSelectThread,
  onDeleteThread,
  onNewChat,
  onClearAll,
  onCloseMobile,
  onCollapseDesktop,
  isStreaming,
  t,
}: SidebarContentProps) {
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    return threads.filter((th) =>
      th.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [threads, searchQuery]);

  const groupedThreads = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 1000;

    const groups: { label: string; items: ChatThread[] }[] = [
      { label: t("today") || "Today", items: [] },
      { label: t("yesterday") || "Yesterday", items: [] },
      { label: t("previous7Days") || "Previous 7 Days", items: [] },
      { label: t("older") || "Older", items: [] },
    ];

    filteredThreads.forEach((th) => {
      const time = new Date(th.updatedAt).getTime();
      if (time >= todayStart) {
        groups[0].items.push(th);
      } else if (time >= yesterdayStart) {
        groups[1].items.push(th);
      } else if (time >= sevenDaysAgoStart) {
        groups[2].items.push(th);
      } else {
        groups[3].items.push(th);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredThreads, t]);

  const formatThreadDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-outline-variant/60 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-xs uppercase tracking-wider text-on-surface truncate" suppressHydrationWarning>
            {t("conversations") || "conversations"}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0">
            {threads.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onNewChat}
            disabled={isStreaming}
            title={t("newChat") || "New Chat"}
            suppressHydrationWarning
            className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-medium flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-semibold pe-1">
              {t("newChat") || "New"}
            </span>
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onCollapseDesktop}
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title={t("toggleHistory") || "Collapse sidebar"}
              suppressHydrationWarning
            >
              <PanelLeftClose className="w-4 h-4 rtl:rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="p-2.5 border-b border-outline-variant/40 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-on-surface-variant/60 absolute start-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchConversations") || "Search chats..."}
            suppressHydrationWarning
            className="w-full text-xs ps-8 pe-7 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/70 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2 text-on-surface-variant/60 hover:text-on-surface p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Threads Scrollable List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 min-h-0">
        {groupedThreads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4 text-center text-on-surface-variant/60">
            <MessageSquare className="w-8 h-8 opacity-30 mb-2" />
            <p className="text-xs" suppressHydrationWarning>
              {searchQuery
                ? "No matching conversations"
                : t("noPastConversations") || "No conversations yet"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onNewChat}
                className="mt-3 text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t("newChat") || "Start new conversation"}</span>
              </button>
            )}
          </div>
        ) : (
          groupedThreads.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 select-none">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((th) => {
                  const isActive = th.id === activeThreadId;
                  return (
                    <div
                      key={th.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectThread(th.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectThread(th.id);
                        }
                      }}
                      className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-left rtl:text-right select-none ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-2xs font-medium"
                          : "hover:bg-surface-container text-on-surface border border-transparent hover:border-outline-variant/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Terminal
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive
                              ? "text-primary"
                              : "text-on-surface-variant/70"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs truncate ${
                              isActive
                                ? "font-semibold text-primary"
                                : "font-medium text-on-surface"
                            }`}
                            title={th.title}
                          >
                            {th.title}
                          </p>
                          <span className="text-[10px] text-on-surface-variant/70 block">
                            {formatThreadDate(th.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button (shows on hover or active) */}
                      <button
                        type="button"
                        onClick={(e) => onDeleteThread(e, th.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded-md transition-all text-on-surface-variant/60 cursor-pointer shrink-0"
                        title={t("deleteConversation") || "Delete chat"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer Controls */}
      {threads.length > 0 && (
        <div className="p-2.5 border-t border-outline-variant/60 shrink-0 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span className="text-[10px] text-on-surface-variant/70">
            {threads.length} {t("conversations") || "chats"}
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-[11px] text-rose-500/80 hover:text-rose-600 transition-colors cursor-pointer hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t("clearAllChats") || "Clear all"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AssistantPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user, role: userRole, companyName } = useCurrentUser();

  const [role, setRole] = useState<Role>("ADMIN");
  const [gymName, setGymName] = useState<string>("Gym");
  const [loadingMe, setLoadingMe] = useState(true);
  const [isAiConnected, setIsAiConnected] = useState<boolean | null>(null);

  // Sync role and gym name with user session
  useEffect(() => {
    if (userRole) {
      const normalizedRole = userRole.toUpperCase();
      if (
        normalizedRole === "ADMIN" ||
        normalizedRole === "STAFF" ||
        normalizedRole === "MEMBER"
      ) {
        setRole(normalizedRole as Role);
      }
    }
    if (companyName) {
      setGymName(companyName);
    }
  }, [userRole, companyName]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat History Sidebar states
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadIdRef = useRef<string | null>(null);

  // Storage key scoped to authenticated user
  const storageKey = useMemo(() => {
    if (user?.id) return `gym_ai_threads_${user.id}`;
    if (user?.email) return `gym_ai_threads_${user.email}`;
    return `gym_ai_threads_${role}`;
  }, [user?.id, user?.email, role]);

  // Keep threadIdRef in sync
  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  // Auto-scroll on new message or stream chunk
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Persist helper for threads
  const persistThreads = useCallback(
    (updated: ChatThread[]) => {
      setThreads(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
    },
    [storageKey]
  );

  // Load User Info, threads registry and active thread on mount
  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const me = await getMe();
        if (ignore) return;
        if (me) {
          setRole(me.role);
          if (me.gym_name) setGymName(me.gym_name);
          setIsAiConnected(true);
        } else {
          setIsAiConnected(false);
        }

        // 1. Load threads from localStorage
        let localThreads: ChatThread[] = [];
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) localThreads = parsed;
          }
        } catch {
          // ignore parsing error
        }

        // 2. Fetch remote threads if available
        const threadMap = new Map<string, ChatThread>();
        localThreads.forEach((th) => {
          if (th.id) threadMap.set(th.id, th);
        });

        try {
          const backendThreads = await listThreads();
          if (Array.isArray(backendThreads)) {
            backendThreads.forEach((bth) => {
              if (bth.thread_id) {
                const existing = threadMap.get(bth.thread_id);
                threadMap.set(bth.thread_id, {
                  id: bth.thread_id,
                  title: existing?.title || bth.title || "Conversation",
                  updatedAt:
                    bth.updated_at ||
                    existing?.updatedAt ||
                    new Date().toISOString(),
                  messageCount:
                    bth.message_count || existing?.messageCount || 1,
                });
              }
            });
          }
        } catch {
          // Fall back gracefully to local storage
        }

        const merged = Array.from(threadMap.values()).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        if (!ignore) {
          setThreads(merged);
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch {
            // ignore
          }
        }

        // 3. Check for tab session thread
        const savedThreadId = sessionStorage.getItem("assistant_thread_id");
        if (savedThreadId) {
          setThreadId(savedThreadId);
          const threadMessages = await getThread(savedThreadId);
          if (
            !ignore &&
            Array.isArray(threadMessages) &&
            threadMessages.length > 0
          ) {
            setMessages(
              threadMessages.map((msg: SavedMessage, idx: number) => ({
                id: `saved-${idx}-${Date.now()}`,
                role: msg.role,
                text: msg.text,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }))
            );
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError && err.status === 401) {
            toLogin();
            return;
          }
          setIsAiConnected(false);
        }
      } finally {
        if (!ignore) setLoadingMe(false);
      }
    }

    void init();

    return () => {
      ignore = true;
    };
  }, [storageKey]);

  // Textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  // Tool label mapping with translations
  const getToolLabel = (toolName: string) => {
    switch (toolName) {
      case "gym_overview":
        return t("tool_gym_overview") || "Querying gym overview";
      case "list_expiring_memberships":
        return (
          t("tool_list_expiring_memberships") || "Checking expiring memberships"
        );
      case "list_inactive_members":
        return t("tool_list_inactive_members") || "Analyzing inactive members";
      case "search_members":
        return t("tool_search_members") || "Searching member directory";
      case "get_revenue":
        return t("tool_get_revenue") || "Calculating financial records";
      case "list_feedback":
        return t("tool_list_feedback") || "Retrieving member feedback";
      case "search_documents":
        return t("tool_search_documents") || "Consulting gym documents";
      case "my_membership":
        return t("tool_my_membership") || "Checking membership status";
      case "my_payments":
        return t("tool_my_payments") || "Fetching billing records";
      case "my_attendance":
        return t("tool_my_attendance") || "Looking up workout visits";
      default:
        return toolName.replace(/_/g, " ");
    }
  };

  // Switch to another thread
  const handleSelectThread = async (selectedId: string) => {
    if (selectedId === threadId || isStreaming) return;
    setIsMobileHistoryOpen(false);
    setIsLoadingThread(true);
    setThreadId(selectedId);
    sessionStorage.setItem("assistant_thread_id", selectedId);

    try {
      const threadMessages = await getThread(selectedId);
      if (Array.isArray(threadMessages) && threadMessages.length > 0) {
        setMessages(
          threadMessages.map((msg: SavedMessage, idx: number) => ({
            id: `saved-${idx}-${selectedId}`,
            role: msg.role,
            text: msg.text,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }))
        );
      } else {
        setMessages([]);
      }
    } catch {
      toast.error(t("assistantUnavailable") || "Failed to load conversation");
    } finally {
      setIsLoadingThread(false);
    }
  };

  // Delete a specific thread
  const handleDeleteThread = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      t("deleteConversationConfirm") ||
        "Are you sure you want to delete this conversation?"
    );
    if (!confirmed) return;

    // Best-effort remote deletion
    void deleteThreadApi(targetId);

    const updated = threads.filter((th) => th.id !== targetId);
    persistThreads(updated);

    if (targetId === threadId) {
      sessionStorage.removeItem("assistant_thread_id");
      setThreadId(null);
      setMessages([]);
    }

    toast.info(t("conversationDeleted") || "Conversation deleted");
  };

  // Clear all thread history
  const handleClearAllHistory = () => {
    if (threads.length === 0) return;
    const confirmed = window.confirm(
      t("clearAllChatsConfirm") ||
        "Are you sure you want to delete all saved conversations?"
    );
    if (!confirmed) return;

    threads.forEach((th) => {
      void deleteThreadApi(th.id);
    });

    persistThreads([]);
    sessionStorage.removeItem("assistant_thread_id");
    setThreadId(null);
    setMessages([]);
    toast.info(t("allConversationsCleared") || "All conversations cleared");
  };

  // Reset to fresh conversation
  const handleNewChat = () => {
    if (isStreaming) return;
    setIsMobileHistoryOpen(false);
    sessionStorage.removeItem("assistant_thread_id");
    setThreadId(null);
    setMessages([]);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Send message
  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || input).trim();
    if (!q || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const nowFormatted = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const userMsgId = `user-${Date.now()}`;
    const modelMsgId = `model-${Date.now()}`;

    // Add user message & empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", text: q, timestamp: nowFormatted },
      {
        id: modelMsgId,
        role: "model",
        text: "",
        isStreaming: true,
        timestamp: nowFormatted,
      },
    ]);

    setIsStreaming(true);

    try {
      await streamChat(q, threadIdRef.current, (event, data) => {
        if (event === "start" && data.thread_id) {
          const tid = data.thread_id;
          setThreadId(tid);
          sessionStorage.setItem("assistant_thread_id", tid);

          // Update or register in threads registry
          setThreads((prev) => {
            const exists = prev.some((th) => th.id === tid);
            let nextList: ChatThread[];
            if (exists) {
              nextList = prev.map((th) =>
                th.id === tid
                  ? { ...th, updatedAt: new Date().toISOString() }
                  : th
              );
            } else {
              const cleanTitle =
                q.length > 45 ? q.slice(0, 45).trim() + "..." : q.trim();
              const newThread: ChatThread = {
                id: tid,
                title: cleanTitle,
                updatedAt: new Date().toISOString(),
                messageCount: 2,
              };
              nextList = [newThread, ...prev];
            }
            nextList.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
            );
            try {
              localStorage.setItem(storageKey, JSON.stringify(nextList));
            } catch {
              // ignore
            }
            return nextList;
          });
        } else if (event === "tool" && data.name) {
          const toolLabel = getToolLabel(data.name);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId ? { ...m, tool: toolLabel } : m
            )
          );
        } else if (event === "token" && data.text) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? { ...m, text: m.text + data.text, tool: null }
                : m
            )
          );
        } else if (event === "error") {
          const errorMsg =
            data.message ||
            t("assistantUnavailable") ||
            "Assistant unavailable.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? {
                    ...m,
                    text: m.text ? m.text : errorMsg,
                    isStreaming: false,
                    tool: null,
                  }
                : m
            )
          );
        } else if (event === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId ? { ...m, isStreaming: false, tool: null } : m
            )
          );

          // Update latest activity timestamp
          setThreads((prev) => {
            const tid = threadIdRef.current;
            if (!tid) return prev;
            const nextList = prev.map((th) =>
              th.id === tid
                ? { ...th, updatedAt: new Date().toISOString() }
                : th
            );
            try {
              localStorage.setItem(storageKey, JSON.stringify(nextList));
            } catch {
              // ignore
            }
            return nextList;
          });
        }
      });
    } catch (err: unknown) {
      // Revert optimistic messages and restore user question
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMsgId && m.id !== modelMsgId)
      );
      setInput(q);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          toLogin();
          return;
        }
        if (err.status === 429) {
          const waitMsg =
            t("rateLimitWait", {
              seconds: err.retryAfter || 60,
            }) ||
            `Too many questions. Try again in ${err.retryAfter || 60} seconds.`;
          toast.warning(waitMsg);
          return;
        }
        if (err.detail) {
          toast.error(err.detail);
          return;
        }
      }
      toast.error(
        t("assistantUnavailable") || "Can't reach the assistant right now."
      );
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === modelMsgId ? { ...m, isStreaming: false, tool: null } : m
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Copy text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t("copiedToClipboard") || "Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Categorized suggestions for human-crafted SaaS look
  const categorizedSuggestions =
    role === "ADMIN"
      ? [
          {
            category: t("catOperationsAttendance"),
            icon: Activity,
            items: [
              {
                title: t("suggestion1_admin") || "How is the gym doing today?",
                subtitle: t("subHowGymDoing"),
                icon: Building2,
              },
              {
                title: t("suggestion2_admin") || "Who expires this week?",
                subtitle: t("subWhoExpiresWeek"),
                icon: Layers,
              },
            ],
          },
          {
            category: t("catFinancialsPolicies"),
            icon: DollarSign,
            items: [
              {
                title:
                  t("suggestion3_admin") || "How much did we make last month?",
                subtitle: t("subHowMuchMade"),
                icon: DollarSign,
              },
              {
                title:
                  t("suggestion4_admin") ||
                  "How many days notice do members need to cancel?",
                subtitle: t("subCancellationDays"),
                icon: BookOpen,
              },
            ],
          },
        ]
      : role === "STAFF"
      ? [
          {
            category: t("catFrontDeskRenewals"),
            icon: CalendarCheck,
            items: [
              {
                title: t("suggestion1_staff") || "Who expires this week?",
                subtitle: t("subMembersExpiringSoon"),
                icon: Layers,
              },
              {
                title:
                  t("suggestion2_staff") || "Who hasn't come for 3 weeks?",
                subtitle: t("subSpotInactiveMembers"),
                icon: Clock,
              },
            ],
          },
          {
            category: t("catProceduresInquiries"),
            icon: HelpCircle,
            items: [
              {
                title:
                  t("suggestion3_staff") || "Show me the negative feedback",
                subtitle: t("subShowNegativeFeedback"),
                icon: MessageSquare,
              },
              {
                title:
                  t("suggestion4_staff") ||
                  "What discount can I give at reception?",
                subtitle: t("subFrontDeskDiscount"),
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : [
          {
            category: t("catMyMembership"),
            icon: User,
            items: [
              {
                title:
                  t("suggestion1_member") || "When does my membership end?",
                subtitle: t("subWhenMembershipEnds"),
                icon: Clock,
              },
              {
                title:
                  t("suggestion2_member") ||
                  "How many times did I come this month?",
                subtitle: t("subHowManyTimesCame"),
                icon: Activity,
              },
            ],
          },
          {
            category: t("catClubGuidelines"),
            icon: BookOpen,
            items: [
              {
                title:
                  t("suggestion3_member") ||
                  "What are the opening hours on Sunday?",
                subtitle: t("subSundayOpeningHours"),
                icon: Clock,
              },
              {
                title: t("suggestion4_member") || "Can I bring a friend?",
                subtitle: t("subBringFriendPolicy"),
                icon: User,
              },
            ],
          },
        ];

  const placeholderText =
    role === "ADMIN"
      ? t("askPlaceholderAdmin") ||
        "Ask about members, expiring plans, revenue, or documents..."
      : role === "STAFF"
      ? t("askPlaceholderStaff") ||
        "Ask about members, expiring memberships, or reception procedures..."
      : t("askPlaceholderMember") ||
        "Ask about your membership, visits, payments, or gym rules...";

  return (
    <div className="w-full flex h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-2xs relative">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-e border-outline-variant/60 bg-surface-container-low/60 transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? "w-72 xl:w-80" : "w-0 overflow-hidden border-none"
        }`}
      >
        {isSidebarOpen && (
          <SidebarContent
            isMobile={false}
            threads={threads}
            activeThreadId={threadId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectThread={handleSelectThread}
            onDeleteThread={handleDeleteThread}
            onNewChat={handleNewChat}
            onClearAll={handleClearAllHistory}
            onCloseMobile={() => setIsMobileHistoryOpen(false)}
            onCollapseDesktop={() => setIsSidebarOpen(false)}
            isStreaming={isStreaming}
            t={t}
          />
        )}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileHistoryOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileHistoryOpen(false)}
          />
          {/* Drawer Sheet */}
          <div className="relative w-80 max-w-[85vw] h-full bg-surface-container-low border-e border-outline-variant flex flex-col shadow-2xl z-10">
            <SidebarContent
              isMobile={true}
              threads={threads}
              activeThreadId={threadId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectThread={handleSelectThread}
              onDeleteThread={handleDeleteThread}
              onNewChat={handleNewChat}
              onClearAll={handleClearAllHistory}
              onCloseMobile={() => setIsMobileHistoryOpen(false)}
              onCollapseDesktop={() => setIsSidebarOpen(false)}
              isStreaming={isStreaming}
              t={t}
            />
          </div>
        </div>
      )}

      {/* Main Chat Workstation */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-surface-container-lowest">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-outline-variant/70 shrink-0 bg-surface-container-lowest">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar Toggle Buttons */}
            {/* Desktop Toggle (shows when collapsed) */}
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/50 transition-colors cursor-pointer shrink-0"
                title={t("toggleHistory") || "Open conversations list"}
              >
                <PanelLeft className="w-4 h-4 rtl:rotate-180" />
              </button>
            )}

            {/* Mobile History Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileHistoryOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/50 transition-colors cursor-pointer shrink-0 relative"
              title={t("chatHistory") || "View conversations history"}
            >
              <History className="w-4 h-4" />
              {threads.length > 0 && (
                <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container-high border border-outline-variant text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Terminal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">
                  {gymName} {t("navAiAssistant") || "Assistant"}
                </h1>
                {isAiConnected === false ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {t("serviceOffline")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t("connected")}
                  </span>
                )}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/50 uppercase tracking-wider">
                  {role}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate hidden sm:block">
                {role === "ADMIN"
                  ? t("adminAiTelemetry")
                  : role === "STAFF"
                  ? t("staffAiTelemetry")
                  : t("memberAiTelemetry")}
              </p>
            </div>
          </div>

          {/* Action Controls & Navigation */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Segmented Knowledge Documents Link (Admin Only) */}
            {role === "ADMIN" && (
              <Link
                href="/assistant/documents"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-on-surface transition-colors cursor-pointer"
                title="Manage Knowledge Base Documents"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">
                  {t("manageDocuments") || "Knowledge Documents"}
                </span>
              </Link>
            )}

            {/* Reset / New Thread Button */}
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:text-primary bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-colors disabled:opacity-40 cursor-pointer"
              title={t("newChat") || "Start new conversation"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {t("newChat") || "New Thread"}
              </span>
            </button>
          </div>
        </header>

        {/* Offline Warning Banner */}
        {isAiConnected === false && (
          <div className="mx-3 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t("assistantUnavailable")}</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 shrink-0">
              AI Service Offline
            </span>
          </div>
        )}

        {/* Main Chat Stream Container */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 min-h-0">
          {loadingMe || isLoadingThread ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-on-surface-variant text-sm">
                <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>
                  {isLoadingThread
                    ? t("loadingConversation") || "Loading conversation..."
                    : `Connecting to ${gymName} database...`}
                </span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Operational Launchpad */
            <div className="h-full flex flex-col justify-center items-center text-center max-w-3xl mx-auto py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-surface-container-high border border-outline-variant/60 text-on-surface-variant mb-4">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{gymName} Operational Console</span>
              </div>

              <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-surface mb-2">
                {role === "ADMIN"
                  ? "What would you like to review today?"
                  : role === "STAFF"
                  ? "Front desk inquiries & member lookups"
                  : "How can we assist your workout today?"}
              </h2>

              <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg mb-6 leading-relaxed">
                {role === "ADMIN"
                  ? "Query live membership records, expiring accounts, monthly financial figures, or club policy documents."
                  : role === "STAFF"
                  ? "Verify member attendance, search active memberships, or review reception desk protocols."
                  : "Check your membership renewal dates, past visits, payments, and club guidelines."}
              </p>

              {/* Categorized Launchpad Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left rtl:text-right">
                {categorizedSuggestions.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/70 shadow-2xs flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 pb-1 border-b border-outline-variant/40">
                      <group.icon className="w-3.5 h-3.5 text-primary" />
                      <span>{group.category}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1">
                      {group.items.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          type="button"
                          onClick={() => handleSend(item.title)}
                          disabled={isStreaming}
                          className="group flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-surface-container border border-transparent hover:border-outline-variant/50 transition-all text-left rtl:text-right cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-on-surface group-hover:text-primary transition-colors leading-snug">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-on-surface-variant/80 mt-0.5 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 shrink-0 mt-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Conversational Thread */
            messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-3.5 items-start ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Assistant Monogram Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      GF
                    </div>
                  )}

                  {/* Message Container Card */}
                  <div
                    className={`relative max-w-[90%] sm:max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed transition-all ${
                      isUser
                        ? "bg-surface-container-high border border-outline-variant text-on-surface"
                        : "bg-surface-container-lowest border border-outline-variant shadow-2xs text-on-surface"
                    }`}
                  >
                    {/* Sender Metadata Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-outline-variant/40 text-[11px] text-on-surface-variant select-none">
                      <span className="font-semibold text-on-surface">
                        {isUser ? `You (${role})` : `${gymName} Assistant`}
                      </span>
                      {msg.timestamp && (
                        <span className="text-[10px] opacity-70">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>

                    {/* Active Tool Execution Telemetry */}
                    {msg.tool && (
                      <div className="mb-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container text-primary border border-primary/20">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span>{msg.tool}...</span>
                      </div>
                    )}

                    {/* Plain Text Content (Strict Security: No Markdown/HTML) */}
                    <p
                      dir="auto"
                      className="whitespace-pre-wrap font-sans break-words selection:bg-primary/20 text-on-surface text-[13.5px] sm:text-sm leading-relaxed"
                    >
                      {msg.text}
                    </p>

                    {/* Streaming Pulse Indicator */}
                    {msg.isStreaming && !msg.text && (
                      <div className="inline-flex items-center gap-1.5 text-on-surface-variant text-xs py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      </div>
                    )}

                    {/* Assistant Footer Controls */}
                    {!isUser && msg.text && !msg.isStreaming && (
                      <div className="mt-2.5 pt-1.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span className="text-[10px] opacity-60">
                          Verified database response
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="inline-flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface-variant flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock (Grounded at Bottom) */}
        <div className="px-3 sm:px-6 pb-3 pt-2 border-t border-outline-variant/60 shrink-0 bg-surface-container-lowest">
          <div className="relative rounded-xl bg-surface-container-lowest border border-outline-variant focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40 transition-all p-2 sm:p-2.5 shadow-2xs">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              maxLength={2000}
              placeholder={placeholderText}
              dir={isRtl ? "rtl" : "auto"}
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none resize-none min-h-[38px] max-h-[140px] px-2 py-1 leading-relaxed selection:bg-primary/20"
            />

            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-outline-variant/40 mt-1 px-1">
              <span className="text-[11px] text-on-surface-variant/60 hidden sm:inline select-none">
                ↵ {t("pressEnterToSend") || "Enter to send"} • ⇧↵{" "}
                {t("shiftEnterForNewline") || "Shift + Enter for new line"}
              </span>
              <span className="text-[11px] text-on-surface-variant/60 sm:hidden">
                {input.length}/2000
              </span>

              <div className="flex items-center gap-2 ms-auto">
                {input.length > 500 && (
                  <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                    {input.length}/2000
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  {isStreaming ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
