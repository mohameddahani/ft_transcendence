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
  lastAt: string;
  messageCount?: number;
}

function formatMessageTime(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    const datePart = d.toLocaleDateString([], { day: "numeric", month: "short" });
    const timePart = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${datePart}, ${timePart}`;
  } catch {
    return "";
  }
}

function formatThreadDate(isoStr?: string): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  } catch {
    return "";
  }
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
      if (!th.lastAt) {
        groups[3].items.push(th);
        return;
      }
      const time = new Date(th.lastAt).getTime();
      if (isNaN(time)) {
        groups[3].items.push(th);
        return;
      }
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-outline-variant/60 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-primary shrink-0" />
          <span className="font-semibold text-xs uppercase tracking-wider text-on-surface truncate" suppressHydrationWarning>
            {t("conversations") || "Conversations"}
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
                            {formatThreadDate(th.lastAt)}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
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
  const { role: userRole, companyName } = useCurrentUser();

  // Role initialized as null to prevent role flashing
  const [role, setRole] = useState<Role | null>(null);
  const [gymName, setGymName] = useState<string>("Gym");
  const [loadingMe, setLoadingMe] = useState(true);
  const [isAiConnected, setIsAiConnected] = useState<boolean | null>(null);

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

  // Fetch threads list from backend without overwriting existing timestamps
  const fetchThreads = useCallback(async () => {
    try {
      const backendThreads = await listThreads();
      if (Array.isArray(backendThreads)) {
        setThreads((prevThreads) => {
          const prevMap = new Map<string, ChatThread>();
          prevThreads.forEach((th) => {
            if (th.id) prevMap.set(th.id, th);
          });

          return backendThreads.map((bth) => {
            const bthAny = bth as Record<string, unknown>;
            const tid = (bth.thread_id || bthAny.id || "") as string;
            const existing = prevMap.get(tid);

            // Extract the actual timestamp from whatever property the backend or cache sent
            const rawTime = (bth.last_at ||
              bthAny.lastAt ||
              bthAny.updated_at ||
              bthAny.updatedAt ||
              bthAny.created_at ||
              bthAny.createdAt) as string | undefined;

            // Preserve existing thread timestamp; only use fallback if genuinely new and unknown
            const validTime =
              typeof rawTime === "string" && rawTime.trim()
                ? rawTime
                : existing?.lastAt || new Date().toISOString();

            return {
              id: tid,
              title: bth.title || existing?.title || "Conversation",
              lastAt: validTime,
              messageCount:
                (bthAny.message_count as number | undefined) ||
                existing?.messageCount,
            };
          });
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Initialize role and check AI connectivity
  const init = useCallback(async () => {
    setLoadingMe(true);
    try {
      const me = await getMe();
      if (me && me.role) {
        setRole(me.role);
        if (me.gym_name) {
          setGymName(me.gym_name);
        } else if (companyName) {
          setGymName(companyName);
        }
        setIsAiConnected(true);

        // Fetch remote threads for caller
        await fetchThreads();

        // Restore tab session thread if one exists
        const savedThreadId = sessionStorage.getItem("assistant_thread_id");
        if (savedThreadId) {
          setThreadId(savedThreadId);
          const threadMessages = await getThread(savedThreadId);
          if (Array.isArray(threadMessages) && threadMessages.length > 0) {
            setMessages(
              threadMessages.map((msg: SavedMessage, idx: number) => {
                const msgAny = msg as Record<string, unknown>;
                const rawCreatedAt = (msg.created_at ||
                  msgAny.createdAt ||
                  msgAny.timestamp ||
                  msgAny.updated_at) as string | undefined;
                return {
                  id: `saved-${idx}-${Date.now()}`,
                  role: msg.role,
                  text: msg.text,
                  timestamp: formatMessageTime(rawCreatedAt),
                };
              })
            );
          }
        }
      } else {
        setIsAiConnected(false);
        setRole(null);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        const resolvedRole =
          userRole ? (userRole.toUpperCase() as Role) : undefined;
        toLogin(resolvedRole);
        return;
      }
      setIsAiConnected(false);
      setRole(null);
    } finally {
      setLoadingMe(false);
    }
  }, [companyName, userRole, fetchThreads]);

  useEffect(() => {
    void init();
  }, [init]);

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
          threadMessages.map((msg: SavedMessage, idx: number) => {
            const msgAny = msg as Record<string, unknown>;
            const rawCreatedAt = (msg.created_at ||
              msgAny.createdAt ||
              msgAny.timestamp ||
              msgAny.updated_at) as string | undefined;
            return {
              id: `saved-${idx}-${selectedId}`,
              role: msg.role,
              text: msg.text,
              timestamp: formatMessageTime(rawCreatedAt),
            };
          })
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
  const handleDeleteThread = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      t("deleteConversationConfirm") ||
        "Are you sure you want to delete this conversation?"
    );
    if (!confirmed) return;

    try {
      await deleteThreadApi(targetId);
    } catch {
      // ignore
    }

    setThreads((prev) => prev.filter((th) => th.id !== targetId));

    if (targetId === threadId) {
      sessionStorage.removeItem("assistant_thread_id");
      setThreadId(null);
      setMessages([]);
    }

    toast.info(t("conversationDeleted") || "Conversation deleted");
  };

  // Clear all thread history
  const handleClearAllHistory = async () => {
    if (threads.length === 0) return;
    const confirmed = window.confirm(
      t("clearAllChatsConfirm") ||
        "Are you sure you want to delete all saved conversations?"
    );
    if (!confirmed) return;

    for (const th of threads) {
      try {
        await deleteThreadApi(th.id);
      } catch {
        // ignore
      }
    }

    setThreads([]);
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

    const nowFormatted = formatMessageTime(new Date().toISOString());
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
    let hasReceivedTokens = false;

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
                  ? { ...th, lastAt: new Date().toISOString() }
                  : th
              );
            } else {
              const cleanTitle =
                q.length > 45 ? q.slice(0, 45).trim() + "..." : q.trim();
              const newThread: ChatThread = {
                id: tid,
                title: cleanTitle,
                lastAt: new Date().toISOString(),
                messageCount: 2,
              };
              nextList = [newThread, ...prev];
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
          hasReceivedTokens = true;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? { ...m, text: m.text + data.text, tool: null }
                : m
            )
          );
        } else if (event === "error") {
          const interruptedNotice =
            t("streamInterrupted") ||
            "The answer was interrupted. Please try again.";
          const genericError =
            data.message ||
            t("assistantUnavailable") ||
            "Assistant unavailable.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? {
                    ...m,
                    text: m.text
                      ? `${m.text}\n\n${interruptedNotice}`
                      : genericError,
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

          // Refresh threads from backend
          void fetchThreads();
        }
      });
    } catch (err: unknown) {
      if (hasReceivedTokens) {
        // If partial text has already arrived, retain it and append the interrupted notice
        const interruptedNotice =
          t("streamInterrupted") ||
          "The answer was interrupted. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId
              ? {
                  ...m,
                  text: m.text
                    ? `${m.text}\n\n${interruptedNotice}`
                    : interruptedNotice,
                  isStreaming: false,
                  tool: null,
                }
              : m
          )
        );
      } else {
        // Revert optimistic messages and restore user question
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMsgId && m.id !== modelMsgId)
        );
        setInput(q);
      }

      if (err instanceof ApiError) {
        if (err.status === 401) {
          const resolvedRole =
            role || (userRole ? (userRole.toUpperCase() as Role) : undefined);
          toLogin(resolvedRole);
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

  // Categorized suggestions
  const categorizedSuggestions = useMemo(() => {
    if (role === "ADMIN") {
      return [
        {
          category: t("catOperationsAttendance") || "Operations & Attendance",
          icon: Activity,
          items: [
            {
              title: t("suggestion1_admin") || "How is the gym doing today?",
              subtitle: t("subHowGymDoing") || "Real-time member status and today's check-ins",
              icon: Building2,
            },
            {
              title: t("suggestion2_admin") || "Who expires this week?",
              subtitle: t("subWhoExpiresWeek") || "Members with plans ending within 7 days",
              icon: Layers,
            },
          ],
        },
        {
          category: t("catFinancialsPolicies") || "Financials & Policies",
          icon: DollarSign,
          items: [
            {
              title:
                t("suggestion3_admin") || "How much did we make last month?",
              subtitle: t("subHowMuchMade") || "Aggregated monthly billing totals",
              icon: DollarSign,
            },
            {
              title:
                t("suggestion4_admin") ||
                "How many days notice do members need to cancel?",
              subtitle: t("subCancellationDays") || "Extracted from gym policy documents",
              icon: BookOpen,
            },
          ],
        },
      ];
    }

    if (role === "STAFF") {
      return [
        {
          category: t("catFrontDeskRenewals") || "Front Desk & Renewals",
          icon: CalendarCheck,
          items: [
            {
              title: t("suggestion1_staff") || "Who expires this week?",
              subtitle: t("subMembersExpiringSoon") || "Members with renewals due soon",
              icon: Layers,
            },
            {
              title:
                t("suggestion2_staff") || "Who hasn't come for 3 weeks?",
              subtitle: t("subSpotInactiveMembers") || "Spot inactive members needing retention",
              icon: Clock,
            },
          ],
        },
        {
          category: t("catProceduresInquiries") || "Procedures & Inquiries",
          icon: HelpCircle,
          items: [
            {
              title:
                t("suggestion3_staff") || "Show me the negative feedback",
              subtitle: t("subShowNegativeFeedback") || "Member dissatisfaction tickets to address",
              icon: MessageSquare,
            },
            {
              title:
                t("suggestion4_staff") ||
                "What discount can I give at reception?",
              subtitle: t("subFrontDeskDiscount") || "Standard front-desk policy guidance",
              icon: ShieldCheck,
            },
          ],
        },
      ];
    }

    // MEMBER suggestions
    return [
      {
        category: t("catMyMembership") || "My Membership",
        icon: User,
        items: [
          {
            title:
              t("suggestion1_member") || "When does my membership end?",
            subtitle: t("subWhenMembershipEnds") || "Your active plan expiry date",
            icon: Clock,
          },
          {
            title:
              t("suggestion2_member") ||
              "How many times did I come this month?",
            subtitle: t("subHowManyTimesCame") || "Your workout check-in history",
            icon: Activity,
          },
        ],
      },
      {
        category: t("catClubGuidelines") || "Club Guidelines",
        icon: BookOpen,
        items: [
          {
            title:
              t("suggestion3_member") ||
              "What are the opening hours on Sunday?",
            subtitle: t("subSundayOpeningHours") || "Facility schedule and hours",
            icon: Clock,
          },
          {
            title: t("suggestion4_member") || "Can I bring a friend?",
            subtitle: t("subBringFriendPolicy") || "Guest pass and visitor policy",
            icon: User,
          },
        ],
      },
    ];
  }, [role, t]);

  const placeholderText = useMemo(() => {
    if (role === "ADMIN") {
      return (
        t("askPlaceholderAdmin") ||
        "Ask about gym members, expiring memberships, revenue, or documents..."
      );
    }
    if (role === "STAFF") {
      return (
        t("askPlaceholderStaff") ||
        "Ask about gym members, expiring memberships, or documents..."
      );
    }
    return (
      t("askPlaceholderMember") ||
      "Ask about your membership, visits, payments, or gym rules..."
    );
  }, [role, t]);

  // Loading spinner on initial load
  if (loadingMe) {
    return (
      <div className="w-full flex items-center justify-center h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-2xs">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant text-sm">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span>{t("connectingToAssistant") || "Connecting to assistant..."}</span>
        </div>
      </div>
    );
  }

  // Offline Fallback Card if AI Service is unreachable
  if (isAiConnected === false || role === null) {
    return (
      <div className="w-full flex items-center justify-center h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-6 shadow-2xs">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-headline font-bold text-lg sm:text-xl text-on-surface">
            {t("assistantUnavailable") || "The assistant is unavailable right now."}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {t("assistantUnavailableCard") ||
              "The assistant is unavailable right now. Please try again later."}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => void init()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("tryAgain") || "Try again"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t("connected") || "Connected"}
                </span>
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
            {/* Knowledge Documents Link (Admin Only) */}
            {role === "ADMIN" && (
              <Link
                href="/assistant/documents"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-on-surface transition-colors cursor-pointer"
                title={t("manageDocuments") || "Knowledge Documents"}
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

        {/* Main Chat Stream Container */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 min-h-0">
          {isLoadingThread ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-on-surface-variant text-sm">
                <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>
                  {t("loadingConversation") || "Loading conversation..."}
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

                    {/* Assistant Footer Controls: Advisory Disclaimer & Copy Action */}
                    {!isUser && msg.text && !msg.isStreaming && (
                      <div className="mt-2.5 pt-1.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span className="text-[10px] opacity-60">
                          {t("aiDisclaimer") || "AI answer: check important numbers"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="inline-flex items-center gap-1 hover:text-on-surface transition-colors cursor-pointer"
                          title={t("copy") || "Copy answer"}
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">{t("copied") || "Copied"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{t("copy") || "Copy"}</span>
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
                  aria-label={t("send") || "Send message"}
                >
                  {isStreaming ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span>{t("send") || "Send"}</span>
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
