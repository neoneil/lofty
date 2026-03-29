'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, ChatSession } from '@/types/chat';

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

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const init = async () => {
      try {
        setInitialLoading(true);
        setInitError(null);
        setAiReplying(false);

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

        const { data: msgData, error: msgError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', currentSession.id)
          .order('created_at', { ascending: true });

        if (msgError) {
          if (!cancelled) {
            setInitError(msgError.message || 'Failed to load messages.');
          }
          return;
        }

        if (!cancelled) {
          setMessages((msgData ?? []) as ChatMessage[]);
        }
      } catch {
        if (!cancelled) {
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
  }, [open, supabase]);

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
            return [...prev, newMessage];
          });

          if (newMessage.sender === 'ai') {
            setAiReplying(false);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, supabase]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, aiReplying]);

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

        setMessages((prev) => [...prev, fallbackMessage]);
        console.error('AI reply failed:', data);
        return;
      }

      if (data.message) {
        const insertedAiMessage = data.message as ChatMessage;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === insertedAiMessage.id);
          if (exists) return prev;
          return [...prev, insertedAiMessage];
        });
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

      setMessages((prev) => [...prev, fallbackMessage]);
      console.error('AI reply failed:', error);
    }
  };

  const sendMessage = async () => {
    if (!session || !input.trim() || loading || initialLoading || !!initError) {
      return;
    }

    const content = input.trim();

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
          return [...prev, insertedMessage];
        });
      }

      await triggerAiReply(session.id, content);
    } catch (error) {
      setInput(content);
      console.error('Send message failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border bg-white px-4 py-3 shadow-lg transition hover:shadow-xl"
        >
          Chat
        </button>
      ) : (
        <div className="flex h-140 w-95 flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <div className="font-medium">Ask a question</div>
              <div className="text-xs text-gray-500">Student support chat</div>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                setAiReplying(false);
              }}
              className="text-sm text-gray-500 hover:text-black"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {initialLoading ? (
              <div className="mt-10 text-center text-sm text-gray-500">
                Loading chat...
              </div>
            ) : initError ? (
              <div className="mt-10 text-center text-sm text-red-500">
                {initError}
              </div>
            ) : messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-gray-500">
                Hi! Ask me anything about IELTS.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isAi = msg.sender === 'ai';

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                          isUser
                            ? 'bg-black text-white'
                            : isAi
                            ? 'bg-blue-50 text-black'
                            : 'bg-gray-100 text-black'
                        }`}
                      >
                        <div className="mb-1 text-[11px] opacity-70">
                          {isUser ? 'You' : isAi ? 'AI tutor' : 'Teacher'}
                        </div>

                        <div className="whitespace-pre-wrap wrap-break-word">
                          {msg.content}
                        </div>

                        <div className="mt-1 text-[10px] opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {aiReplying && (
                  <div className="flex justify-start">
                    <div className="max-w-[82%] rounded-2xl bg-blue-50 px-3 py-2 text-sm text-black">
                      <div className="mb-1 text-[11px] opacity-70">AI tutor</div>
                      <div>Typing...</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                rows={2}
                className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                className="rounded-xl border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            <div className="mt-2 text-[11px] text-gray-400">
              Press Enter to send, Shift+Enter for a new line.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}