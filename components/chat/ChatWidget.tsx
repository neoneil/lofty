

'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setViewerProfile(null);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled) {
        if (profile) {
          setViewerProfile(profile);
        } else {
          setViewerProfile({
            id: user.id,
            full_name: null,
            email: user.email ?? null,
          });
        }
      }
    };

    void loadViewerProfile();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

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

    const channel = supabase
      .channel(`chat-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return mergeUniqueMessages(prev, [newMessage], 'append');
          });

          if (newMessage.sender === 'ai') {
            setAiReplying(false);
          }

          if (newMessage.sender === 'user' || newMessage.sender === 'ai') {
            requestAnimationFrame(() => {
              if (didInitScrollRef.current) {
                scrollToBottom('smooth');
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, supabase]);

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

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="group rounded-full border px-5 py-3 text-sm font-medium shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: '#22c55e' }}
            />
            Chat with Ibot
          </span>
        </button>
      ) : (
        <div
          className="flex h-155 w-97.5 flex-col overflow-hidden rounded-[28px] border shadow-2xl"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          <div
            className="relative border-b px-5 py-4"
            style={{
              borderColor: 'var(--border)',
              background:
                'linear-gradient(135deg, var(--navbar-bg) 0%, var(--footer-bg) 100%)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      color: 'var(--primary)',
                    }}
                  >
                    IB
                  </div>

                  <div>
                    <div className="font-semibold">Ibot</div>
                    <div
                      className="text-xs"
                      style={{ color: 'rgba(17,17,17,0.72)' }}
                    >
                      Lofty - AI 
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  setAiReplying(false);
                }}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.65)',
                  color: 'var(--text)',
                }}
              >
                关闭
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            {initialLoading ? (
              <div
                className="mt-14 text-center text-sm"
                style={{ color: 'var(--muted)' }}
              >
                Loading chat...
              </div>
            ) : initError ? (
              <div className="mt-14 text-center text-sm text-red-500">
                {initError}
              </div>
            ) : messages.length === 0 ? (
              <div
                className="mt-14 rounded-2xl border px-4 py-5 text-center text-sm shadow-sm"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--muted)',
                }}
              >
                Hi! Ask me anything about IELTS, PTE, writing, speaking, or
                vocabulary.
              </div>
            ) : (
              <div className="space-y-4">
                {hasMore && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => void loadOlderMessages()}
                      disabled={loadingOlder}
                      className="rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--muted)',
                      }}
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
                        <div
                          className={`mb-1 px-1 text-[11px] font-medium ${
                            isUser ? 'text-right' : 'text-left'
                          }`}
                          style={{ color: 'var(--muted)' }}
                        >
                          {isUser ? userDisplayName : isAi ? 'Ibot' : '马老师'}
                        </div>

                        <div
                          className="rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm"
                          style={{
                            backgroundColor: isUser
                              ? 'var(--primary)'
                              : isAi
                              ? 'var(--card)'
                              : 'var(--card-soft)',
                            color: isUser ? '#ffffff' : 'var(--text)',
                            border: isUser ? 'none' : `1px solid var(--border)`,
                          }}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>

                          <div
                            className="mt-2 text-[10px]"
                            style={{
                              color: isUser
                                ? 'rgba(255,255,255,0.72)'
                                : 'var(--muted)',
                            }}
                          >
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
                      <div
                        className="mb-1 px-1 text-[11px] font-medium"
                        style={{ color: 'var(--muted)' }}
                      >
                        Ibot
                      </div>

                      <div
                        className="rounded-[22px] border px-4 py-3 text-sm shadow-sm"
                        style={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>Ibot 思考中</span>
                          <span className="inline-flex gap-1">
                            <span
                              className="h-1.5 w-1.5 animate-bounce rounded-full"
                              style={{ backgroundColor: 'var(--muted)' }}
                            />
                            <span
                              className="h-1.5 w-1.5 animate-bounce rounded-full"
                              style={{
                                backgroundColor: 'var(--muted)',
                                animationDelay: '0.15s',
                              }}
                            />
                            <span
                              className="h-1.5 w-1.5 animate-bounce rounded-full"
                              style={{
                                backgroundColor: 'var(--muted)',
                                animationDelay: '0.3s',
                              }}
                            />
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

          <div
            className="border-t px-4 py-4"
            style={{
              borderColor: 'var(--border)',
              backgroundColor: 'var(--card)',
            }}
          >
            <div className="flex gap-3">
              <div
                className="flex flex-1 items-end rounded-3xl border px-3 py-2 shadow-sm"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg)',
                }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入你的问题..."
                  rows={2}
                  className="min-h-11 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none"
                  style={{ color: 'var(--text)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  disabled={initialLoading || !!initError || loading}
                />

                <button
                  onClick={() => void sendMessage()}
                  disabled={
                    loading || initialLoading || !input.trim() || !!initError
                  }
                  className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {loading ? 'Sending...' : '发送'}
                </button>
              </div>
            </div>

            <div
              className="mt-2 px-1 text-[11px]"
              style={{ color: 'var(--muted)' }}
            >
              Enter 发送，Shift+Enter 换行
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { createClient } from '@/lib/supabase/client';
// import type { ChatMessage, ChatSession } from '@/types/chat';

// type ViewerProfile = {
//   id: string;
//   full_name: string | null;
//   email?: string | null;
// };

// export default function ChatWidget() {
//   const supabase = createClient();

//   const [open, setOpen] = useState(false);
//   const [session, setSession] = useState<ChatSession | null>(null);
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(false);
//   const [initError, setInitError] = useState<string | null>(null);
//   const [aiReplying, setAiReplying] = useState(false);
//   const [viewerProfile, setViewerProfile] = useState<ViewerProfile | null>(null);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   const userDisplayName =
//     viewerProfile?.full_name?.trim() || 'You';

//   useEffect(() => {
//     let cancelled = false;

//     const loadViewerProfile = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) {
//         if (!cancelled) {
//           setViewerProfile(null);
//         }
//         return;
//       }

//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('id, full_name, email')
//         .eq('id', user.id)
//         .maybeSingle();

//       if (!cancelled) {
//         if (profile) {
//           setViewerProfile(profile);
//         } else {
//           setViewerProfile({
//             id: user.id,
//             full_name: null,
//             email: user.email ?? null,
//           });
//         }
//       }
//     };

//     void loadViewerProfile();

//     return () => {
//       cancelled = true;
//     };
//   }, [supabase]);

//   useEffect(() => {
//     if (!open) return;

//     let cancelled = false;

//     const init = async () => {
//       try {
//         setInitialLoading(true);
//         setInitError(null);
//         setAiReplying(false);

//         const sessionRes = await fetch('/api/chat/session', {
//           method: 'POST',
//         });

//         const sessionJson = await sessionRes.json();

//         if (!sessionRes.ok) {
//           if (!cancelled) {
//             setInitError(sessionJson.error || 'Failed to load chat session.');
//           }
//           return;
//         }

//         const currentSession = sessionJson.session as ChatSession;

//         if (cancelled) return;

//         setSession(currentSession);

//         const { data: msgData, error: msgError } = await supabase
//           .from('chat_messages')
//           .select('*')
//           .eq('session_id', currentSession.id)
//           .order('created_at', { ascending: true });

//         if (msgError) {
//           if (!cancelled) {
//             setInitError(msgError.message || 'Failed to load messages.');
//           }
//           return;
//         }

//         if (!cancelled) {
//           setMessages((msgData ?? []) as ChatMessage[]);
//         }
//       } catch {
//         if (!cancelled) {
//           setInitError('Something went wrong while loading the chat.');
//         }
//       } finally {
//         if (!cancelled) {
//           setInitialLoading(false);
//         }
//       }
//     };

//     void init();

//     return () => {
//       cancelled = true;
//     };
//   }, [open, supabase]);

//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`chat-${session.id}`)
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'chat_messages',
//           filter: `session_id=eq.${session.id}`,
//         },
//         (payload) => {
//           const newMessage = payload.new as ChatMessage;

//           setMessages((prev) => {
//             const exists = prev.some((m) => m.id === newMessage.id);
//             if (exists) return prev;
//             return [...prev, newMessage];
//           });

//           if (newMessage.sender === 'ai') {
//             setAiReplying(false);
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       void supabase.removeChannel(channel);
//     };
//   }, [session, supabase]);

//   useEffect(() => {
//     if (!open) return;
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, open, aiReplying]);

//   const triggerAiReply = async (sessionId: string, content: string) => {
//     try {
//       setAiReplying(true);

//       const res = await fetch('/api/chat/ai', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ sessionId, message: content }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         setAiReplying(false);

//         const fallbackMessage: ChatMessage = {
//           id: `ai-error-${Date.now()}`,
//           session_id: sessionId,
//           sender: 'ai',
//           content: 'Sorry, I could not reply just now. Please try again.',
//           is_read: false,
//           created_at: new Date().toISOString(),
//         };

//         setMessages((prev) => [...prev, fallbackMessage]);
//         console.error('AI reply failed:', data);
//         return;
//       }

//       if (data.message) {
//         const insertedAiMessage = data.message as ChatMessage;

//         setMessages((prev) => {
//           const exists = prev.some((m) => m.id === insertedAiMessage.id);
//           if (exists) return prev;
//           return [...prev, insertedAiMessage];
//         });
//       }

//       setAiReplying(false);
//     } catch (error) {
//       setAiReplying(false);

//       const fallbackMessage: ChatMessage = {
//         id: `ai-error-${Date.now()}`,
//         session_id: sessionId,
//         sender: 'ai',
//         content: 'Sorry, I could not reply just now. Please try again.',
//         is_read: false,
//         created_at: new Date().toISOString(),
//       };

//       setMessages((prev) => [...prev, fallbackMessage]);
//       console.error('AI reply failed:', error);
//     }
//   };

//   const sendMessage = async () => {
//     if (!session || !input.trim() || loading || initialLoading || !!initError) {
//       return;
//     }

//     const content = input.trim();

//     setLoading(true);
//     setInput('');

//     try {
//       const res = await fetch('/api/chat/message', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ sessionId: session.id, content }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         setInput(content);
//         return;
//       }

//       if (data.message) {
//         const insertedMessage = data.message as ChatMessage;

//         setMessages((prev) => {
//           const exists = prev.some((m) => m.id === insertedMessage.id);
//           if (exists) return prev;
//           return [...prev, insertedMessage];
//         });
//       }

//       await triggerAiReply(session.id, content);
//     } catch (error) {
//       setInput(content);
//       console.error('Send message failed:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed bottom-5 right-5 z-50">
//       {!open ? (
//         <button
//           onClick={() => setOpen(true)}
//           className="group rounded-full border px-5 py-3 text-sm font-medium shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
//           style={{
//             backgroundColor: 'var(--card)',
//             borderColor: 'var(--border)',
//             color: 'var(--text)',
//           }}
//         >
//           <span className="flex items-center gap-2">
//             <span
//               className="inline-block h-2.5 w-2.5 rounded-full"
//               style={{ backgroundColor: '#22c55e' }}
//             />
//             Chat with Ibot
//           </span>
//         </button>
//       ) : (
//         <div
//           className="flex h-155 w-97.5 flex-col overflow-hidden rounded-[28px] border shadow-2xl"
//           style={{
//             backgroundColor: 'var(--card)',
//             borderColor: 'var(--border)',
//             color: 'var(--text)',
//           }}
//         >
//           <div
//             className="relative border-b px-5 py-4"
//             style={{
//               borderColor: 'var(--border)',
//               background:
//                 'linear-gradient(135deg, var(--navbar-bg) 0%, var(--footer-bg) 100%)',
//             }}
//           >
//             <div className="flex items-start justify-between gap-4">
//               <div className="min-w-0">
//                 <div className="flex items-center gap-2">
//                   <div
//                     className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
//                     style={{
//                       backgroundColor: 'rgba(255,255,255,0.7)',
//                       color: 'var(--primary)',
//                     }}
//                   >
//                     IB
//                   </div>

//                   <div>
//                     <div className="font-semibold">Ibot</div>
//                     <div
//                       className="text-xs"
//                       style={{ color: 'rgba(17,17,17,0.72)' }}
//                     >
//                       马老师的人工智能助手
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={() => {
//                   setOpen(false);
//                   setAiReplying(false);
//                 }}
//                 className="rounded-full px-3 py-1.5 text-xs font-medium transition"
//                 style={{
//                   backgroundColor: 'rgba(255,255,255,0.65)',
//                   color: 'var(--text)',
//                 }}
//               >
//                 关闭
//               </button>
//             </div>
//           </div>

//           <div
//             className="flex-1 overflow-y-auto px-4 py-4"
//             style={{ backgroundColor: 'var(--bg)' }}
//           >
//             {initialLoading ? (
//               <div className="mt-14 text-center text-sm" style={{ color: 'var(--muted)' }}>
//                 Loading chat...
//               </div>
//             ) : initError ? (
//               <div className="mt-14 text-center text-sm text-red-500">
//                 {initError}
//               </div>
//             ) : messages.length === 0 ? (
//               <div className="mt-14 rounded-2xl border px-4 py-5 text-center text-sm shadow-sm"
//                 style={{
//                   backgroundColor: 'var(--card)',
//                   borderColor: 'var(--border)',
//                   color: 'var(--muted)',
//                 }}
//               >
//                 Hi! Ask me anything about IELTS, PTE, writing, speaking, or vocabulary.
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {messages.map((msg) => {
//                   const isUser = msg.sender === 'user';
//                   const isAi = msg.sender === 'ai';

//                   return (
//                     <div
//                       key={msg.id}
//                       className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
//                     >
//                       <div className="max-w-[84%]">
//                         <div
//                           className={`mb-1 px-1 text-[11px] font-medium ${
//                             isUser ? 'text-right' : 'text-left'
//                           }`}
//                           style={{ color: 'var(--muted)' }}
//                         >
//                           {isUser ? userDisplayName : isAi ? 'Ibot' : '马老师'}
//                         </div>

//                         <div
//                           className="rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm"
//                           style={{
//                             backgroundColor: isUser
//                               ? 'var(--primary)'
//                               : isAi
//                               ? 'var(--card)'
//                               : 'var(--card-soft)',
//                             color: isUser ? '#ffffff' : 'var(--text)',
//                             border: isUser ? 'none' : `1px solid var(--border)`,
//                           }}
//                         >
//                           <div className="whitespace-pre-wrap wrap-break-word">
//                             {msg.content}
//                           </div>

//                           <div
//                             className="mt-2 text-[10px]"
//                             style={{
//                               color: isUser
//                                 ? 'rgba(255,255,255,0.72)'
//                                 : 'var(--muted)',
//                             }}
//                           >
//                             {new Date(msg.created_at).toLocaleTimeString()}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {aiReplying && (
//                   <div className="flex justify-start">
//                     <div className="max-w-[84%]">
//                       <div
//                         className="mb-1 px-1 text-[11px] font-medium"
//                         style={{ color: 'var(--muted)' }}
//                       >
//                         Ibot
//                       </div>

//                       <div
//                         className="rounded-[22px] border px-4 py-3 text-sm shadow-sm"
//                         style={{
//                           backgroundColor: 'var(--card)',
//                           borderColor: 'var(--border)',
//                           color: 'var(--text)',
//                         }}
//                       >
//                         <div className="flex items-center gap-2">
//                           <span>Ibot 思考中</span>
//                           <span className="inline-flex gap-1">
//                             <span
//                               className="h-1.5 w-1.5 animate-bounce rounded-full"
//                               style={{ backgroundColor: 'var(--muted)' }}
//                             />
//                             <span
//                               className="h-1.5 w-1.5 animate-bounce rounded-full"
//                               style={{
//                                 backgroundColor: 'var(--muted)',
//                                 animationDelay: '0.15s',
//                               }}
//                             />
//                             <span
//                               className="h-1.5 w-1.5 animate-bounce rounded-full"
//                               style={{
//                                 backgroundColor: 'var(--muted)',
//                                 animationDelay: '0.3s',
//                               }}
//                             />
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             <div ref={bottomRef} />
//           </div>

//           <div
//             className="border-t px-4 py-4"
//             style={{
//               borderColor: 'var(--border)',
//               backgroundColor: 'var(--card)',
//             }}
//           >
//             <div className="flex gap-3">
//               <div
//                 className="flex flex-1 items-end rounded-3xl border px-3 py-2 shadow-sm"
//                 style={{
//                   borderColor: 'var(--border)',
//                   backgroundColor: 'var(--bg)',
//                 }}
//               >
//                 <textarea
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   placeholder="请输入你的问题..."
//                   rows={2}
//                   className="min-h-11 flex-1 resize-none bg-transparent px-1 py-1 text-sm outline-none"
//                   style={{ color: 'var(--text)' }}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && !e.shiftKey) {
//                       e.preventDefault();
//                       void sendMessage();
//                     }
//                   }}
//                   disabled={initialLoading || !!initError || loading}
//                 />

//                 <button
//                   onClick={() => void sendMessage()}
//                   disabled={
//                     loading || initialLoading || !input.trim() || !!initError
//                   }
//                   className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
//                   style={{ backgroundColor: 'var(--primary)' }}
//                 >
//                   {loading ? 'Sending...' : '发送'}
//                 </button>
//               </div>
//             </div>

//             <div
//               className="mt-2 px-1 text-[11px]"
//               style={{ color: 'var(--muted)' }}
//             >
//               Enter 发送，Shift+Enter 换行
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

