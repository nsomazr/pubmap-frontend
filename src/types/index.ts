export interface UserInterest {
  id: number;
  label: string;
  sub_category_id?: number | null;
  source?: string;
  usage_count?: number;
}

export interface User {
  id: number;
  encoded_id?: string;
  title?: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  full_name?: string;
  affiliation?: string;
  country_code?: string;
  area_of_study?: string;
  interests?: UserInterest[];
  formal_name?: string;
  email: string;
  phone: string;
  photo?: string;
  role_id: number;
  role_name?: string;
  status: number;
  onboarding_complete: boolean;
  updated_at?: string;
  /** Set by /auth/contacts/ when the contact is a relevance-based suggestion */
  match_reason?: string | null;
  ranking?: ResearcherRanking;
  managed_categories?: { id: number; name: string }[];
  is_category_manager?: boolean;
}

export type ResearcherBadge =
  | "verified_researcher"
  | "top_contributor"
  | "highly_discussed"
  | "rising_researcher";

export interface ResearcherRanking {
  stars: number;
  published_count: number;
  recent_publications?: number;
  discussion_count: number;
  badges: ResearcherBadge[];
}

export type InstitutionRankingSort =
  | "publications"
  | "researchers"
  | "discussions"
  | "growth";

export type ResearcherRankingSort = "publications" | "discussions" | "stars";

export interface Institution {
  id: number;
  label: string;
  normalized?: string;
  usage_count?: number;
}

export interface InstitutionRanking {
  name: string;
  slug: string;
  map_url?: string;
  total_publications: number;
  total_researchers: number;
  total_discussions: number;
  recent_publications: number;
  growth_rate: number;
  stars: number;
}

export interface ResearcherLeaderboardEntry extends ResearcherRanking {
  user_id: number;
  name: string;
  affiliation: string;
  area_of_study?: string;
  photo?: string;
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
  category_id?: number;
  sub_category_visual?: SubcategoryVisual | null;
  views_count?: number;
  downloads_count?: number;
  discussions_count?: number;
  coordinates?: Coordinate;
  collaborators?: Collaborator[];
  co_authors?: PublicationCoAuthors;
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
  gre?: PublicationGre;
  figures?: PublicationFigure[];
  created_at?: string;
  lifecycle?: {
    previous_status?: number | null;
    archived_at?: string | null;
    deleted_at?: string | null;
    reason?: string;
  } | null;
}

export type PublicationAccessType = "open" | "closed";

export interface PublicationGre {
  access_type: PublicationAccessType;
  external_url?: string;
  reference_url?: string;
  gre_doi?: string | null;
  gre_doi_url?: string | null;
  author_summary?: string;
  summary_pdf_path?: string;
  has_summary_pdf?: boolean;
}

export interface PublicationFigure {
  id: number;
  photo: string;
  caption?: string;
  title?: string;
  figure_number?: string;
  sort_order?: number;
}

export interface GreDocument {
  id: number;
  document: string;
  kind?: "manuscript" | "supplementary" | "reference";
  label?: string;
  external_url?: string;
  created_at?: string;
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
  role?: string;
  photo?: string;
  user_id?: number | null;
  profile_url?: string | null;
  institution_map_url?: string;
  is_registered?: boolean;
}

export interface CoAuthorPerson extends Collaborator {
  kind?: "primary" | "coauthor";
  ranking?: ResearcherRanking;
}

export interface PublicationCoAuthors {
  primary_author: CoAuthorPerson;
  co_authors: CoAuthorPerson[];
  team: CoAuthorPerson[];
  total_authors: number;
}

export interface CollaborationNetworkNode {
  id: string;
  label: string;
  affiliation?: string;
  photo?: string;
  user_id?: number | null;
  role?: string;
  kind?: "primary" | "coauthor" | "researcher";
  profile_url?: string | null;
  institution_map_url?: string;
}

export interface CollaborationNetworkEdge {
  source: string;
  target: string;
  shared_publications?: number;
  kind?: string;
}

export interface CollaborationNetworkData {
  publication_id: number;
  publication_title: string;
  nodes: CollaborationNetworkNode[];
  edges: CollaborationNetworkEdge[];
}

export interface PublicResearcherProfile {
  user: User;
  ranking: ResearcherRanking;
  authored_publications: Publication[];
  co_authored_publications: Publication[];
  collaboration_network: Pick<CollaborationNetworkData, "nodes" | "edges">;
  institution_map_url?: string;
}

export interface SubcategoryVisual {
  name: string;
  category_name?: string;
  icon_key: string;
  accent_color: string;
  logo_url?: string | null;
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  icon?: string;
  status: string;
  topic_count?: number;
  visual?: SubcategoryVisual;
}

export interface Category {
  id: number;
  name: string;
  status: string;
  icon?: string | null;
  sub_categories?: SubCategory[];
  visual?: SubcategoryVisual;
  manager_count?: number;
}

export interface CategoryManagerRow {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  affiliation?: string;
  role_id: number;
  created_at?: string;
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
  is_reviewer?: boolean;
  managed_categories?: { id: number; name: string }[];
}

export interface PublicStatsTotals {
  publications: number;
  researchers: number;
  with_coordinates: number;
}

export interface PublicStatsCategoryCount {
  name: string;
  count: number;
}

export interface PublicStatsSubcategoryCount {
  subcategory: string;
  category: string;
  count: number;
}

export interface PublicStatsCountryCount {
  country: string;
  count: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PublicStatsHeatmapPoint {
  country: string;
  count: number;
  latitude: number;
  longitude: number;
}

export interface PublicStatsTrendingTopic {
  topic: string;
  category: string;
  recent_publications: number;
}

export interface PublicStatsKeyword {
  label: string;
  count: number;
}

export interface PublicStatsTrendPoint {
  month: string;
  count: number;
}

export interface PublicStatsDiscussedPaper {
  id: number;
  title: string;
  short_number?: string;
  conversations: number;
  replies: number;
  views: number;
  discussion_score: number;
}

export interface PublicResearchStats {
  generated_at: string;
  totals: PublicStatsTotals;
  publications_by_category: PublicStatsCategoryCount[];
  publications_by_subcategory: PublicStatsSubcategoryCount[];
  publications_by_country: PublicStatsCountryCount[];
  map_heatmap: PublicStatsHeatmapPoint[];
  top_institutions: InstitutionRanking[];
  trending_topics: PublicStatsTrendingTopic[];
  trending_keywords: PublicStatsKeyword[];
  publication_trend: PublicStatsTrendPoint[];
  most_discussed_papers: PublicStatsDiscussedPaper[];
}
