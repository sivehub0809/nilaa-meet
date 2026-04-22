import {
  AccessMode,
  AuthMethod,
  DashboardData,
  MeetingDraft,
  MeetingSession,
  MeetingSummary,
  TranscriptLine,
  UserProfile,
  VideoProvider,
  VideoProviderAdapter,
} from "./types";
import { dashboardSeed, initialTranscript, sampleMeeting, sampleSummary } from "./mockData";

const roomSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/https?:\/\/[^/]+\/room\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "nilaa-room";

const providerAdapters: Record<VideoProvider, VideoProviderAdapter> = {
  livekit: {
    id: "livekit",
    label: "LiveKit",
    description: "Default target provider for production deployment.",
    async issueToken({ roomName, identity }) {
      // Production integration boundary:
      // POST /api/video/token with provider=livekit
      return Promise.resolve({
        token: `demo-livekit-token-${identity}`,
        roomUrl: `wss://livekit.nilaa.app/room/${roomName}`,
        identity,
        provider: "livekit",
      });
    },
  },
  daily: {
    id: "daily",
    label: "Daily",
    description: "Alternative hosted room provider for future evaluation.",
    async issueToken({ roomName, identity }) {
      return Promise.resolve({
        token: `demo-daily-token-${identity}`,
        roomUrl: `https://daily.nilaa.app/${roomName}`,
        identity,
        provider: "daily",
      });
    },
  },
  agora: {
    id: "agora",
    label: "Agora",
    description: "Regional fallback option for future integration work.",
    async issueToken({ roomName, identity }) {
      return Promise.resolve({
        token: `demo-agora-token-${identity}`,
        roomUrl: `agora://nilaa/${roomName}`,
        identity,
        provider: "agora",
      });
    },
  },
  custom: {
    id: "custom",
    label: "Custom SFU",
    description: "Reserved for an in-house or gateway-backed adapter.",
    async issueToken({ roomName, identity }) {
      return Promise.resolve({
        token: `demo-custom-token-${identity}`,
        roomUrl: `wss://custom.nilaa.app/room/${roomName}`,
        identity,
        provider: "custom",
      });
    },
  },
};

export const videoProviderService = {
  defaultProvider: "livekit" as VideoProvider,
  listProviders() {
    return Object.values(providerAdapters);
  },
  getProvider(providerId: VideoProvider = "livekit") {
    return providerAdapters[providerId];
  },
  async issueToken(providerId: VideoProvider, roomName: string, identity: string) {
    return providerAdapters[providerId].issueToken({ roomName, identity });
  },
};

export const authService = {
  async authenticate(method: AuthMethod, locale: UserProfile["locale"]): Promise<UserProfile> {
    // Replace this mock with Google/Facebook/OTP provider wiring.
    return Promise.resolve({
      id: `user-${method}`,
      name: "Sokha Nilaa",
      role: "Host",
      isAuthenticated: true,
      authMethod: method,
      locale,
    });
  },
};

export const transcriptService = {
  stream(): Promise<TranscriptLine[]> {
    // Replace this with a real streaming transcription provider.
    return Promise.resolve(initialTranscript);
  },
};

export const translationService = {
  async setLanguagePair() {
    // Replace with Khmer <-> English translation provider config.
    return Promise.resolve({ supported: true });
  },
};

export const summaryService = {
  async generate(roomName: string): Promise<MeetingSummary> {
    // Replace with meeting summarization pipeline.
    return Promise.resolve(sampleSummary(roomName));
  },
};

export const pdfService = {
  async exportSummary(summaryId: string) {
    // Replace with PDF generation/download backend.
    return Promise.resolve({ url: `/api/pdf/${summaryId}` });
  },
};

export const meetingService = {
  async createMeeting(
    draft: MeetingDraft,
    user: UserProfile,
    providerId: VideoProvider = videoProviderService.defaultProvider,
  ): Promise<MeetingSession> {
    const slug = roomSlug(draft.roomInput);
    await videoProviderService.issueToken(providerId, slug, user.name);

    const isAuth = user.isAuthenticated;
    return {
      ...sampleMeeting(),
      id: slug,
      roomName: draft.roomInput || "Instant Meeting",
      inviteLink: `https://meet.nilaa.app/room/${slug}`,
      accessMode: draft.accessMode,
      kind: isAuth ? "authenticated" : "guest",
      durationLimitSec: isAuth ? 15 * 60 : 5 * 60,
      elapsedSec: isAuth ? 14 * 60 : 4 * 60,
      participants: [
        {
          id: user.id,
          name: user.name || draft.name,
          role: user.role || draft.role,
          isHost: true,
          isSpeaking: true,
          videoEnabled: true,
          audioEnabled: true,
          quality: "HD",
          connection: "good",
        },
        ...sampleMeeting().participants.filter((participant) => !participant.isHost).slice(0, isAuth ? 2 : 1),
      ],
      provider: providerId,
    };
  },

  async joinMeeting(
    roomInput: string,
    accessMode: AccessMode,
    user: Pick<UserProfile, "id" | "name" | "role" | "isAuthenticated">,
    providerId: VideoProvider = videoProviderService.defaultProvider,
  ): Promise<{ status: "joined" | "waiting"; meeting: MeetingSession; isFull?: boolean }> {
    const roomName = roomSlug(roomInput);
    const meeting = {
      ...sampleMeeting(),
      id: roomName,
      roomName: roomInput || "Nilaa Room",
      accessMode,
      provider: providerId,
    };

    if (meeting.kind === "authenticated" && meeting.participants.length >= 3) {
      return Promise.resolve({
        status: accessMode === "approval" ? "waiting" : "joined",
        meeting,
        isFull: true,
      });
    }

    meeting.participants = [
      ...meeting.participants,
      {
        id: user.id,
        name: user.name,
        role: user.role,
        videoEnabled: true,
        audioEnabled: true,
        quality: "360p",
        connection: "good",
      },
    ];

    return Promise.resolve({
      status: accessMode === "approval" ? "waiting" : "joined",
      meeting,
      isFull: false,
    });
  },

  async fetchDashboard(): Promise<DashboardData> {
    return Promise.resolve(dashboardSeed);
  },
};
