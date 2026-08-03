import { NextResponse } from 'next/server';
import { requireApiAdminOrEditor } from '@/lib/auth/require-api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

type ChatSessionRow = {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
};

function isStudentProfile(profile: ProfileRow) {
  return profile.role !== 'admin' && profile.role !== 'editor';
}

function getVirtualSessionId(userId: string) {
  return `no-session:${userId}`;
}

export async function GET() {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;
    const supabase = createAdminClient();

    const [
      { data: sessions, error: sessionsError },
      { data: profiles, error: profilesError },
    ] = await Promise.all([
      supabase
        .from('chat_sessions')
        .select('id, user_id, status, created_at, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (sessionsError || profilesError) {
      console.error('Admin sessions load error:', sessionsError ?? profilesError);
      return NextResponse.json({ error: 'Failed to load admin chat sessions.' }, { status: 500 });
    }

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const { data: messages, error: messagesError } = sessionIds.length
      ? await supabase
          .from('chat_messages')
          .select('id, session_id, sender, content, is_read, created_at')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null };

    if (messagesError) {
      console.error('Admin session messages load error:', messagesError);
      return NextResponse.json({ error: 'Failed to load admin chat sessions.' }, { status: 500 });
    }

    const studentProfiles = ((profiles ?? []) as ProfileRow[]).filter(isStudentProfile);
    const profileMap = new Map(studentProfiles.map((p) => [p.id, p]));
    const latestSessionByUser = new Map<string, ChatSessionRow>();
    const messagesBySession = new Map<string, typeof messages>();

    for (const session of (sessions ?? []) as ChatSessionRow[]) {
      if (!latestSessionByUser.has(session.user_id)) {
        latestSessionByUser.set(session.user_id, session);
      }
    }

    for (const msg of messages ?? []) {
      const arr = messagesBySession.get(msg.session_id) ?? [];
      arr.push(msg);
      messagesBySession.set(msg.session_id, arr);
    }

    const result = studentProfiles.map((profile) => {
      const session = latestSessionByUser.get(profile.id) ?? {
        id: getVirtualSessionId(profile.id),
        user_id: profile.id,
        status: 'open' as const,
        created_at: profile.created_at ?? new Date(0).toISOString(),
        updated_at: profile.created_at ?? new Date(0).toISOString(),
      };
      const sessionMessages = messagesBySession.get(session.id) ?? [];
      const lastMessage =
        sessionMessages.length > 0
          ? sessionMessages[sessionMessages.length - 1]
          : null;

      const unreadCount = sessionMessages.filter(
        (m) => m.sender === 'user' && !m.is_read
      ).length;

      return {
        ...session,
        profile: profileMap.get(session.user_id) ?? null,
        last_message: lastMessage,
        unread_count: unreadCount,
        has_session: latestSessionByUser.has(profile.id),
      };
    }).sort((a, b) => {
      if (a.last_message && b.last_message) return b.updated_at.localeCompare(a.updated_at);
      if (a.last_message) return -1;
      if (b.last_message) return 1;
      return (a.profile?.full_name || a.profile?.email || '').localeCompare(b.profile?.full_name || b.profile?.email || '');
    });

    return NextResponse.json({ sessions: result });
  } catch (error) {
    console.error('Admin sessions route error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin chat sessions.' },
      { status: 500 }
    );
  }
}
