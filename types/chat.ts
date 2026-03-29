export type ChatSender = 'user' | 'admin' | 'ai' | 'editor';

export type ChatSession = {
  id: string;
  user_id: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  sender: ChatSender;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type ChatSessionWithProfile = ChatSession & {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  last_message: ChatMessage | null;
  unread_count: number;
};