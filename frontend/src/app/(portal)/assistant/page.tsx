"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  getMe,
  getThread,
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

export default function AssistantPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const [role, setRole] = useState<Role>("ADMIN");
  const [gymName, setGymName] = useState<string>("Gym");
  const [loadingMe, setLoadingMe] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Load User Info and saved thread on mount
  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const me = await getMe();
        if (ignore) return;
        setRole(me.role);
        setGymName(me.gym_name);

        // Check for tab session thread
        const savedThreadId = sessionStorage.getItem("assistant_thread_id");
        if (savedThreadId) {
          setThreadId(savedThreadId);
          threadIdRef.current = savedThreadId;
          try {
            const threadMessages = await getThread(savedThreadId);
            if (!ignore && Array.isArray(threadMessages) && threadMessages.length > 0) {
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
          } catch {
            sessionStorage.removeItem("assistant_thread_id");
            setThreadId(null);
            threadIdRef.current = null;
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError && err.status === 401) {
            toLogin();
            return;
          }
          console.error("Failed to load user identity:", err);
        }
      } finally {
        if (!ignore) setLoadingMe(false);
      }
    }

    void init();

    return () => {
      ignore = true;
    };
  }, []);

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
        return t("tool_list_expiring_memberships") || "Checking expiring memberships";
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
      { id: modelMsgId, role: "model", text: "", isStreaming: true, timestamp: nowFormatted },
    ]);

    setIsStreaming(true);

    try {
      await streamChat(q, threadIdRef.current, (event, data) => {
        if (event === "start" && data.thread_id) {
          const tid = data.thread_id;
          setThreadId(tid);
          threadIdRef.current = tid;
          sessionStorage.setItem("assistant_thread_id", tid);
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
          const errorMsg = data.message || t("assistantUnavailable") || "Assistant unavailable.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId
                ? { ...m, text: m.text ? m.text : errorMsg, isStreaming: false, tool: null }
                : m
            )
          );
        } else if (event === "done") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === modelMsgId ? { ...m, isStreaming: false, tool: null } : m
            )
          );
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
          const waitMsg = t("rateLimitWait", {
            seconds: err.retryAfter || 60,
          }) || `Too many questions. Try again in ${err.retryAfter || 60} seconds.`;
          toast.warning(waitMsg);
          return;
        }
        if (err.detail) {
          toast.error(err.detail);
          return;
        }
      }
      toast.error(t("assistantUnavailable") || "Can't reach the assistant right now.");
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

  // Reset thread
  const handleNewChat = () => {
    if (messages.length > 0 && isStreaming) return;
    sessionStorage.removeItem("assistant_thread_id");
    setThreadId(null);
    threadIdRef.current = null;
    setMessages([]);
    toast.info(t("newChat") || "New conversation started");
    textareaRef.current?.focus();
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
            category: "Operations & Attendance",
            icon: Activity,
            items: [
              {
                title: t("suggestion1_admin") || "How is the gym doing today?",
                subtitle: "Real-time member status and today's check-ins",
                icon: Building2,
              },
              {
                title: t("suggestion2_admin") || "Who expires this week?",
                subtitle: "List of members due for membership renewal",
                icon: Layers,
              },
            ],
          },
          {
            category: "Financials & Policies",
            icon: DollarSign,
            items: [
              {
                title: t("suggestion3_admin") || "How much did we make last month?",
                subtitle: "Monthly billing summary and revenue figures",
                icon: DollarSign,
              },
              {
                title:
                  t("suggestion4_admin") ||
                  "How many days notice do members need to cancel?",
                subtitle: "Cancellation requirements from club policies",
                icon: BookOpen,
              },
            ],
          },
        ]
      : role === "STAFF"
      ? [
          {
            category: "Front Desk & Renewals",
            icon: CalendarCheck,
            items: [
              {
                title: t("suggestion1_staff") || "Who expires this week?",
                subtitle: "Members expiring soon for front desk renewal alerts",
                icon: Layers,
              },
              {
                title: t("suggestion2_staff") || "Who hasn't come for 3 weeks?",
                subtitle: "Spot inactive members for check-in follow-ups",
                icon: Clock,
              },
            ],
          },
          {
            category: "Procedures & Inquiries",
            icon: HelpCircle,
            items: [
              {
                title: t("suggestion3_staff") || "Show me the negative feedback",
                subtitle: "Recent member feedback requiring attention",
                icon: MessageSquare,
              },
              {
                title:
                  t("suggestion4_staff") ||
                  "What discount can I give at reception?",
                subtitle: "Front desk discount limits from staff handbook",
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : [
          {
            category: "My Membership",
            icon: User,
            items: [
              {
                title: t("suggestion1_member") || "When does my membership end?",
                subtitle: "Check your active plan renewal date",
                icon: Clock,
              },
              {
                title:
                  t("suggestion2_member") ||
                  "How many times did I come this month?",
                subtitle: "Your personal workout check-in history",
                icon: Activity,
              },
            ],
          },
          {
            category: "Club Guidelines",
            icon: BookOpen,
            items: [
              {
                title:
                  t("suggestion3_member") ||
                  "What are the opening hours on Sunday?",
                subtitle: "Weekend schedules and facility timing",
                icon: Clock,
              },
              {
                title: t("suggestion4_member") || "Can I bring a friend?",
                subtitle: "Guest policy and day-pass terms",
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
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-9.5rem)]">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between gap-3 pb-3.5 mb-2 border-b border-outline-variant/70 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-lg sm:text-xl text-on-surface truncate">
                {gymName} {t("navAiAssistant") || "Assistant"}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/50 uppercase tracking-wider">
                {role}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant truncate hidden sm:block mt-0.5">
              {role === "ADMIN"
                ? "Direct facility database queries, financial telemetry, and policy documents"
                : role === "STAFF"
                ? "Member directory lookup, front desk guidelines, and procedure checks"
                : "Personal workout records, active membership status, and gym policies"}
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Knowledge Documents Link (Admin Only) */}
          {role === "ADMIN" && (
            <Link
              href="/assistant/documents"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-on-surface transition-colors cursor-pointer"
              title="Manage Knowledge Base Documents"
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">
                {t("manageDocuments") || "Knowledge Documents"}
              </span>
            </Link>
          )}

          {/* Reset Conversation Button */}
          <button
            type="button"
            onClick={handleNewChat}
            disabled={isStreaming}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:text-primary bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 transition-colors disabled:opacity-40 cursor-pointer"
            title={t("newChat") || "Start new conversation"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("newChat") || "New Thread"}</span>
          </button>
        </div>
      </header>

      {/* Main Chat Stream Container */}
      <div className="flex-1 overflow-y-auto px-1 py-3 space-y-4 min-h-0 pr-2">
        {loadingMe ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-on-surface-variant text-sm">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span>Connecting to {gymName} database...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Human-Engineered Operational Launchpad */
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

            {/* Structured Categorized Launchpad Grid */}
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
                  className={`relative max-w-[88%] sm:max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed transition-all ${
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
                      <span className="text-[10px] opacity-70">{msg.timestamp}</span>
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
                      <span className="text-[10px] opacity-60">Verified database response</span>
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
      <div className="mt-2 pt-2 border-t border-outline-variant/60 shrink-0">
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
  );
}

