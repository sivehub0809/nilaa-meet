# Nilaa Meet

Mobile-first video meeting MVP for Cambodia and Southeast Asia, designed with a Khmer-friendly dark UI and a video-provider-agnostic architecture.

## Stack

- React + TypeScript
- Vite project structure
- Mocked service boundaries for:
  - provider token issuance
  - auth providers
  - AI transcription and translation
  - meeting summaries
  - PDF export

## Key flows

- Landing page with instant start and quick join
- Guest host flow with 2-meeting mock limit and 5-minute sessions
- Authenticated flow with 15-minute sessions and 3-participant cap
- Approval-based waiting room and host join requests
- Mobile-first meeting room with transcript, translation, and weak-network states
- Post-meeting summary with 30-minute PDF download window
- Host dashboard with past meetings and summaries

## Video provider model

- The prototype now treats the video layer as an adapter boundary instead of hard-coding one vendor.
- Default provider: `LiveKit`
- Mocked alternative adapters included for:
  - `Daily`
  - `Agora`
  - `Custom SFU`
- Selection is exposed in the landing flow so we can demonstrate that the UX and room logic are not tied to one provider.

## Integration boundaries

- `src/services.ts`
  - `videoProviderService.issueToken()` maps to a future generic `POST /api/video/token`
  - LiveKit can still remain the first production target behind that generic contract
  - `meetingService` is the room/session orchestration layer
  - `authService` is ready for Google, Facebook, Phone OTP, and Telegram OTP wiring
  - `transcriptService`, `translationService`, `summaryService`, and `pdfService` hold AI/PDF seams

## Project structure

- `src/App.tsx`: app state and flow orchestration
- `src/components.tsx`: reusable screen-level UI components
- `src/i18n.ts`: Khmer/English UI copy and locale detection
- `src/mockData.ts`: realistic transcript, meeting, and summary seed data
- `src/services.ts`: provider adapters and mock backend boundaries
- `src/types.ts`: shared app types
- `src/styles.css`: dark, mobile-first visual system

## GitHub handoff

- This folder is ready to initialize as a Git repository and push to GitHub.
- A GitHub Pages workflow is included at `.github/workflows/deploy-pages.yml`.
- `vite.config.ts` uses `base: "./"` so the static build can work on GitHub Pages without a hard-coded repo name.
- If you want, the next safe step is:
  - create the repo locally
  - add a remote
  - make the first commit
  - push to GitHub Pages, Vercel, or Netlify from the GitHub repo

## Notes

- This workspace did not include a package manager on PATH, so dependencies are declared but not installed here.
- Fonts currently load from Google Fonts in `index.html`; for stricter offline or production control, self-host `Kantumruy Pro` and the Latin UI font.
