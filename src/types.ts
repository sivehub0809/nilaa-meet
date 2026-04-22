export type Locale = "en" | "km";
export type VideoProvider = "livekit" | "daily" | "agora" | "custom";
export type Screen =
  | "landing"
  | "meetingSetup"
  | "meeting"
  | "waiting"
  | "auth"
  | "summary"
  | "dashboard";

export type AccessMode = "instant" | "approval";
export type AuthMethod = "google" | "facebook" | "phone" | "telegram";
export type NetworkMode = "stable" | "weak" | "saving";
export type MeetingKind = "guest" | "authenticated";
export type PanelTab = "chat" | "transcript" | "translation";

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  isAuthenticated: boolean;
  authMethod?: AuthMethod;
  locale: Locale;
}

export interface ProviderConnectionPayload {
  token: string;
  roomUrl: string;
  identity: string;
  provider: VideoProvider;
}

export interface ProviderIssueTokenParams {
  roomName: string;
  identity: string;
}

export interface VideoProviderAdapter {
  id: VideoProvider;
  label: string;
  description: string;
  issueToken: (params: ProviderIssueTokenParams) => Promise<ProviderConnectionPayload>;
}

export interface JoinRequest {
  id: string;
  name: string;
  role: string;
  requestedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  isHost?: boolean;
  isSpeaking?: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing?: boolean;
  quality: "HD" | "360p" | "audio";
  connection: "good" | "weak";
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  original: string;
  translated: string;
  language: "km" | "en";
  time: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export interface MeetingSummary {
  id: string;
  title: string;
  dateLabel: string;
  participants: string[];
  participantCount: number;
  accessMode: AccessMode;
  summaryStatus: "ready" | "processing";
  keyPoints: string[];
  actionItems: string[];
  expiresInMinutes: number;
}

export interface MeetingSession {
  id: string;
  roomName: string;
  inviteLink: string;
  accessMode: AccessMode;
  kind: MeetingKind;
  durationLimitSec: number;
  elapsedSec: number;
  participants: Participant[];
  joinRequests: JoinRequest[];
  networkMode: NetworkMode;
  panelTab: PanelTab;
  translationEnabled: boolean;
  transcriptEnabled: boolean;
  recordingActive: boolean;
  summary?: MeetingSummary;
  provider: VideoProvider;
}

export interface MeetingDraft {
  roomInput: string;
  name: string;
  role: string;
  accessMode: AccessMode;
}

export interface DashboardData {
  upcoming: MeetingSummary[];
  past: MeetingSummary[];
  summaries: MeetingSummary[];
}
