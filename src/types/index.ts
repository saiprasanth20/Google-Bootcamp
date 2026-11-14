export type EventCategory = 'Hackathon' | 'Conference' | 'Meetup' | 'Workshop';

export type IntentBadge =
  | 'Looking for Teammates'
  | 'Open to Meetup'
  | 'Splitting Travel'
  | 'Hiring / Mentoring';

export type ConnectionStatus = 'none' | 'pending' | 'connected';

export type AppView = 'explore' | 'my-events' | 'network' | 'passport';

export type SpatialMode = 'globe' | 'map';

export type DateFilter = 'all' | 'upcoming' | 'past';

export interface ScheduleItem {
  time: string;
  title: string;
  speaker?: string;
}

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  venueName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  coverImage: string;
  sourceUrl: string;
  tags: string[];
  schedule?: ScheduleItem[];
}

export interface AttendeeEventLink {
  eventId: string;
  status: 'going' | 'attended';
  statusNote: string;
}

export interface AttendeePersona {
  id: string;
  name: string;
  role: string;
  org: string;
  city: string;
  bio: string;
  intentBadge: IntentBadge;
  skills: string[];
  avatarColor: string;
  connectionStatus: ConnectionStatus;
  connectedViaEventId?: string;
  eventLinks: AttendeeEventLink[];
}

export interface RecapComment {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface RecapItem {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorOrg: string;
  createdAt: string;
  processReview: string;
  keyLearnings: string[];
  projectLink?: string;
  photos: string[];
  likes: number;
  likedByMe?: boolean;
  comments: RecapComment[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  org: string;
  bio: string;
  skills: string[];
  city: string;
  goingEventIds: string[];
  attendedEventIds: string[];
  statusNotes: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
  eventContextTitle?: string;
}

export interface DiscoveredEvent {
  tempId: string;
  title: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  venueName: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
  sourceUrl: string;
  tags: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SynthesisResult {
  headline: string;
  summary: string;
  highlights: string[];
  topTakeaways: string[];
  sources: GroundingSource[];
}

export interface ToastItem {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'warning';
}
