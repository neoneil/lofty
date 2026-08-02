import { NextResponse } from 'next/server';
import { requireApiAdminOrEditor } from '@/lib/auth/require-api-auth';

export async function GET() {
  try {
    const auth = await requireApiAdminOrEditor();
    if (!auth.ok) return auth.response;
    const { supabase } = auth;

    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, user_id, status, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (sessionsError) {
      console.error('Admin sessions load error:', sessionsError);
      return NextResponse.json({ error: 'Failed to load admin chat sessions.' }, { status: 500 });
    }

    const userIds = [...new Set((sessions ?? []).map((s) => s.user_id))];

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error('Admin chat profiles load error:', profilesError);
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

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const messagesBySession = new Map<string, typeof messages>();

    for (const msg of messages ?? []) {
      const arr = messagesBySession.get(msg.session_id) ?? [];
      arr.push(msg);
      messagesBySession.set(msg.session_id, arr);
    }

    const result = (sessions ?? []).map((session) => {
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
      };
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
