import { useEffect, useMemo, useState } from "react";
import { copy, detectInitialLocale } from "./i18n";
import { DashboardScreen, LandingScreen, MeetingRoom, MeetingSetupCard, SummaryScreen, AppTopBar } from "./components";
import { initialChat, initialTranscript } from "./mockData";
import {
  authService,
  meetingService,
  pdfService,
  summaryService,
  transcriptService,
  translationService,
  videoProviderService,
} from "./services";
import { AuthMethod, DashboardData, MeetingDraft, MeetingSession, Screen, UserProfile, VideoProvider } from "./types";

const defaultProfile = (locale: UserProfile["locale"]): UserProfile => ({
  id: "guest-user",
  name: "",
  role: "",
  isAuthenticated: false,
  locale,
});

const defaultDraft: MeetingDraft = {
  roomInput: "",
  name: "",
  role: "",
  accessMode: "instant",
};

export function App() {
  const [locale, setLocale] = useState(detectInitialLocale);
  const [screen, setScreen] = useState<Screen>("landing");
  const [profile, setProfile] = useState<UserProfile>(() => defaultProfile(detectInitialLocale()));
  const [draft, setDraft] = useState<MeetingDraft>(defaultDraft);
  const [joinMode, setJoinMode] = useState<"join" | "create">("join");
  const [session, setSession] = useState<MeetingSession | null>(null);
  const [guestMeetingsUsed, setGuestMeetingsUsed] = useState(1);
  const [errorKey, setErrorKey] = useState<"roomNotFound" | "fullMeeting" | "roomEnded" | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [provider, setProvider] = useState<VideoProvider>(videoProviderService.defaultProvider);
  const [toast, setToast] = useState<{ title: string; message?: string } | null>(null);

  const t = copy[locale];
  const availableProviders = videoProviderService.listProviders();
  const activeProvider = availableProviders.find((item) => item.id === provider);

  useEffect(() => {
    window.localStorage.setItem("nilaa-locale", locale);
  }, [locale]);

  useEffect(() => {
    setProfile((current) => ({ ...current, locale }));
  }, [locale]);

  useEffect(() => {
    void transcriptService.stream();
    void translationService.setLanguagePair();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    if (!roomParam) {
      return;
    }

    const storedRoom = meetingService.getRoom(roomParam);
    setDraft((current) => ({ ...current, roomInput: roomParam }));

    if (storedRoom) {
      setScreen("meetingSetup");
    } else {
      setErrorKey("roomNotFound");
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!session || screen !== "meeting") {
      return;
    }

    const interval = window.setInterval(() => {
      setSession((current) => {
        if (!current) {
          return current;
        }

        const nextElapsed = current.elapsedSec + 1;
        if (nextElapsed >= current.durationLimitSec) {
          void handleMeetingEnd(current);
          return current;
        }

        const nextNetworkMode =
          nextElapsed % 12 === 0 && current.networkMode === "weak" ? "saving" : current.networkMode;

        return {
          ...current,
          elapsedSec: nextElapsed,
          networkMode: nextNetworkMode,
          participants: current.participants.map((participant, index) =>
            index === 1 && nextNetworkMode !== "stable"
              ? { ...participant, quality: "360p", connection: "weak" }
              : participant,
          ),
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [screen, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    meetingService.syncRoom(session);
    const nextUrl = `${window.location.pathname}?room=${session.id}`;
    window.history.replaceState({}, "", nextUrl);
  }, [session]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.includes("nilaa-meet-rooms") || !session) {
        return;
      }

      const nextRoom = meetingService.getRoom(session.id);
      if (nextRoom) {
        setSession(nextRoom);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [session]);

  const summary = session?.summary;
  const transcript = initialTranscript;
  const chat = initialChat;
  const timeRemaining = session ? Math.max(session.durationLimitSec - session.elapsedSec, 0) : 0;
  const showWarning = timeRemaining <= 60 && screen === "meeting";

  const statusText = useMemo(() => {
    if (!session) {
      return "";
    }
    const minutes = Math.floor(session.elapsedSec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (session.elapsedSec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [session]);

  function updateSession(updater: (current: MeetingSession) => MeetingSession) {
    setSession((current) => (current ? updater(current) : current));
  }

  async function handleMeetingEnd(current: MeetingSession) {
    const generated = current.summary ?? (await summaryService.generate(current.roomName));
    setSession({ ...current, summary: generated });
    setScreen("summary");
  }

  async function handleAuth(method: AuthMethod) {
    const user = await authService.authenticate(method, locale);
    setProfile(user);
    setScreen("landing");
    setToast({ title: "Account ready", message: "Longer meetings and dashboard unlocked." });
  }

  async function openDashboard() {
    const nextDashboard = await meetingService.fetchDashboard();
    setDashboard(nextDashboard);
    setScreen("dashboard");
  }

  async function startMeeting() {
    if (!profile.isAuthenticated && guestMeetingsUsed >= 2) {
      setErrorKey(null);
      setScreen("auth");
      return;
    }

    const activeUser = {
      ...profile,
      name: draft.name || profile.name || "Guest Host",
      role: draft.role || profile.role || "Host",
    };
    setProfile(activeUser);

    const created = await meetingService.createMeeting(draft, activeUser, provider);
    setSession(created);
    setGuestMeetingsUsed((count) => (activeUser.isAuthenticated ? count : count + 1));
    setScreen("meeting");
    setErrorKey(null);
  }

  async function joinMeeting() {
    if (!draft.roomInput.trim()) {
      setErrorKey("roomNotFound");
      return;
    }

    const accessMode = draft.roomInput.toLowerCase().includes("approval") ? "approval" : "instant";
    const joiningUser = {
      id: profile.id,
      name: draft.name || profile.name || "Guest",
      role: draft.role || profile.role || "Participant",
      isAuthenticated: profile.isAuthenticated,
    };

    if (draft.roomInput.toLowerCase().includes("ended")) {
      setErrorKey("roomEnded");
      return;
    }

    const result = await meetingService.joinMeeting(draft.roomInput, accessMode, joiningUser, provider);
    if (result.error === "not_found" || !result.meeting) {
      setErrorKey("roomNotFound");
      return;
    }
    if (result.isFull) {
      setErrorKey("fullMeeting");
      return;
    }

    setSession(result.meeting);
    setScreen(result.status === "waiting" ? "waiting" : "meeting");
    setErrorKey(null);
  }

  async function downloadSummary() {
    if (!summary || summary.expiresInMinutes <= 0) {
      return;
    }
    setDownloadBusy(true);
    await pdfService.exportSummary(summary.id);
    setDownloadBusy(false);
    setToast({ title: "PDF requested", message: "Hook the PDF endpoint next to make downloads real." });
  }

  function toggleHostAudio() {
    updateSession((current) => ({
      ...current,
      participants: current.participants.map((participant, index) =>
        index === 0 ? { ...participant, audioEnabled: !participant.audioEnabled } : participant,
      ),
    }));
  }

  function toggleHostVideo() {
    updateSession((current) => ({
      ...current,
      participants: current.participants.map((participant, index) =>
        index === 0 ? { ...participant, videoEnabled: !participant.videoEnabled } : participant,
      ),
    }));
  }

  function toggleScreenShare() {
    updateSession((current) => ({
      ...current,
      participants: current.participants.map((participant, index) =>
        index === 0 ? { ...participant, screenSharing: !participant.screenSharing } : participant,
      ),
    }));
  }

  function toggleTranslation() {
    updateSession((current) => ({
      ...current,
      translationEnabled: !current.translationEnabled,
      panelTab: "translation",
    }));
  }

  function copyInviteLink() {
    if (!session?.inviteLink) {
      return;
    }

    if (navigator.clipboard) {
      void navigator.clipboard.writeText(session.inviteLink);
    }

    setToast({ title: "Invite link copied", message: session.inviteLink });
  }

  function acceptJoinRequest(requestId: string) {
    updateSession((current) => {
      const request = current.joinRequests.find((item) => item.id === requestId);
      if (!request) {
        return current;
      }

      if (current.kind === "authenticated" && current.participants.length >= 3) {
        setErrorKey("fullMeeting");
        return current;
      }

      setToast({ title: `${request.name} joined`, message: request.role });
      return {
        ...current,
        joinRequests: current.joinRequests.filter((item) => item.id !== requestId),
        participants: [
          ...current.participants,
          {
            id: request.id,
            name: request.name,
            role: request.role,
            videoEnabled: true,
            audioEnabled: true,
            quality: "360p",
            connection: "good",
          },
        ],
      };
    });
  }

  function rejectJoinRequest(requestId: string) {
    updateSession((current) => ({
      ...current,
      joinRequests: current.joinRequests.filter((item) => item.id !== requestId),
    }));
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <AppTopBar
        locale={locale}
        isAuthenticated={profile.isAuthenticated}
        onGoHome={() => {
          setScreen("landing");
          window.history.replaceState({}, "", window.location.pathname);
        }}
        onOpenAuth={() => setScreen("auth")}
        onOpenDashboard={openDashboard}
        onToggleLocale={() => setLocale(locale === "en" ? "km" : "en")}
      />

      {screen === "landing" && (
        <LandingScreen
          locale={locale}
          roomInput={draft.roomInput}
          providerLabel={activeProvider?.label ?? provider}
          providerDescription={activeProvider?.description ?? ""}
          onRoomInputChange={(value) => setDraft({ ...draft, roomInput: value })}
          onStart={() => {
            setJoinMode("create");
            setScreen("meetingSetup");
            window.history.replaceState({}, "", window.location.pathname);
          }}
          onJoin={() => {
            if (draft.roomInput.trim()) {
              void joinMeeting();
              return;
            }
            setJoinMode("join");
            setScreen("meetingSetup");
          }}
          onOpenDashboard={openDashboard}
        />
      )}

      {screen === "meetingSetup" && (
        <main className="center-layout">
          <MeetingSetupCard
            locale={locale}
            joinMode={joinMode}
            draft={draft}
            guestMeetingsUsed={guestMeetingsUsed}
            isAuthenticated={profile.isAuthenticated}
            onDraftChange={setDraft}
            onSubmit={joinMode === "create" ? startMeeting : joinMeeting}
          />
        </main>
      )}

      {screen === "waiting" && session && (
        <main className="center-layout">
          <section className="sheet waiting-card">
            <div className="pulse-dot" />
            <h2>{t.waitingApproval}</h2>
            <p>{session.roomName}</p>
            <div className="inline-note">
              <span>{draft.name || "Guest"}</span>
              <span>{draft.role || "Participant"}</span>
            </div>
            <button className="secondary-button" onClick={() => setScreen("landing")}>
              Back home
            </button>
          </section>
        </main>
      )}

      {screen === "meeting" && session && (
        <MeetingRoom
          locale={locale}
          session={session}
          chat={chat}
          transcript={transcript}
          showWarning={showWarning}
          statusText={statusText}
          onEndMeeting={() => void handleMeetingEnd(session)}
          onPanelTabChange={(tab) => setSession({ ...session, panelTab: tab })}
          onToggleMic={toggleHostAudio}
          onToggleCamera={toggleHostVideo}
          onToggleShare={toggleScreenShare}
          onToggleTranslation={toggleTranslation}
          onCopyInvite={copyInviteLink}
          onAcceptRequest={acceptJoinRequest}
          onRejectRequest={rejectJoinRequest}
        />
      )}

      {screen === "auth" && (
        <main className="center-layout">
          <section className="sheet setup-sheet">
            <div className="section-kicker">{t.guestLimitReached}</div>
            <h2>{t.authTitle}</h2>
            <p className="support-copy">{guestMeetingsUsed >= 2 ? t.createFreeAccount : t.authSupport}</p>
            <div className="auth-stack">
              {([
                ["google", t.google],
                ["facebook", t.facebook],
                ["phone", t.phone],
                ["telegram", t.telegram],
              ] as [AuthMethod, string][]).map(([method, label]) => (
                <button key={method} className="secondary-button auth-button" onClick={() => void handleAuth(method)}>
                  {label}
                </button>
              ))}
            </div>
            <div className="info-strip">
              <span>Longer meetings</span>
              <span>Dashboard access</span>
              <span>Post-meeting summaries</span>
            </div>
          </section>
        </main>
      )}

      {screen === "summary" && summary && (
        <SummaryScreen
          locale={locale}
          summary={summary}
          downloadBusy={downloadBusy}
          onDownload={() => void downloadSummary()}
          onNewMeeting={() => setScreen("landing")}
          onOpenDashboard={openDashboard}
        />
      )}

      {screen === "dashboard" && dashboard && (
        <DashboardScreen
          locale={locale}
          dashboard={dashboard}
          onViewSummary={(nextSummary) => {
            setSession((current) =>
              current
                ? { ...current, summary: nextSummary }
                : {
                    id: nextSummary.id,
                    roomName: nextSummary.title,
                    inviteLink: "",
                    accessMode: nextSummary.accessMode,
                    kind: "authenticated",
                    durationLimitSec: 15 * 60,
                    elapsedSec: 15 * 60,
                    participants: [],
                    joinRequests: [],
                    networkMode: "stable",
                    panelTab: "chat",
                    translationEnabled: true,
                    transcriptEnabled: true,
                    recordingActive: true,
                    summary: nextSummary,
                    provider,
                  },
            );
            setScreen("summary");
          }}
        />
      )}

      {(errorKey || toast) && (
        <div className="toast error-toast">
          <strong>{toast ? toast.title : errorKey ? t[errorKey] : ""}</strong>
          <span>{toast ? toast.message : errorKey === "fullMeeting" ? t.freeLimit : ""}</span>
        </div>
      )}
    </div>
  );
}
