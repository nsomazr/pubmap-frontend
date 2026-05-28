export interface UserInterest {
  id: number;
  label: string;
  sub_category_id?: number | null;
  subfield_id?: number | null;
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
  managed_subcategories?: { id: number; name: string; category_id: number; category_name?: string }[];
  managed_fields?: { id: number; name: string }[];
  managed_subfields?: { id: number; name: string; field_id: number; field_name?: string }[];
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
  country_code?: string;
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
  subfield_id?: number;
  subfield_name?: string;
  category_id?: number;
  field_id?: number;
  field_name?: string;
  sub_category_visual?: SubcategoryVisual | null;
  views_count?: number;
  downloads_count?: number;
  discussions_count?: number;
  responses_count?: number;
  likes_count?: number;
  share_count?: number;
  liked_by_me?: boolean;
  coordinates?: Coordinate;
  collaborators?: Collaborator[];
  co_authors?: PublicationCoAuthors;
  photos?: { id: number; photo: string; caption?: string }[];
  documents?: GreDocument[];
  introduction?: string;
  methods?: string;
  results?: string;
  conclusion?: string;
  findings?: string;
  funder?: string;
  references?: string;
  admin_comments?: { id: number; comment: string }[];
  plagiarism_summary?: PublicationPlagiarismSummary | null;
  plagiarism_claims?: PublicationPlagiarismClaim[];
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

export type PlagiarismClaimStatus =
  | "open"
  | "dismissed"
  | "restored"
  | "hidden"
  | "deleted"
  | "revision";

export interface PublicationPlagiarismEvidence {
  id: number;
  file_path: string;
  url: string;
  label: string;
  uploaded_at: string;
}

export interface PublicationPlagiarismClaim {
  id: number;
  publication_id: number;
  publication_title: string;
  publication_status: number;
  reporter_id: number;
  reporter_name: string;
  description: string;
  status: PlagiarismClaimStatus;
  admin_decision: string;
  admin_notes: string;
  resolved_by_id: number | null;
  resolved_by_name: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  evidence: PublicationPlagiarismEvidence[];
}

export interface PublicationPlagiarismSummary {
  total_count: number;
  open_count: number;
  latest_claim_id: number | null;
  latest_status: PlagiarismClaimStatus | null;
  needs_author_action: boolean;
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

export interface ResearcherSearchIdentity {
  key: string;
  name: string;
  affiliation: string;
  photo?: string;
  user_id?: number | null;
  has_profile: boolean;
  profile_url?: string | null;
  papers_map_url?: string | null;
  publication_count: number;
  discussions_count: number;
  responses_count: number;
  leading_interest: string;
  ranking?: ResearcherRanking;
  publications?: Publication[];
}

export interface AuthorResearchResponse {
  query: string;
  match_type: "exact" | "fuzzy" | "none";
  exact: ResearcherSearchIdentity | null;
  candidates: ResearcherSearchIdentity[];
}

export interface InstitutionLeadingArea {
  name: string;
  publication_count: number;
}

export interface InstitutionLeadingResearcher {
  name: string;
  user_id?: number | null;
  publication_count: number;
}

export interface InstitutionSearchIdentity {
  key: string;
  name: string;
  map_url: string;
  publication_count: number;
  researcher_count: number;
  discussions_count: number;
  responses_count: number;
  leading_researcher: InstitutionLeadingResearcher;
  leading_field: InstitutionLeadingArea;
  leading_subfield: InstitutionLeadingArea;
}

export interface InstitutionResearchResponse {
  query: string;
  match_type: "exact" | "fuzzy" | "none";
  exact: InstitutionSearchIdentity | null;
  candidates: InstitutionSearchIdentity[];
}

export type MapRegionSelection = {
  lat: number;
  lng: number;
  radiusKm: number;
  label: string;
};

export interface SubcategoryVisual {
  name: string;
  category_name?: string;
  field_name?: string;
  icon_key: string;
  accent_color: string;
  logo_url?: string | null;
}

export interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  field_id?: number;
  field_name?: string;
  subfield_name?: string;
  icon?: string;
  status: string;
  topic_count?: number;
  visual?: SubcategoryVisual;
}

export interface Category {
  id: number;
  name: string;
  field_name?: string;
  status: string;
  icon?: string | null;
  sub_categories?: SubCategory[];
  subfields?: SubCategory[];
  visual?: SubcategoryVisual;
  manager_count?: number;
}

export interface CategoryManagerRow {
  id: number;
  user_id: number;
  sub_category_id?: number;
  sub_category_name?: string;
  subfield_id?: number;
  subfield_name?: string;
  category_id?: number;
  category_name?: string;
  field_id?: number;
  field_name?: string;
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

export type MeetSessionType =
  | "research_discussion"
  | "paper_presentation"
  | "workshop"
  | "institutional_meeting"
  | "reviewer_session";

export type MeetVisibility = "authenticated_private" | "public" | "invite_only";

export type MeetSessionStatus = "scheduled" | "live" | "ended" | "cancelled";

export type MeetRecordingStatus = "none" | "requested" | "recording" | "ready" | "failed";

export type MeetSummaryStatus = "none" | "pending" | "ready" | "failed";

export type MeetParticipantRole = "host" | "speaker" | "participant";

export type MeetInviteStatus = "invited" | "accepted" | "declined" | "removed";

export type MeetChatMessageType = "text" | "question" | "reaction";

export interface MeetParticipant {
  id: number;
  user_id: number;
  user?: User;
  role: MeetParticipantRole;
  invite_status: MeetInviteStatus;
  joined_at?: string | null;
  left_at?: string | null;
  was_present?: boolean;
  join_count?: number;
  created_at?: string;
}

export interface MeetChatMessage {
  id: number;
  meeting_id: number;
  sender_id: number;
  sender?: User;
  message: string;
  message_type: MeetChatMessageType;
  created_at: string;
}

export interface MeetSession {
  id: number;
  title: string;
  description?: string;
  meeting_type: MeetSessionType;
  visibility: MeetVisibility;
  status: MeetSessionStatus;
  category_id: number;
  category_name?: string;
  field_id?: number;
  field_name?: string;
  sub_category_id: number;
  sub_category_name?: string;
  subfield_id?: number;
  subfield_name?: string;
  host_id: number;
  host?: User;
  scheduled_at: string;
  scheduled_timezone?: string;
  started_at?: string | null;
  ended_at?: string | null;
  join_slug: string;
  provider_name: string;
  provider_room_name?: string;
  recording_url?: string | null;
  recording_status: MeetRecordingStatus;
  recording_egress_id?: string | null;
  recording_error?: string | null;
  summary?: string | null;
  summary_status: MeetSummaryStatus;
  meeting_minutes?: string | null;
  assistant_notes?: string | null;
  gre_assistant_enabled?: boolean;
  participant_count?: number;
  participant_role?: MeetParticipantRole | null;
  participant_invite_status?: MeetInviteStatus | null;
  can_manage?: boolean;
  can_join?: boolean;
  meeting_link?: string;
  dashboard_link?: string;
  publication_id?: number | null;
  publication?: Publication | null;
  forum_topic_id?: number | null;
  forum_topic?: Pick<Topic, "id" | "topic" | "sub_category_id" | "sub_category_name"> | null;
  mute_audio_on_join?: boolean;
  video_off_on_join?: boolean;
  screen_share_moderator_only?: boolean;
  participants?: MeetParticipant[];
  chat_messages?: MeetChatMessage[];
  created_at?: string;
  updated_at?: string;
}

export interface MeetRoomJoinResponse {
  token: string;
  server_url: string;
  room_name: string;
  provider: string;
  meeting: MeetSession;
}

export interface Topic {
  id: number;
  topic: string;
  content: string;
  sub_category_id: number;
  sub_category_name?: string;
  subfield_id?: number;
  subfield_name?: string;
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
  managed_subcategories?: { id: number; name: string; category_id: number; category_name?: string }[];
  managed_fields?: { id: number; name: string }[];
  managed_subfields?: { id: number; name: string; field_id: number; field_name?: string }[];
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
  encoded_id?: string;
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
