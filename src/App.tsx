import { useEffect, useMemo, useState } from "react";
import { appConfig } from "./config";
import { copy, detectInitialLocale } from "./i18n";
import { AppTopBar, DashboardScreen, MeetingRoom, MeetingSetupCard, SummaryScreen } from "./components";
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
import {
  AuthMethod,
  DashboardData,
  MeetingDraft,
  MeetingSession,
  Screen,
  UserProfile,
  VideoProvider,
} from "./types";

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

  const t = copy[locale];
  const availableProviders = videoProviderService.listProviders();

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

  async function handleMeetingEnd(current: MeetingSession) {
    const generated = current.summary ?? (await summaryService.generate(current.roomName));
    setSession({ ...current, summary: generated });
    setScreen("summary");
  }

  async function handleAuth(method: AuthMethod) {
    const user = await authService.authenticate(method, locale);
    setProfile(user);
    setScreen("landing");
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
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <AppTopBar
        locale={locale}
        onGoHome={() => setScreen("landing")}
        onOpenAuth={() => setScreen("auth")}
        onToggleLocale={() => setLocale(locale === "en" ? "km" : "en")}
      />

      {screen === "landing" && (
        <main className="landing-layout">
          <section className="hero-card">
            <div className="section-kicker">{appConfig.appName}</div>
            <h1>{t.headline}</h1>
            <p>{t.support}</p>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => {
                  setJoinMode("create");
                  setScreen("meetingSetup");
                }}
              >
                {t.startInstantMeeting}
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setJoinMode("join");
                  setScreen("meetingSetup");
                }}
              >
                {t.joinMeeting}
              </button>
            </div>
            <label className="field">
              <span>{t.roomName}</span>
              <input
                value={draft.roomInput}
                onChange={(event) => setDraft({ ...draft, roomInput: event.target.value })}
                placeholder={t.roomPlaceholder}
              />
            </label>
            <div className="hero-mini-actions">
              <button className="secondary-button" onClick={joinMeeting}>
                {t.joinMeeting}
              </button>
              <button className="ghost-button" onClick={openDashboard}>
                {t.hostDashboard}
              </button>
            </div>
            <div className="provider-row">
              {availableProviders.map((item) => (
                <button
                  key={item.id}
                  className={provider === item.id ? "choice active" : "choice"}
                  onClick={() => setProvider(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="trust-row">
              <span>{t.noSettings}</span>
              <span>{appConfig.appName} · {t.providerNote}</span>
            </div>
          </section>

          <section className="side-stack">
            <article className="status-card">
              <div className="section-kicker">Access rules</div>
              <h3>Guest: 2 meetings x 5 min</h3>
              <p>Auth: 15 min, up to 3 joined participants, dashboard history, summaries.</p>
            </article>
            <article className="status-card">
              <div className="section-kicker">Provider ready</div>
              <h3>{availableProviders.find((item) => item.id === provider)?.label}</h3>
              <p>{availableProviders.find((item) => item.id === provider)?.description}</p>
            </article>
          </section>
        </main>
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
              {t.joinMeeting}
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
        />
      )}

      {screen === "auth" && (
        <main className="center-layout">
          <section className="sheet">
            <div className="section-kicker">{t.guestLimitReached}</div>
            <h2>{t.authTitle}</h2>
            <p>{guestMeetingsUsed >= 2 ? t.createFreeAccount : t.authSupport}</p>
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
            <div className="inline-note">
              <span>{t.guestUpgradeSupport}</span>
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

      {errorKey && (
        <div className="toast error-toast">
          <strong>{t[errorKey]}</strong>
          {errorKey === "fullMeeting" && <span>{t.freeLimit}</span>}
        </div>
      )}
    </div>
  );
}
