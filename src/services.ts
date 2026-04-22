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
import { appConfig } from "./config";
import { dashboardSeed, initialTranscript, sampleSummary } from "./mockData";

const ROOM_STORAGE_KEY = "nilaa-meet-rooms";

const roomSlug = (value: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/https?:\/\/[^/]+\/room\//, "")
    .replace(/^.*[?&]room=/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `nilaa-room-${Math.random().toString(36).slice(2, 8)}`;
};

const getPublicOrigin = () => {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return appConfig.publicAppUrl.replace(/\/$/, "");
};

const sanitizeRoom = (meeting: MeetingSession): MeetingSession => ({
  ...meeting,
  participants: meeting.participants.filter((participant) => !["p2", "p3"].includes(participant.id)),
  joinRequests: meeting.joinRequests.filter((request) => request.id !== "jr1"),
});

const readRoomStore = (): Record<string, MeetingSession> => {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(ROOM_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, MeetingSession>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, sanitizeRoom(value)]),
    );
  } catch {
    return {};
  }
};

const writeRoomStore = (store: Record<string, MeetingSession>) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(store));
};

const saveRoom = (meeting: MeetingSession) => {
  const store = readRoomStore();
  store[meeting.id] = meeting;
  writeRoomStore(store);
  return meeting;
};

const loadRoom = (roomInput: string) => {
  const roomId = roomSlug(roomInput);
  return readRoomStore()[roomId] ?? null;
};

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
  defaultProvider: appConfig.defaultProvider,
  listProviders() {
    return Object.values(providerAdapters);
  },
  getProvider(providerId: VideoProvider = appConfig.defaultProvider) {
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
    return Promise.resolve({ url: `${appConfig.pdfEndpoint}/${summaryId}` });
  },
};

export const meetingService = {
  parseRoomInput(input: string) {
    return roomSlug(input);
  },

  getRoom(roomInput: string) {
    return loadRoom(roomInput);
  },

  syncRoom(meeting: MeetingSession) {
    return saveRoom(meeting);
  },

  async createMeeting(
    draft: MeetingDraft,
    user: UserProfile,
    providerId: VideoProvider = videoProviderService.defaultProvider,
  ): Promise<MeetingSession> {
    const slug = roomSlug(draft.roomInput);
    await videoProviderService.issueToken(providerId, slug, user.name);

    const isAuth = user.isAuthenticated;
    const meeting = {
      id: slug,
      roomName: draft.roomInput || "Instant Meeting",
      inviteLink: `${getPublicOrigin()}?room=${slug}`,
      accessMode: draft.accessMode,
      kind: isAuth ? "authenticated" : "guest",
      durationLimitSec: isAuth ? 15 * 60 : 5 * 60,
      elapsedSec: 0,
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
      ],
      joinRequests: [],
      networkMode: "stable",
      panelTab: "chat",
      translationEnabled: true,
      transcriptEnabled: true,
      recordingActive: true,
      summary: undefined,
      provider: providerId,
    };

    return saveRoom(meeting);
  },

  async joinMeeting(
    roomInput: string,
    accessMode: AccessMode,
    user: Pick<UserProfile, "id" | "name" | "role" | "isAuthenticated">,
    providerId: VideoProvider = videoProviderService.defaultProvider,
  ): Promise<{ status: "joined" | "waiting"; meeting: MeetingSession | null; isFull?: boolean; error?: "not_found" | "ended" }> {
    const roomName = roomSlug(roomInput);
    const meeting = loadRoom(roomName);

    if (!meeting) {
      return Promise.resolve({
        status: "joined",
        meeting: null,
        error: "not_found",
      });
    }

    if (meeting.kind === "authenticated" && meeting.participants.length >= 3) {
      return Promise.resolve({
        status: meeting.accessMode === "approval" ? "waiting" : "joined",
        meeting,
        isFull: true,
      });
    }

    if (meeting.accessMode === "approval") {
      const updated = saveRoom({
        ...meeting,
        joinRequests: meeting.joinRequests.some((request) => request.id === user.id)
          ? meeting.joinRequests
          : [
              ...meeting.joinRequests,
              {
                id: user.id,
                name: user.name,
                role: user.role,
                requestedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ],
      });

      return Promise.resolve({
        status: "waiting",
        meeting: updated,
        isFull: false,
      });
    }

    const updated = saveRoom({
      ...meeting,
      participants: meeting.participants.some((participant) => participant.id === user.id)
        ? meeting.participants
        : [
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
          ],
    });

    return Promise.resolve({
      status: "joined",
      meeting: updated,
      isFull: false,
    });
  },

  async fetchDashboard(): Promise<DashboardData> {
    return Promise.resolve(dashboardSeed);
  },
};
