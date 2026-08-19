export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  department?: string;
  batches?: string[];
  type: 'study_group' | 'course_group';
  course_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  memberCount?: number;
  message_retention?: '7_days' | '1_month' | '6_months';
  image_url?: string | null;
  group_photo?: string | null;
}

export interface GroupMember {
  id?: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at?: string;
  profile?: {
    id: string;
    full_name: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
    department?: string;
    batch?: string;
  };
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    email?: string;
    role?: string;
    avatar_url?: string | null;
  };
}

export interface GroupFormData {
  name: string;
  description: string;
  department: string;
  batches: string[];
  type: 'study_group' | 'course_group';
  course_id?: string;
  message_retention?: '7_days' | '1_month' | '6_months';
  image_url?: string;
  group_photo?: string;
}
