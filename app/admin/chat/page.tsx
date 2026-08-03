'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Inbox,
  Loader2,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui-v2/badge';
import { Button } from '@/components/ui-v2/button';
import { Card, CardContent } from '@/components/ui-v2/card';
import { Textarea } from '@/components/ui-v2/textarea';
import type { ChatMessage, ChatSessionWithProfile } from '@/types/chat';

export default function AdminChatPage() {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

    let cancelled = false;

    const pollMessages = async () => {
      try {
        const res = await fetch(`/api/admin/chat/messages?sessionId=${selectedSessionId}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!res.ok || cancelled) return;

        const nextMessages = (data.messages ?? []) as ChatMessage[];
        setMessages((prev) => {
          if (prev.length === nextMessages.length && prev.at(-1)?.id === nextMessages.at(-1)?.id) {
            return prev;
          }
          return nextMessages;
        });

        const lastMessage = nextMessages.at(-1) ?? null;
        if (lastMessage) {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === selectedSessionId
                ? {
                    ...session,
                    updated_at: lastMessage.created_at,
                    last_message: lastMessage,
                    unread_count: 0,
                  }
                : session
            )
          );
        }
      } catch (error) {
        console.error('Admin chat polling failed:', error);
      }
    };

    const timer = window.setInterval(() => {
      void pollMessages();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedSessionId]);

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
        const nextSessionId = typeof data.sessionId === 'string' ? data.sessionId : selectedSessionId;

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
                  id: nextSessionId,
                  has_session: true,
                  updated_at: insertedMessage.created_at,
                  last_message: insertedMessage,
                }
              : session
          )
        );

        if (nextSessionId !== selectedSessionId) {
          setSelectedSessionId(nextSessionId);
        }
      }
    } catch {
      setInput(content);
      setPageError('Something went wrong while sending reply.');
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="default">Admin Console</Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--text)]">
                Student Chat
              </h1>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Review student conversations and reply from the teacher desk.
              </p>
            </div>

            <div className="grid gap-3 sm:w-[360px] sm:grid-cols-3">
              <StatPill label="Sessions" value={sessions.length} />
              <StatPill
                label="Unread"
                value={sessions.reduce(
                  (total, session) => total + session.unread_count,
                  0
                )}
              />
              <StatPill label="Status" value="Live" />
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:h-[calc(100vh-210px)] lg:min-h-[620px] lg:grid-cols-[340px_1fr]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">
                    Conversations
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    Student conversations
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Inbox size={18} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[var(--text-soft)]">
                <Search size={14} />
                Select a conversation below
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sessionsLoading ? (
                <div className="flex items-center gap-2 p-4 text-sm text-[var(--text-soft)]">
                  <Loader2 size={15} className="animate-spin" />
                  Loading sessions...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-soft)]">
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
                      className={`w-full border-b border-[var(--border)] px-4 py-4 text-left transition hover:bg-[var(--bg-soft)] ${
                        isActive ? 'bg-[var(--card-soft)]' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                              <UserRound size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[var(--text)]">
                                {displayName}
                              </div>
                              <div className="truncate text-xs text-[var(--text-soft)]">
                            {session.profile?.email ?? 'No email'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 truncate rounded-[var(--radius-md)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[var(--text-soft)]">
                            {session.last_message?.content ?? 'No messages yet'}
                          </div>
                        </div>

                        {session.unread_count > 0 && (
                          <div className="min-w-5.5 rounded-full bg-[var(--primary)] px-2 py-1 text-center text-xs font-semibold text-white">
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

          <main className="flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
            <div className="border-b border-[var(--border)] bg-[var(--card-soft)] px-5 py-4">
              {selectedSession ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      <UserRound size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[var(--text)]">
                        {selectedSession.profile?.full_name?.trim() ||
                          selectedSession.profile?.email ||
                          'Unknown user'}
                      </div>
                      <div className="truncate text-sm text-[var(--text-soft)]">
                        {selectedSession.profile?.email ?? 'No email'}
                      </div>
                    </div>
                  </div>

                  <Badge variant="success">Open</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-soft)]">
                    <MessageCircle size={19} />
                  </div>
                  <div className="font-semibold text-[var(--text)]">
                    Select a conversation
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto bg-[var(--bg-soft)] px-4 py-5">
              {pageError ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                  {pageError}
                </div>
              ) : !selectedSessionId ? (
                <EmptyState text="Select a conversation to start." />
              ) : messagesLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
                  <Loader2 size={15} className="animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <EmptyState text="No messages yet." />
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    const isAi = msg.sender === 'ai';

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-[var(--radius-lg)] px-4 py-3 text-sm shadow-[var(--shadow-sm)] ${
                            isAdmin
                              ? 'bg-[var(--primary)] text-white'
                              : isAi
                                ? 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                                : 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)]'
                          }`}
                        >
                          <div
                            className={`mb-1 text-[11px] font-semibold ${
                              isAdmin
                                ? 'text-white/75'
                                : isAi
                                  ? 'text-[var(--primary)]'
                                  : 'text-[var(--text-soft)]'
                            }`}
                          >
                            {isAdmin ? 'Teacher' : isAi ? 'AI tutor' : 'Student'}
                          </div>

                          <div className="whitespace-pre-wrap wrap-break-word leading-6">
                            {msg.content}
                          </div>

                          <div
                            className={`mt-2 text-[10px] ${
                              isAdmin ? 'text-white/70' : 'text-[var(--text-faint)]'
                            }`}
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

            <div className="border-t border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  disabled={!selectedSessionId || replyLoading}
                  className="min-h-[82px] flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                />

                <Button
                  onClick={() => void sendReply()}
                  disabled={!selectedSessionId || replyLoading || !input.trim()}
                  className="h-auto min-w-[112px] gap-2"
                >
                  {replyLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-2 text-[11px] text-[var(--text-soft)]">
                Press Enter to send, Shift+Enter for a new line.
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-3 text-center">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="mx-auto mt-16 max-w-md rounded-[var(--radius-lg)]">
      <CardContent className="flex flex-col items-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
          <Sparkles size={20} />
        </div>
        <div className="mt-4 text-sm font-medium text-[var(--text-soft)]">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}
