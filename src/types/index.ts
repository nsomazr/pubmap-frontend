export interface User {
  id: number;
  encoded_id?: string;
  title?: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  full_name?: string;
  affiliation?: string;
  area_of_study?: string;
  formal_name?: string;
  email: string;
  phone: string;
  photo?: string;
  role_id: number;
  role_name?: string;
  status: number;
  onboarding_complete: boolean;
  /** Set by /auth/contacts/ when the contact is a relevance-based suggestion */
  match_reason?: string | null;
}

export interface Publication {
  id: number;
  encoded_id?: string;
  title: string;
  abstract: string;
  slug?: string;
  short_number?: string;
  keywords?: string[];
  status: number;
  author?: User;
  sub_category_id?: number;
  sub_category_name?: string;
  views_count?: number;
  downloads_count?: number;
  discussions_count?: number;
  coordinates?: Coordinate;
  collaborators?: Collaborator[];
  photos?: { id: number; photo: string; caption?: string }[];
  documents?: { id: number; document: string }[];
  introduction?: string;
  methods?: string;
  results?: string;
  conclusion?: string;
  findings?: string;
  funder?: string;
  references?: string;
  admin_comments?: { id: number; comment: string }[];
  score?: number;
}

export interface TopicReply {
  id: number;
  content: string;
  topic_id: number;
  parent_reply_id?: number | null;
  author?: User;
  created_at: string;
}

export interface Message {
  id: number;
  message?: string | null;
  is_deleted?: boolean;
  from_user?: User;
  to_user?: User;
  created_at: string;
}

export interface Coordinate {
  id?: number;
  location: string;
  latitude: string;
  longitude: string;
  institution?: string;
  study_area?: string;
}

export interface Collaborator {
  id?: number;
  fullname: string;
  affiliation: string;
  email?: string;
}

export interface Category {
  id: number;
  name: string;
  status: string;
  sub_categories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  icon?: string;
  status: string;
  topic_count?: number;
}

export interface Event {
  id: number;
  encoded_id?: string;
  title: string;
  location?: string;
  description?: string;
  reg_info?: string;
  contact_info?: string;
  date?: string;
  time?: string;
  photos?: { id: number; photo: string }[];
}

export interface Topic {
  id: number;
  topic: string;
  content: string;
  sub_category_id: number;
  sub_category_name?: string;
  author?: User;
  replies_count?: number;
  views_count?: number;
  created_at: string;
}

export interface PublicationComment {
  id: number;
  comment: string;
  created_at?: string;
}

export interface PublicationConversation {
  id: number;
  comment: string;
  publication_id: number;
  user?: User;
  replies?: PublicationReply[];
  created_at: string;
}

export interface PublicationReply {
  id: number;
  reply: string;
  conversation_id: number;
  user?: User;
  created_at: string;
}

export interface DashboardStats {
  pending?: number;
  commented?: number;
  published?: number;
  authors?: number;
  drafts?: number;
}
