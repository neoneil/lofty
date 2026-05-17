'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage, ChatSessionWithProfile } from '@/types/chat';

export default function AdminChatPage() {
  const supabase = createClient();

  const [sessions, setSessions] = useState<ChatSessionWithProfile[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        setPageError(null);

        const res = await fetch('/api/admin/chat/sessions');
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setPageError(data.error || 'Failed to load sessions.');
          }
          return;
        }

        if (!cancelled) {
          const nextSessions = (data.sessions ?? []) as ChatSessionWithProfile[];
          setSessions(nextSessions);

          if (!selectedSessionId && nextSessions.length > 0) {
            setSelectedSessionId(nextSessions[0].id);
          }
        }
      } catch {
        if (!cancelled) {
          setPageError('Something went wrong while loading sessions.');
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        setMessagesLoading(true);
        setPageError(null);

        const res = await fetch(
          `/api/admin/chat/messages?sessionId=${selectedSessionId}`
        );
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setPageError(data.error || 'Failed to load messages.');
          }
          return;
        }

        if (!cancelled) {
          setMessages((data.messages ?? []) as ChatMessage[]);

          setSessions((prev) =>
            prev.map((session) =>
              session.id === selectedSessionId
                ? { ...session, unread_count: 0 }
                : session
            )
          );
        }
      } catch {
        if (!cancelled) {
          setPageError('Something went wrong while loading messages.');
        }
      } finally {
        if (!cancelled) {
          setMessagesLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;

    const channel = supabase
      .channel(`admin-chat-${selectedSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${selectedSessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id);
            if (exists) return prev;
            return [...prev, newMessage];
          });

          setSessions((prev) =>
            prev.map((session) => {
              if (session.id !== selectedSessionId) return session;

              return {
                ...session,
                updated_at: newMessage.created_at,
                last_message: newMessage,
                unread_count:
                  newMessage.sender === 'user' ? 0 : session.unread_count,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedSessionId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    if (!selectedSessionId || !input.trim() || replyLoading) return;

    const content = input.trim();
    setReplyLoading(true);
    setInput('');

    try {
      const res = await fetch('/api/admin/chat/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInput(content);
        setPageError(data.error || 'Failed to send reply.');
        return;
      }

      if (data.message) {
        const insertedMessage = data.message as ChatMessage;

        setMessages((prev) => {
          const exists = prev.some((m) => m.id === insertedMessage.id);
          if (exists) return prev;
          return [...prev, insertedMessage];
        });

        setSessions((prev) =>
          prev.map((session) =>
            session.id === selectedSessionId
              ? {
                  ...session,
                  updated_at: insertedMessage.created_at,
                  last_message: insertedMessage,
                }
              : session
          )
        );
      }
    } catch {
      setInput(content);
      setPageError('Something went wrong while sending reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div className="container-main py-6">
        <div className="grid h-[calc(100vh-120px)] grid-cols-[320px_1fr] gap-4">
          <aside
            className="flex flex-col rounded-2xl border shadow-sm"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="border-b px-4 py-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <h1 className="text-lg font-semibold">Admin Chat</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Student conversations
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sessionsLoading ? (
                <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>
                  No conversations yet.
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === selectedSessionId;
                  const displayName =
                    session.profile?.full_name?.trim() ||
                    session.profile?.email ||
                    'Unknown user';

                  return (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className="w-full border-b px-4 py-4 text-left transition"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: isActive ? 'var(--card-soft)' : 'transparent',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{displayName}</div>
                          <div
                            className="truncate text-xs"
                            style={{ color: 'var(--muted)' }}
                          >
                            {session.profile?.email ?? 'No email'}
                          </div>
                          <div
                            className="mt-1 truncate text-sm"
                            style={{ color: 'var(--muted)' }}
                          >
                            {session.last_message?.content ?? 'No messages yet'}
                          </div>
                        </div>

                        {session.unread_count > 0 && (
                          <div
                            className="min-w-5.5 rounded px-2 py-1 text-center text-xs text-white"
                            style={{ backgroundColor: 'var(--primary)' }}
                          >
                            {session.unread_count}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <main
            className="flex flex-col rounded-2xl border shadow-sm"
            style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="border-b px-5 py-4"
              style={{ borderColor: 'var(--border)' }}
            >
              {selectedSession ? (
                <>
                  <div className="font-medium">
                    {selectedSession.profile?.full_name?.trim() ||
                      selectedSession.profile?.email ||
                      'Unknown user'}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    {selectedSession.profile?.email ?? 'No email'}
                  </div>
                </>
              ) : (
                <div className="font-medium">Select a conversation</div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {pageError ? (
                <div className="text-sm text-red-500">{pageError}</div>
              ) : !selectedSessionId ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Select a conversation to start.
                </div>
              ) : messagesLoading ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  No messages yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    const isAi = msg.sender === 'ai';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className="max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm"
                          style={{
                            backgroundColor: isAdmin
                              ? 'var(--primary)'
                              : isAi
                              ? 'var(--card-soft)'
                              : '#f3f4f6',
                            color: isAdmin ? '#ffffff' : 'var(--text)',
                          }}
                        >
                          <div
                            className="mb-1 text-[11px]"
                            style={{
                              color: isAdmin
                                ? 'rgba(255,255,255,0.75)'
                                : 'var(--muted)',
                            }}
                          >
                            {isAdmin ? 'Teacher' : isAi ? 'AI tutor' : 'Student'}
                          </div>

                          <div className="whitespace-pre-wrap wrap-break-word">
                            {msg.content}
                          </div>

                          <div
                            className="mt-2 text-[10px]"
                            style={{
                              color: isAdmin
                                ? 'rgba(255,255,255,0.7)'
                                : 'var(--muted)',
                            }}
                          >
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div
              className="border-t p-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  disabled={!selectedSessionId || replyLoading}
                  className="min-h-13 flex-1 resize-none rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                />

                <button
                  onClick={() => void sendReply()}
                  disabled={!selectedSessionId || replyLoading || !input.trim()}
                  className="rounded-2xl px-5 py-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {replyLoading ? 'Sending...' : 'Send'}
                </button>
              </div>

              <div className="mt-2 text-[11px]" style={{ color: 'var(--muted)' }}>
                Press Enter to send, Shift+Enter for a new line.
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}