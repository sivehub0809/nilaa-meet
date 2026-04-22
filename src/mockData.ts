import {
  ChatMessage,
  DashboardData,
  MeetingSession,
  MeetingSummary,
  TranscriptLine,
} from "./types";

export const initialTranscript: TranscriptLine[] = [
  {
    id: "t1",
    speaker: "Sokha",
    original: "សួស្តី ទាំងអស់គ្នា។ យើងចាប់ផ្តើមថ្នាក់ភ្លាមៗបាន។",
    translated: "Hello everyone. We can start the class right away.",
    language: "km",
    time: "09:01",
  },
  {
    id: "t2",
    speaker: "Mina",
    original: "I can hear you clearly now. Let's review the sales plan first.",
    translated: "ខ្ញុំអាចឮអ្នកច្បាស់ហើយ។ យើងពិនិត្យផែនការលក់សិន។",
    language: "en",
    time: "09:02",
  },
  {
    id: "t3",
    speaker: "Dara",
    original: "ខ្ញុំនឹងផ្ញើតារាងតម្លៃថ្មីនៅក្រោយប្រជុំ។",
    translated: "I will send the new price list after the meeting.",
    language: "km",
    time: "09:03",
  },
];

export const initialChat: ChatMessage[] = [
  { id: "c1", sender: "Mina", text: "Please check the updated lesson outline.", time: "09:03" },
  { id: "c2", sender: "Dara", text: "I joined from mobile and it feels stable.", time: "09:04" },
];

export const sampleSummary = (title: string): MeetingSummary => ({
  id: `summary-${title}`,
  title,
  dateLabel: "22 Apr 2026, 09:00",
  participants: ["Sokha", "Mina", "Dara"],
  participantCount: 3,
  accessMode: "approval",
  summaryStatus: "ready",
  expiresInMinutes: 26,
  keyPoints: [
    "Reviewed weekly tutoring and sales follow-ups.",
    "Confirmed bilingual support for Khmer and English transcript sharing.",
    "Agreed to keep mobile data saver mode enabled by default on weak connections.",
  ],
  actionItems: [
    "Sokha will send the revised class schedule by noon.",
    "Mina will prepare the Khmer customer support script.",
    "Dara will test the LiveKit token handoff endpoint in the next phase.",
  ],
});

export const sampleMeeting = (): MeetingSession => ({
  id: "room-demo",
  roomName: "Nilaa Growth Sync",
  inviteLink: "https://meet.nilaa.app/room/nilaa-growth-sync",
  accessMode: "approval",
  kind: "authenticated",
  durationLimitSec: 15 * 60,
  elapsedSec: 14 * 60,
  participants: [
    {
      id: "p1",
      name: "Sokha",
      role: "Tutor",
      isHost: true,
      isSpeaking: true,
      videoEnabled: true,
      audioEnabled: true,
      quality: "HD",
      connection: "good",
    },
    {
      id: "p2",
      name: "Mina",
      role: "Sales Lead",
      videoEnabled: true,
      audioEnabled: true,
      quality: "360p",
      connection: "weak",
    },
    {
      id: "p3",
      name: "Dara",
      role: "Student",
      videoEnabled: false,
      audioEnabled: true,
      quality: "audio",
      connection: "good",
    },
  ],
  joinRequests: [
    {
      id: "jr1",
      name: "Chanra",
      role: "Freelancer",
      requestedAt: "09:14",
    },
  ],
  networkMode: "weak",
  panelTab: "transcript",
  translationEnabled: true,
  transcriptEnabled: true,
  recordingActive: true,
  summary: sampleSummary("Nilaa Growth Sync"),
  provider: "livekit",
});

export const dashboardSeed: DashboardData = {
  upcoming: [sampleSummary("Khmer Sales Coaching"), sampleSummary("Friday Tutor Check-in")],
  past: [sampleSummary("Freelancer Onboarding"), sampleSummary("Student Review Call")],
  summaries: [sampleSummary("Nilaa Growth Sync"), sampleSummary("Weekly Team Notes")],
};
