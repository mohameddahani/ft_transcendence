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
  Sparkles,
  RefreshCw,
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
  ApiError,
  Role,
  SavedMessage,
} from "@/lib/assistant/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <div className="flex flex-col h-full overflow-hidden bg-card text-card-foreground">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-border/40 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span
            suppressHydrationWarning
            className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate"
          >
            {t("conversations") || "Conversations"}
          </span>
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
            / {threads.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={onNewChat}
            disabled={isStreaming}
            title={t("newChat") || "New Chat"}
            className="toota-pill h-7 px-2.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="size-3.5 me-1" />
            <span suppressHydrationWarning>{t("newChat") || "New"}</span>
          </Button>

          {isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCloseMobile}
              className="size-7 rounded-lg text-toota-muted hover:text-toota-ink"
              title="Close history"
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCollapseDesktop}
              className="size-7 rounded-lg text-toota-muted hover:text-toota-ink"
              title={t("toggleHistory") || "Collapse sidebar"}
            >
              <PanelLeftClose className="size-4 rtl:rotate-180" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="p-2.5 border-b border-border/40 shrink-0">
        <div className="relative flex items-center">
          <Search className="size-3.5 text-toota-muted absolute start-2.5 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchConversations") || "Search chats..."}
            className="h-8 text-xs ps-8 pe-7 bg-toota-inner border-border/40 text-toota-ink placeholder:text-toota-muted rounded-xl focus-visible:ring-1 focus-visible:ring-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute end-2 text-toota-muted hover:text-toota-ink cursor-pointer p-0.5"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Threads Grouped List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="py-8 text-center text-xs text-toota-muted" suppressHydrationWarning>
            {searchQuery
              ? t("noMatchingFeedback") || "No matching conversations"
              : t("noConversationsYet") || "No conversations recorded yet"}
          </div>
        ) : (
          groupedThreads.map((grp) => (
            <div key={grp.label} className="space-y-1">
              <span className="text-[10px] font-semibold text-toota-muted uppercase tracking-wider px-2" suppressHydrationWarning>
                {grp.label}
              </span>
              <div className="space-y-0.5">
                {grp.items.map((th) => {
                  const isActive = th.id === activeThreadId;
                  return (
                    <div
                      key={th.id}
                      onClick={() => onSelectThread(th.id)}
                      className={`group relative flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? "bg-toota-inner text-toota-ink font-semibold border-s-2 border-toota-green shadow-2xs"
                          : "text-toota-muted hover:text-toota-ink hover:bg-toota-inner/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs leading-snug">
                          {th.title}
                        </p>
                        <p className="text-[10px] text-toota-muted font-mono mt-0.5 tabular-nums">
                          {formatMessageTime(th.lastAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => onDeleteThread(e, th.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded-md transition-opacity cursor-pointer shrink-0"
                        title={t("deleteConversation") || "Delete conversation"}
                      >
                        <Trash2 className="size-3.5" />
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
        <div className="p-2.5 border-t border-border/40 shrink-0 flex items-center justify-between text-xs text-toota-muted">
          <span className="font-mono text-[10px] tabular-nums" suppressHydrationWarning>
            {threads.length} {t("conversations") || "chats"}
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 text-[11px] text-destructive/80 hover:text-destructive transition-colors cursor-pointer hover:underline"
          >
            <Trash2 className="size-3" />
            <span suppressHydrationWarning>{t("clearAllChats") || "Clear all"}</span>
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

  // Role initialized as null to prevent flashing
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

            const rawTime = (bth.last_at ||
              bthAny.lastAt ||
              bthAny.updated_at ||
              bthAny.updatedAt ||
              bthAny.created_at ||
              bthAny.createdAt) as string | undefined;

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
        setRole(userRole ? (userRole.toUpperCase() as Role) : null);
      }
    } catch {
      // NOTE: Never call toLogin() here! Calling toLogin() triggers a redirect to /login,
      // which the Next.js middleware immediately redirects to /dashboard if the admin is already authenticated.
      // Instead, mark AI connectivity as false so a clean reconnection card appears in-situ.
      setIsAiConnected(false);
      setRole(userRole ? (userRole.toUpperCase() as Role) : null);
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
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMsgId && m.id !== modelMsgId)
        );
        setInput(q);
      }

      if (err instanceof ApiError) {
        if (err.status === 401) {
          toast.error("AI service session expired. Please reconnect.");
          setIsAiConnected(false);
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

  // Categorized suggestions for the launchpad
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

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto pb-8">
      {/* 1. Top Header Card (Single Typographic Baseline Metric) */}
      <Card className="toota-card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1
                suppressHydrationWarning
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
              >
                {t("assistantTitle", "Operational AI Assistant")}
              </h1>
              {gymName && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {gymName}
                </span>
              )}
              {role && (
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                  / {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                </span>
              )}
              {/* Crisp Outlined Micro-Badge */}
              {isAiConnected ? (
                <span
                  suppressHydrationWarning
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs ms-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span suppressHydrationWarning>{t("aiConnected", "Connected")}</span>
                </span>
              ) : (
                <span
                  suppressHydrationWarning
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 ms-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span suppressHydrationWarning>{t("aiOffline", "Offline")}</span>
                </span>
              )}
            </div>
            <p
              suppressHydrationWarning
              className="text-xs sm:text-sm text-toota-muted mt-1 font-normal"
            >
              {t(
                "assistantSubtitle",
                "Instant gym intelligence, operational lookups, and member support powered by Gemini."
              )}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {role === "ADMIN" && (
              <Link
                href="/assistant/documents"
                className="toota-pill inline-flex items-center h-10 px-4 text-xs font-semibold border border-border/50 hover:bg-toota-inner text-toota-ink transition-colors cursor-pointer"
              >
                <BookOpen className="size-3.5 me-2 text-toota-muted" />
                <span suppressHydrationWarning>{t("manageDocuments", "Knowledge Documents")}</span>
              </Link>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => void init()}
              disabled={loadingMe}
              className="toota-pill h-10 px-4 text-xs font-semibold border-border/50 hover:bg-toota-inner text-toota-ink cursor-pointer"
            >
              <RefreshCw className={`size-3.5 me-2 ${loadingMe ? "animate-spin" : ""}`} />
              <span suppressHydrationWarning>{t("refresh", "Refresh")}</span>
            </Button>

            <Button
              type="button"
              onClick={handleNewChat}
              disabled={isStreaming}
              className="toota-pill h-10 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-3.5 me-1.5" />
              <span suppressHydrationWarning>{t("newChat", "New Chat")}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Main Workstation Card */}
      <Card className="toota-card border-none p-0 overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-12.5rem)] min-h-[620px] shadow-xs">
        {/* Left Collapsible History Sidebar (Desktop) */}
        <aside
          className={`hidden lg:flex flex-col border-e border-border/40 transition-all duration-300 ease-in-out shrink-0 ${
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

        {/* Mobile History Drawer Sheet */}
        {isMobileHistoryOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileHistoryOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] h-full bg-card text-card-foreground border-e border-border flex flex-col shadow-2xl z-10">
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

        {/* Right Chat Workstation */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
          {/* Workstation Top Bar */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40 shrink-0 bg-card">
            <div className="flex items-center gap-2.5 min-w-0">
              {!isSidebarOpen && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden lg:flex size-8 rounded-lg text-toota-muted hover:text-toota-ink"
                  title={t("toggleHistory") || "Open conversations list"}
                >
                  <PanelLeft className="size-4 rtl:rotate-180" />
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsMobileHistoryOpen(true)}
                className="lg:hidden size-8 rounded-lg text-toota-muted hover:text-toota-ink relative"
                title={t("chatHistory") || "View conversations history"}
              >
                <History className="size-4" />
                {threads.length > 0 && (
                  <span className="absolute -top-1 -end-1 size-2 rounded-full bg-primary" />
                )}
              </Button>

              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2
                    suppressHydrationWarning
                    className="text-xs sm:text-sm font-semibold text-toota-ink truncate"
                  >
                    {threadId
                      ? threads.find((th) => th.id === threadId)?.title || "Active Discussion"
                      : t("newConversation", "New Discussion")}
                  </h2>
                  <span
                    suppressHydrationWarning
                    className="font-mono text-[11px] text-toota-muted tabular-nums"
                  >
                    / {messages.length} {t("messages", "messages")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                disabled={isStreaming}
                className="toota-pill h-8 px-3 text-xs font-semibold cursor-pointer text-toota-muted hover:text-toota-ink"
              >
                <RotateCcw className="size-3.5 me-1.5" />
                <span suppressHydrationWarning>{t("newChat", "Reset")}</span>
              </Button>
            </div>
          </div>

          {/* Chat Stream Viewport */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 min-h-0 bg-background">
            {isLoadingThread ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-toota-muted text-xs">
                  <RefreshCw className="size-6 animate-spin text-toota-ink" />
                  <span suppressHydrationWarning>{t("loadingConversation", "Loading conversation...")}</span>
                </div>
              </div>
            ) : !isAiConnected && messages.length === 0 ? (
              /* Offline / Reconnect Fallback Card */
              <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto py-8">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                  <AlertCircle className="size-6" />
                </div>
                <h3
                  suppressHydrationWarning
                  className="font-semibold text-base text-toota-ink mb-1"
                >
                  {t("assistantUnavailable", "Assistant Service Standby")}
                </h3>
                <p
                  suppressHydrationWarning
                  className="text-xs text-toota-muted mb-4 leading-relaxed"
                >
                  {t(
                    "assistantUnavailableCard",
                    "Could not establish connection to the AI intelligence service. Click below to reconnect."
                  )}
                </p>
                <Button
                  type="button"
                  onClick={() => void init()}
                  disabled={loadingMe}
                  className="toota-pill h-9 px-5 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <RefreshCw className={`size-3.5 me-2 ${loadingMe ? "animate-spin" : ""}`} />
                  <span suppressHydrationWarning>{t("aiReconnect", "Reconnect Now")}</span>
                </Button>
              </div>
            ) : messages.length === 0 ? (
              /* Operational Launchpad (Suggestions) */
              <div className="h-full flex flex-col justify-center items-center text-center max-w-2xl mx-auto py-6">
                <div
                  suppressHydrationWarning
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs mb-4"
                >
                  <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                  <span suppressHydrationWarning>{t("aiOperationalConsole", "Operational Intelligence Console")}</span>
                </div>

                <h3 className="font-semibold text-xl text-toota-ink mb-1.5 tracking-tight">
                  {role === "ADMIN"
                    ? "What operational metric shall we review?"
                    : role === "STAFF"
                    ? "Front desk inquiries & member lookups"
                    : "How can we assist your workout today?"}
                </h3>

                <p className="text-xs text-toota-muted max-w-md mb-6 leading-relaxed">
                  {role === "ADMIN"
                    ? "Query membership rosters, upcoming expirations, monthly revenues, or club documents."
                    : role === "STAFF"
                    ? "Lookup member check-in history, verify active memberships, or review reception desk protocols."
                    : "Check your membership status, past visits, billing history, and gym policies."}
                </p>

                {/* 2x2 Launchpad Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left rtl:text-right">
                  {categorizedSuggestions.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-3.5 rounded-2xl bg-card border border-border/40 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-toota-muted pb-1 border-b border-border/40">
                        <group.icon className="size-3.5 text-toota-ink" />
                        <span>{group.category}</span>
                      </div>

                      <div className="space-y-1">
                        {group.items.map((item, iIdx) => (
                          <button
                            key={iIdx}
                            type="button"
                            onClick={() => handleSend(item.title)}
                            disabled={isStreaming}
                            className="w-full group flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-toota-inner border border-transparent hover:border-border/40 transition-all text-left rtl:text-right cursor-pointer"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-toota-ink group-hover:text-primary transition-colors leading-snug">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-toota-muted mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                            <ChevronRight className="size-3.5 text-toota-muted group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 shrink-0 mt-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Thread */
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <Avatar className="size-8 ring-1 ring-border/40 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                          AI
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`relative max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1.5 transition-all ${
                        isUser
                          ? "bg-toota-inner text-toota-ink border border-border/40"
                          : "bg-card text-toota-ink border border-border/40 shadow-2xs"
                      }`}
                    >
                      {/* Sender Metadata */}
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40 text-[11px] text-toota-muted select-none">
                        <span className="font-semibold text-toota-ink">
                          {isUser ? `You (${role || "User"})` : `${gymName} Assistant`}
                        </span>
                        {msg.timestamp && (
                          <span className="font-mono text-[10px] tabular-nums">
                            {msg.timestamp}
                          </span>
                        )}
                      </div>

                      {/* Tool Execution Micro-Badge */}
                      {msg.tool && (
                        <div className="py-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ring-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>{msg.tool}...</span>
                          </span>
                        </div>
                      )}

                      {/* Message Content (Strict Security: plain text, no innerHTML) */}
                      <p
                        dir="auto"
                        className="whitespace-pre-wrap font-sans break-words text-xs sm:text-[13px] leading-relaxed text-toota-ink"
                      >
                        {msg.text}
                      </p>

                      {/* Streaming Dots */}
                      {msg.isStreaming && !msg.text && (
                        <div className="inline-flex items-center gap-1 text-toota-muted py-1">
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                          <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                        </div>
                      )}

                      {/* Footer Actions */}
                      {!isUser && msg.text && !msg.isStreaming && (
                        <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-toota-muted">
                          <span className="text-[10px] opacity-70" suppressHydrationWarning>
                            {t("aiDisclaimer", "AI answer: verify operational figures")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="inline-flex items-center gap-1 hover:text-toota-ink transition-colors cursor-pointer"
                            title={t("copy", "Copy answer")}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500" suppressHydrationWarning>{t("copied", "Copied")}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span suppressHydrationWarning>{t("copy", "Copy")}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <Avatar className="size-8 ring-1 ring-border/40 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-toota-inner text-toota-ink font-semibold text-xs">
                          ME
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Dock */}
          <div className="p-3 sm:p-4 border-t border-border/40 shrink-0 bg-card">
            <div className="rounded-2xl bg-toota-inner border border-border/40 focus-within:ring-1 focus-within:ring-zinc-400 p-2 sm:p-2.5 transition-all">
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
                className="w-full bg-transparent text-xs sm:text-sm text-toota-ink placeholder:text-toota-muted focus:outline-hidden resize-none min-h-[38px] max-h-[140px] px-2 py-1 leading-relaxed"
              />

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 mt-1 px-1 text-xs">
                <span className="text-[11px] text-toota-muted hidden sm:inline select-none" suppressHydrationWarning>
                  ↵ {t("pressEnterToSend", "Enter to send")} • ⇧↵{" "}
                  {t("shiftEnterForNewline", "Shift + Enter for new line")}
                </span>

                <div className="flex items-center gap-2 ms-auto">
                  <span className="font-mono text-[11px] text-toota-muted tabular-nums">
                    {input.length}/2000
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isStreaming}
                    className="toota-pill h-7 px-3 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                    aria-label={t("send", "Send message")}
                  >
                    {isStreaming ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline me-1" suppressHydrationWarning>{t("send", "Send")}</span>
                        <Send className="size-3 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
