

'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import type { ChatMessage, ChatSession } from '@/types/chat';

type ViewerProfile = {
  id: string;
  full_name: string | null;
  email?: string | null;
};

type MessagesResponse = {
  messages: ChatMessage[];
  nextCursor: {
    createdAt: string;
    id: string;
  } | null;
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [aiReplying, setAiReplying] = useState(false);
  const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);

  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<{
    createdAt: string;
    id: string;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const didInitScrollRef = useRef(false);
  const shouldStickToBottomRef = useRef(false);
  const loadingOlderRef = useRef(false);

  const userDisplayName = viewerProfile?.full_name?.trim() || 'You';

  useEffect(() => {
    const handleOpenChatWidget = () => {
      setOpen(true);
    };

    window.addEventListener('lofty:open-chat-widget', handleOpenChatWidget);
    return () => window.removeEventListener('lofty:open-chat-widget', handleOpenChatWidget);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const isNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;

    const threshold = 120;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  const mergeUniqueMessages = (
    current: ChatMessage[],
    incoming: ChatMessage[],
    mode: 'replace' | 'prepend' | 'append'
  ) => {
    const map = new Map<string, ChatMessage>();

    if (mode === 'replace') {
      for (const msg of incoming) {
        map.set(msg.id, msg);
      }
    }

    if (mode === 'prepend') {
      for (const msg of incoming) {
        map.set(msg.id, msg);
      }
      for (const msg of current) {
        map.set(msg.id, msg);
      }
    }

    if (mode === 'append') {
      for (const msg of current) {
        map.set(msg.id, msg);
      }
      for (const msg of incoming) {
        map.set(msg.id, msg);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const fetchMessagesPage = async (
    sessionId: string,
    cursor?: { createdAt: string; id: string } | null
  ) => {
    const params = new URLSearchParams({
      sessionId,
      limit: String(PAGE_SIZE),
    });

    if (cursor?.createdAt && cursor?.id) {
      params.set('cursorCreatedAt', cursor.createdAt);
      params.set('cursorId', cursor.id);
    }

    const res = await fetch(`/api/chat/message?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = (await res.json()) as MessagesResponse | { error?: string };

    if (!res.ok) {
      throw new Error(
        'error' in data && data.error ? data.error : 'Failed to load messages.'
      );
    }

    return data as MessagesResponse;
  };

  const loadOlderMessages = async () => {
    if (!session || !hasMore || !nextCursor || loadingOlderRef.current) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    loadingOlderRef.current = true;
    setLoadingOlder(true);

    try {
      const data = await fetchMessagesPage(session.id, nextCursor);

      setMessages((prev) => mergeUniqueMessages(prev, data.messages, 'prepend'));
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);

      requestAnimationFrame(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (error) {
      console.error('Load older messages failed:', error);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadViewerProfile = async () => {
      try {
        const data = await apiGet<{
          user: { id: string; email?: string; fullName?: string };
          profile: { full_name?: string | null; email?: string | null } | null;
        }>('/api/profile/me');

        if (!cancelled) {
          setViewerProfile({
            id: data.user.id,
            full_name: data.profile?.full_name ?? data.user.fullName ?? null,
            email: data.profile?.email ?? data.user.email ?? null,
          });
        }
      } catch {
        if (!cancelled) setViewerProfile(null);
      }
    };

    void loadViewerProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      try {
        setInitialLoading(true);
        setInitError(null);
        setAiReplying(false);
        setMessages([]);
        setHasMore(false);
        setNextCursor(null);
        didInitScrollRef.current = false;

        const sessionRes = await fetch('/api/chat/session', {
          method: 'POST',
        });

        const sessionJson = await sessionRes.json();

        if (!sessionRes.ok) {
          if (!cancelled) {
            setInitError(sessionJson.error || 'Failed to load chat session.');
          }
          return;
        }

        const currentSession = sessionJson.session as ChatSession;

        if (cancelled) return;

        setSession(currentSession);

        const page = await fetchMessagesPage(currentSession.id);

        if (cancelled) return;

        setMessages(page.messages);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);

        requestAnimationFrame(() => {
          scrollToBottom('auto');
          didInitScrollRef.current = true;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setInitError('Something went wrong while loading the chat.');
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    let timer: number | null = null;

    const pollMessages = async () => {
      try {
        const data = await fetchMessagesPage(session.id, null);
        if (cancelled) return;

        setMessages((prev) => {
          const merged = mergeUniqueMessages(prev, data.messages, 'append');
          const hasNew = merged.length > prev.length;

          if (hasNew) {
            const hasAiMessage = data.messages.some((message) => message.sender === 'ai');
            if (hasAiMessage) setAiReplying(false);
            requestAnimationFrame(() => {
              if (didInitScrollRef.current && isNearBottom()) {
                scrollToBottom('smooth');
              }
            });
          }

          return merged;
        });
      } catch (error) {
        console.error('Chat polling failed:', error);
      }
    };

    timer = window.setInterval(() => {
      void pollMessages();
    }, 5000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !open) return;

    const handleScroll = () => {
      if (container.scrollTop <= 80 && hasMore && !loadingOlder) {
        void loadOlderMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [open, hasMore, loadingOlder, nextCursor, session]);

  const triggerAiReply = async (sessionId: string, content: string) => {
    try {
      setAiReplying(true);

      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiReplying(false);

        const fallbackMessage: ChatMessage = {
          id: `ai-error-${Date.now()}`,
          session_id: sessionId,
          sender: 'ai',
          content: 'Sorry, I could not reply just now. Please try again.',
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => mergeUniqueMessages(prev, [fallbackMessage], 'append'));
        requestAnimationFrame(() => scrollToBottom('smooth'));

        console.error('AI reply failed:', data);
        return;
      }

      if (data.message) {
        const insertedAiMessage = data.message as ChatMessage;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === insertedAiMessage.id);
          if (exists) return prev;
          return mergeUniqueMessages(prev, [insertedAiMessage], 'append');
        });

        requestAnimationFrame(() => scrollToBottom('smooth'));
      }

      setAiReplying(false);
    } catch (error) {
      setAiReplying(false);

      const fallbackMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        session_id: sessionId,
        sender: 'ai',
        content: 'Sorry, I could not reply just now. Please try again.',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => mergeUniqueMessages(prev, [fallbackMessage], 'append'));
      requestAnimationFrame(() => scrollToBottom('smooth'));

      console.error('AI reply failed:', error);
    }
  };

  const sendMessage = async () => {
    if (!session || !input.trim() || loading || initialLoading || !!initError) {
      return;
    }

    const content = input.trim();

    shouldStickToBottomRef.current = isNearBottom();

    setLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInput(content);
        return;
      }

      if (data.message) {
        const insertedMessage = data.message as ChatMessage;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === insertedMessage.id);
          if (exists) return prev;
          return mergeUniqueMessages(prev, [insertedMessage], 'append');
        });

        requestAnimationFrame(() => scrollToBottom('smooth'));
      }

      await triggerAiReply(session.id, content);
    } catch (error) {
      setInput(content);
      console.error('Send message failed:', error);
    } finally {
      setLoading(false);
      shouldStickToBottomRef.current = false;
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-auto sm:right-5">
        <div className="flex h-[min(680px,calc(100vh-2rem))] w-full max-w-[420px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] text-[var(--text)] shadow-[var(--shadow-lg)]">
          <div className="relative border-b border-[var(--border)] bg-[var(--card)] px-5 py-4">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--primary-soft)] via-transparent to-[var(--bg-soft)] opacity-80" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--primary)]/15 bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-sm)]">
                    Lofty
                  </div>

                  <div className="relative">
                    <div className="font-semibold tracking-tight text-[var(--text)]">小马哥</div>
                    <div className="text-xs font-medium text-[var(--text-soft)]">
                      AI助手
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setAiReplying(false);
                }}
                className="relative rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)]"
              >
                关闭
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto bg-[var(--bg-soft)] px-4 py-4"
          >
            {initialLoading ? (
              <div className="mt-14 text-center text-sm font-medium text-[var(--text-soft)]">
                Loading chat...
              </div>
            ) : initError ? (
              <div className="mt-14 rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-center text-sm font-medium text-[var(--danger)]">
                {initError}
              </div>
            ) : messages.length === 0 ? (
              <div className="mt-14 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-5 text-center text-sm leading-7 text-[var(--text-soft)] shadow-[var(--shadow-sm)]">
                Hi! Ask me anything about IELTS, PTE, writing, speaking, or
                vocabulary.
              </div>
            ) : (
              <div className="space-y-4">
                {hasMore && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => void loadOlderMessages()}
                      disabled={loadingOlder}
                      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--primary)]/30 hover:text-[var(--primary)] disabled:opacity-60"
                    >
                      {loadingOlder ? 'Loading...' : 'Load earlier messages'}
                    </button>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[84%]">
                        <div className={`mb-1 px-1 text-[11px] font-semibold text-[var(--text-faint)] ${isUser ? 'text-right' : 'text-left'}`}>
                          {isUser ? userDisplayName : isAi ? 'Ibot' : '马老师'}
                        </div>

                        <div className={`rounded-[var(--radius-md)] px-4 py-3 text-sm leading-6 shadow-[var(--shadow-sm)] ${isUser ? 'bg-[var(--primary)] text-white' : isAi ? 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)]' : 'border border-[var(--border)] bg-[var(--card-soft)] text-[var(--text)]'}`}>
                          <div className="whitespace-pre-wrap wrap-break-word">
                            {msg.content}
                          </div>

                          <div className={`mt-2 text-[10px] ${isUser ? 'text-white/70' : 'text-[var(--text-faint)]'}`}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aiReplying && (
                  <div className="flex justify-start">
                    <div className="max-w-[84%]">
                      <div className="mb-1 px-1 text-[11px] font-semibold text-[var(--text-faint)]">
                        Ibot
                      </div>

                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--text)] shadow-[var(--shadow-sm)]">
                        <div className="flex items-center gap-2">
                          <span>Ibot 思考中</span>
                          <span className="inline-flex gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-soft)]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-soft)] [animation-delay:0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--text-soft)] [animation-delay:0.3s]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-4">
            <div className="flex gap-3">
              <div className="flex flex-1 items-end rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 shadow-[var(--shadow-sm)] focus-within:border-[var(--primary)]/45">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入你的问题..."
                  rows={2}
                  className="min-h-11 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={initialLoading || !!initError || loading}
                />

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={
                    loading || initialLoading || !input.trim() || !!initError
                  }
                  className="ml-2 rounded-[var(--radius-sm)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Sending...' : '发送'}
                </button>
              </div>
            </div>

            <div className="mt-2 px-1 text-[11px] font-medium text-[var(--text-faint)]">
              Enter 发送，Shift+Enter 换行
            </div>
          </div>
        </div>
    </div>
  );
}
