import { copy } from "./i18n";
import { ChatMessage, DashboardData, Locale, MeetingDraft, MeetingSession, MeetingSummary } from "./types";

interface TopBarProps {
  locale: Locale;
  isAuthenticated: boolean;
  onToggleLocale: () => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  onGoHome: () => void;
}

export function AppTopBar({
  locale,
  isAuthenticated,
  onToggleLocale,
  onOpenAuth,
  onOpenDashboard,
  onGoHome,
}: TopBarProps) {
  const t = copy[locale];
  const languageLabel = locale === "km" ? "KM" : "EN";

  return (
    <header className="topbar">
      <button className="brand" onClick={onGoHome}>
        <span className="brand-mark">N</span>
        <div>
          <strong>{t.appName}</strong>
          <span>Mobile-first video meetings</span>
        </div>
      </button>
      <div className="topbar-actions">
        <button className="ghost-button compact" onClick={onToggleLocale}>
          {languageLabel}
        </button>
        {isAuthenticated ? (
          <button className="ghost-button compact" onClick={onOpenDashboard}>
            {t.hostDashboard}
          </button>
        ) : (
          <button className="ghost-button compact" onClick={onOpenAuth}>
            {t.loginSignup}
          </button>
        )}
      </div>
    </header>
  );
}

interface LandingProps {
  locale: Locale;
  roomInput: string;
  providerLabel: string;
  providerDescription: string;
  onRoomInputChange: (value: string) => void;
  onStart: () => void;
  onJoin: () => void;
  onOpenDashboard: () => void;
}

export function LandingScreen({
  locale,
  roomInput,
  providerLabel,
  providerDescription,
  onRoomInputChange,
  onStart,
  onJoin,
  onOpenDashboard,
}: LandingProps) {
  const t = copy[locale];

  return (
    <main className="landing-shell">
      <section className="hero-card">
        <div className="hero-badge-row">
          <span className="section-kicker">{t.appName}</span>
          <span className="surface-chip">Khmer + English</span>
        </div>
        <h1>{t.headline}</h1>
        <p>{t.support}</p>

        <div className="quick-join-card">
          <label className="field no-gap">
            <span>{t.roomName}</span>
            <input
              value={roomInput}
              onChange={(event) => onRoomInputChange(event.target.value)}
              placeholder={t.roomPlaceholder}
            />
          </label>
          <div className="hero-actions">
            <button className="primary-button" onClick={onStart}>
              {t.startInstantMeeting}
            </button>
            <button className="secondary-button" onClick={onJoin}>
              {t.joinMeeting}
            </button>
          </div>
        </div>

        <div className="landing-metrics">
          <article className="mini-stat">
            <strong>5 min</strong>
            <span>guest instant room</span>
          </article>
          <article className="mini-stat">
            <strong>15 min</strong>
            <span>free signed-in room</span>
          </article>
          <article className="mini-stat">
            <strong>3 people</strong>
            <span>simple small meetings</span>
          </article>
        </div>
      </section>

      <section className="landing-stack">
        <article className="status-card feature-card">
          <div className="section-kicker">Why it feels easy</div>
          <h3>No training. No setup stress.</h3>
          <div className="feature-list">
            <div>
              <strong>Tap once</strong>
              <span>Start or join without account friction.</span>
            </div>
            <div>
              <strong>Trust first</strong>
              <span>Approval mode, clear timer, visible status indicators.</span>
            </div>
            <div>
              <strong>Low-data friendly</strong>
              <span>Weak-network mode and mobile-first controls.</span>
            </div>
          </div>
        </article>

        <article className="status-card provider-card">
          <div className="section-kicker">Video layer</div>
          <h3>{providerLabel}</h3>
          <p>{providerDescription}</p>
          <div className="hero-mini-actions">
            <button className="ghost-button compact" onClick={onOpenDashboard}>
              {t.hostDashboard}
            </button>
            <span className="surface-chip">Provider-agnostic UI</span>
          </div>
        </article>
      </section>
    </main>
  );
}

interface SetupProps {
  locale: Locale;
  joinMode: "join" | "create";
  draft: MeetingDraft;
  guestMeetingsUsed: number;
  isAuthenticated: boolean;
  onDraftChange: (draft: MeetingDraft) => void;
  onSubmit: () => void;
}

export function MeetingSetupCard({
  locale,
  joinMode,
  draft,
  guestMeetingsUsed,
  isAuthenticated,
  onDraftChange,
  onSubmit,
}: SetupProps) {
  const t = copy[locale];

  return (
    <section className="sheet setup-sheet">
      <div className="section-kicker">{joinMode === "create" ? t.createRoom : t.joinMeeting}</div>
      <h2>{joinMode === "create" ? t.startInstantMeeting : t.joinMeeting}</h2>
      <p className="support-copy">
        {joinMode === "create"
          ? "Give the room a name, choose how people enter, and start."
          : "Paste a room link or name, then enter your display name."}
      </p>

      <div className="field-grid">
        <label className="field">
          <span>{t.roomName}</span>
          <input
            value={draft.roomInput}
            onChange={(event) => onDraftChange({ ...draft, roomInput: event.target.value })}
            placeholder={t.roomPlaceholder}
          />
        </label>
        <div className="split-fields">
          <label className="field">
            <span>{t.yourName}</span>
            <input
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              placeholder="Sokha"
            />
          </label>
          <label className="field">
            <span>{t.yourRole}</span>
            <input
              value={draft.role}
              onChange={(event) => onDraftChange({ ...draft, role: event.target.value })}
              placeholder="Tutor / Sales / Student"
            />
          </label>
        </div>
      </div>

      <div className="mode-grid">
        <button
          className={draft.accessMode === "instant" ? "mode-card active" : "mode-card"}
          onClick={() => onDraftChange({ ...draft, accessMode: "instant" })}
        >
          <strong>{t.anyoneCanJoin}</strong>
          <span>Fastest option for known participants.</span>
        </button>
        <button
          className={draft.accessMode === "approval" ? "mode-card active" : "mode-card"}
          onClick={() => onDraftChange({ ...draft, accessMode: "approval" })}
        >
          <strong>{t.requestToJoin}</strong>
          <span>Host accepts each person before they enter.</span>
        </button>
      </div>

      <button className="primary-button wide-button" onClick={onSubmit}>
        {joinMode === "create" ? t.startInstantMeeting : t.joinMeeting}
      </button>

      <div className="info-strip">
        {isAuthenticated ? (
          <>
            <span>15 min free session</span>
            <span>Up to 3 participants</span>
            <span>Summary included</span>
          </>
        ) : (
          <>
            <span>Guest meetings: {guestMeetingsUsed}/2</span>
            <span>5 min limit</span>
            <span>Signup unlocks history</span>
          </>
        )}
      </div>
    </section>
  );
}

interface MeetingRoomProps {
  locale: Locale;
  session: MeetingSession;
  chat: ChatMessage[];
  transcript: {
    id: string;
    speaker: string;
    original: string;
    translated: string;
    time: string;
  }[];
  showWarning: boolean;
  statusText: string;
  onEndMeeting: () => void;
  onPanelTabChange: (tab: MeetingSession["panelTab"]) => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleShare: () => void;
  onToggleTranslation: () => void;
  onCopyInvite: () => void;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
}

export function MeetingRoom({
  locale,
  session,
  chat,
  transcript,
  showWarning,
  statusText,
  onEndMeeting,
  onPanelTabChange,
  onToggleMic,
  onToggleCamera,
  onToggleShare,
  onToggleTranslation,
  onCopyInvite,
  onAcceptRequest,
  onRejectRequest,
}: MeetingRoomProps) {
  const t = copy[locale];
  const host = session.participants.find((participant) => participant.isHost) ?? session.participants[0];
  const controls = [
    { label: t.mic, active: host?.audioEnabled, onClick: onToggleMic },
    { label: t.camera, active: host?.videoEnabled, onClick: onToggleCamera },
    { label: t.screenShare, active: Boolean(host?.screenSharing), onClick: onToggleShare },
    { label: t.translationToggle, active: session.translationEnabled, onClick: onToggleTranslation },
  ];

  return (
    <main className="meeting-layout">
      <section className="meeting-stage">
        <div className="meeting-header">
          <div>
            <div className="meeting-room-name">{session.roomName}</div>
            <div className="meeting-meta">
              <span className="surface-chip">{session.participants.length} joined</span>
              <span className="surface-chip">{session.provider}</span>
              <button className="inline-link" onClick={onCopyInvite}>
                Copy invite
              </button>
            </div>
          </div>
          <div className="meeting-topbar">
            <div className="badge-row">
              <span className="status-pill">{t.aiRecording}</span>
              <span className="status-pill">{t.aiTranscribing}</span>
              {session.networkMode !== "stable" && <span className="status-pill warm">{t.switchingSaver}</span>}
            </div>
            <div className="timer-pill">{statusText}</div>
          </div>
        </div>

        {showWarning && <div className="warning-banner">{t.minuteRemaining}</div>}

        <div className={`video-grid count-${Math.min(session.participants.length, 3)}`}>
          {session.participants.slice(0, 3).map((participant) => (
            <article key={participant.id} className={participant.isSpeaking ? "tile speaking" : "tile"}>
              <div className="tile-sheen" />
              <div className="tile-overlay">
                <div>
                  <strong>{participant.name}</strong>
                  <span>{participant.role}</span>
                </div>
                <div className="tile-meta">
                  {participant.isHost && <span className="surface-chip">Host</span>}
                  <span className="surface-chip">{participant.quality}</span>
                </div>
              </div>
              <div className={participant.videoEnabled ? "avatar-or-video large-avatar" : "avatar-or-video audio-avatar"}>
                {participant.videoEnabled ? participant.name.slice(0, 1) : "Audio"}
              </div>
            </article>
          ))}
        </div>

        <div className="floating-controls">
          {controls.map((control) => (
            <button
              key={control.label}
              className={control.active ? "control-button active" : "control-button"}
              onClick={control.onClick}
            >
              {control.label}
            </button>
          ))}
          <button className="control-button" onClick={() => onPanelTabChange("chat")}>
            {t.chat}
          </button>
          <button className="end-button" onClick={onEndMeeting}>
            {t.endMeeting}
          </button>
        </div>

        {session.joinRequests.length > 0 && (
          <aside className="approval-sheet">
            <div className="section-kicker">{t.someoneWantsToJoin}</div>
            {session.joinRequests.map((request) => (
              <div key={request.id} className="request-row">
                <div>
                  <strong>{request.name}</strong>
                  <span>{request.role}</span>
                </div>
                <div className="request-actions">
                  <button className="secondary-button compact" onClick={() => onRejectRequest(request.id)}>
                    {t.reject}
                  </button>
                  <button className="primary-button small" onClick={() => onAcceptRequest(request.id)}>
                    {t.accept}
                  </button>
                </div>
              </div>
            ))}
          </aside>
        )}
      </section>

      <aside className="panel-shell">
        <div className="panel-tabs">
          {[
            { key: "chat", label: t.chat },
            { key: "transcript", label: t.transcript },
            { key: "translation", label: t.translation },
          ].map((tab) => (
            <button
              key={tab.key}
              className={session.panelTab === tab.key ? "tab-button active" : "tab-button"}
              onClick={() => onPanelTabChange(tab.key as MeetingSession["panelTab"])}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel-headline">
          <strong>
            {session.panelTab === "chat"
              ? "Conversation"
              : session.panelTab === "transcript"
                ? "Live transcript"
                : "Khmer / English"}
          </strong>
          <span>{session.panelTab === "translation" ? "AI translated preview" : "Live meeting context"}</span>
        </div>

        {session.panelTab === "chat" && (
          <div className="panel-list">
            {chat.map((message) => (
              <article key={message.id} className="message-card">
                <strong>{message.sender}</strong>
                <p>{message.text}</p>
                <span>{message.time}</span>
              </article>
            ))}
          </div>
        )}

        {session.panelTab === "transcript" && (
          <div className="panel-list">
            {transcript.map((line) => (
              <article key={line.id} className="message-card">
                <strong>{line.speaker}</strong>
                <p>{line.original}</p>
                <span>{line.time}</span>
              </article>
            ))}
          </div>
        )}

        {session.panelTab === "translation" && (
          <div className="panel-list">
            {transcript.map((line) => (
              <article key={line.id} className="message-card">
                <strong>{line.speaker}</strong>
                <p>{line.translated}</p>
                <span>{line.time}</span>
              </article>
            ))}
          </div>
        )}

        {session.networkMode !== "stable" && (
          <div className="network-card">
            <strong>{t.weakConnection}</strong>
            <p>{t.networkHelp}</p>
            <div className="inline-note">
              <span>360p mode</span>
              <span>Audio-first</span>
              <span>Camera off fallback</span>
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}

interface SummaryProps {
  locale: Locale;
  summary: MeetingSummary;
  downloadBusy: boolean;
  onDownload: () => void;
  onNewMeeting: () => void;
  onOpenDashboard: () => void;
}

export function SummaryScreen({
  locale,
  summary,
  downloadBusy,
  onDownload,
  onNewMeeting,
  onOpenDashboard,
}: SummaryProps) {
  const t = copy[locale];

  return (
    <main className="center-layout wide">
      <section className="sheet summary-sheet">
        <div className="section-kicker">{t.summaryReady}</div>
        <h2>{summary.title}</h2>
        <p>{summary.dateLabel}</p>
        <div className="stats-grid">
          <div className="stat-card">
            <span>Participants</span>
            <strong>{summary.participantCount}</strong>
          </div>
          <div className="stat-card">
            <span>Access</span>
            <strong>{summary.accessMode === "approval" ? t.approvalMeeting : t.instantMeeting}</strong>
          </div>
          <div className="stat-card">
            <span>PDF</span>
            <strong>{summary.expiresInMinutes > 0 ? `${summary.expiresInMinutes} min left` : t.downloadExpired}</strong>
          </div>
        </div>
        <div className="summary-columns">
          <article className="summary-card">
            <h3>Key points</h3>
            <ul>
              {summary.keyPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="summary-card">
            <h3>Action items</h3>
            <ul>
              {summary.actionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="hero-actions">
          <button className="primary-button" disabled={summary.expiresInMinutes <= 0 || downloadBusy} onClick={onDownload}>
            {t.downloadPdf}
          </button>
          <button className="secondary-button" onClick={onNewMeeting}>
            {t.startNewMeeting}
          </button>
          <button className="ghost-button" onClick={onOpenDashboard}>
            {t.hostDashboard}
          </button>
        </div>
      </section>
    </main>
  );
}

interface DashboardProps {
  locale: Locale;
  dashboard: DashboardData;
  onViewSummary: (summary: MeetingSummary) => void;
}

export function DashboardScreen({ locale, dashboard, onViewSummary }: DashboardProps) {
  const t = copy[locale];

  return (
    <main className="dashboard-layout">
      <section className="dashboard-column">
        <div className="section-kicker">{t.activeMeetings}</div>
        {dashboard.upcoming.map((item) => (
          <article key={item.id} className="dashboard-card">
            <div>
              <strong>{item.title}</strong>
              <span>{item.dateLabel}</span>
            </div>
            <div className="inline-note">
              <span>{item.participantCount} joined</span>
              <span>{item.accessMode === "approval" ? t.approvalMeeting : t.instantMeeting}</span>
            </div>
          </article>
        ))}
      </section>
      <section className="dashboard-column">
        <div className="section-kicker">{t.pastMeetings}</div>
        {dashboard.past.map((item) => (
          <article key={item.id} className="dashboard-card">
            <div>
              <strong>{item.title}</strong>
              <span>{item.dateLabel}</span>
            </div>
            <div className="inline-note">
              <span>{item.participantCount} joined</span>
              <span>{item.summaryStatus}</span>
            </div>
          </article>
        ))}
      </section>
      <section className="dashboard-column">
        <div className="section-kicker">{t.summaries}</div>
        {dashboard.summaries.map((item) => (
          <article key={item.id} className="dashboard-card">
            <div>
              <strong>{item.title}</strong>
              <span>{item.dateLabel}</span>
            </div>
            <div className="dashboard-actions">
              <button className="secondary-button compact" onClick={() => onViewSummary(item)}>
                {t.summaryView}
              </button>
              <button className="ghost-button compact" disabled={item.expiresInMinutes <= 0}>
                {item.expiresInMinutes > 0 ? t.downloadPdf : t.downloadExpired}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
