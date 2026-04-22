import { Locale, VideoProvider } from "./types";

const providerValues: VideoProvider[] = ["livekit", "daily", "agora", "custom"];
const localeValues: Locale[] = ["en", "km"];

const envProvider = import.meta.env.VITE_DEFAULT_VIDEO_PROVIDER;
const envLocale = import.meta.env.VITE_DEFAULT_LOCALE;

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || "Nilaa Meet",
  publicAppUrl: import.meta.env.VITE_PUBLIC_APP_URL || "https://nilaa-meet.vercel.app",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  tokenEndpoint: import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT || "/api/video/token",
  transcriptEndpoint: import.meta.env.VITE_TRANSCRIPT_ENDPOINT || "/api/transcript/stream",
  translationEndpoint: import.meta.env.VITE_TRANSLATION_ENDPOINT || "/api/translate",
  summaryEndpoint: import.meta.env.VITE_SUMMARY_ENDPOINT || "/api/summary",
  pdfEndpoint: import.meta.env.VITE_PDF_ENDPOINT || "/api/pdf",
  defaultProvider: providerValues.includes(envProvider as VideoProvider)
    ? (envProvider as VideoProvider)
    : "livekit",
  defaultLocale: localeValues.includes(envLocale as Locale) ? (envLocale as Locale) : "km",
};
