import { copy } from "./i18n";
import { ChatMessage, DashboardData, Locale, MeetingDraft, MeetingSession, MeetingSummary } from "./types";

interface TopBarProps {
  locale: Locale;
  onToggleLocale: () => void;
  onOpenAuth: () => void;
  onGoHome: () => void;
}

export function AppTopBar({ locale, onToggleLocale, onOpenAuth, onGoHome }: TopBarProps) {
  const t = copy[locale];
  const languageLabel = locale === "km" ? "ខ្មែរ" : "EN";

  return (
    <header className="topbar">
      <button className="brand" onClick={onGoHome}>
        <span className="brand-mark">N</span>
        <div>
          <strong>{t.appName}</strong>
          <span>Khmer-first video meetings</span>
        </div>
      </button>
      <div className="topbar-actions">
        <button className="ghost-button" onClick={onToggleLocale}>
          {languageLabel}
        </button>
        <button className="ghost-button" onClick={onOpenAuth}>
          {t.loginSignup}
        </button>
      </div>
    </header>
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
    <section className="sheet">
      <div className="section-kicker">{joinMode === "create" ? t.createRoom : t.joinMeeting}</div>
      <h2>{joinMode === "create" ? t.startInstantMeeting : t.joinMeeting}</h2>
      <div className="field-grid">
        <label className="field">
          <span>{t.roomName}</span>
          <input
            value={draft.roomInput}
            onChange={(event) => onDraftChange({ ...draft, roomInput: event.target.value })}
            placeholder={t.roomPlaceholder}
          />
        </label>
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
      <div className="choice-row">
        <button
          className={draft.accessMode === "instant" ? "choice active" : "choice"}
          onClick={() => onDraftChange({ ...draft, accessMode: "instant" })}
        >
          {t.anyoneCanJoin}
        </button>
        <button
          className={draft.accessMode === "approval" ? "choice active" : "choice"}
          onClick={() => onDraftChange({ ...draft, accessMode: "approval" })}
        >
          {t.requestToJoin}
        </button>
      </div>
      <button className="primary-button" onClick={onSubmit}>
        {t.continue}
      </button>
      {isAuthenticated ? (
        <div className="inline-note">
          <span>15 min</span>
          <span>3 participants</span>
          <span>{t.livekitNote}</span>
        </div>
      ) : (
        <div className="inline-note">
          <span>Guest meetings used: {guestMeetingsUsed}/2</span>
          <span>5 min per meeting</span>
        </div>
      )}
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
}: MeetingRoomProps) {
  const t = copy[locale];

  return (
    <main className="meeting-layout">
      <section className="meeting-stage">
        <div className="meeting-topbar">
          <div className="badge-row">
            <span className="status-pill">{t.aiRecording}</span>
            <span className="status-pill">{t.aiTranscribing}</span>
            {session.networkMode !== "stable" && <span className="status-pill warm">{t.switchingSaver}</span>}
          </div>
          <div className="timer-pill">{statusText}</div>
        </div>

        {showWarning && <div className="warning-banner">{t.minuteRemaining}</div>}

        <div className={`video-grid count-${Math.min(session.participants.length, 3)}`}>
          {session.participants.slice(0, 3).map((participant) => (
            <article key={participant.id} className={participant.isSpeaking ? "tile speaking" : "tile"}>
              <div className="tile-overlay">
                <div>
                  <strong>{participant.name}</strong>
                  <span>{participant.role}</span>
                </div>
                <span>{participant.quality} · {session.provider}</span>
              </div>
              <div className="avatar-or-video">{participant.videoEnabled ? participant.name.slice(0, 1) : "Audio"}</div>
            </article>
          ))}
        </div>

        <div className="floating-controls">
          {[t.mic, t.camera, t.screenShare, t.whiteboard, t.translationToggle].map((label) => (
            <button key={label} className="control-button">
              {label}
            </button>
          ))}
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
                  <button className="secondary-button">{t.reject}</button>
                  <button className="primary-button small">{t.accept}</button>
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
              <span>Audio-first ready</span>
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
            <strong>{summary.expiresInMinutes > 0 ? `${summary.expiresInMinutes} min` : t.downloadExpired}</strong>
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
        <div className="inline-note">
          <span>{summary.expiresInMinutes > 0 ? t.downloadAvailable : t.downloadExpired}</span>
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
              <button className="secondary-button" onClick={() => onViewSummary(item)}>
                {t.summaryView}
              </button>
              <button className="ghost-button" disabled={item.expiresInMinutes <= 0}>
                {item.expiresInMinutes > 0 ? t.downloadPdf : t.downloadExpired}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
