import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'editor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (sessionsError) {
      return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    }

    const userIds = [...new Set((sessions ?? []).map((s) => s.user_id))];

    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const sessionIds = (sessions ?? []).map((s) => s.id);

    const { data: messages, error: messagesError } = sessionIds.length
      ? await supabase
          .from('chat_messages')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true })
      : { data: [], error: null };

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
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