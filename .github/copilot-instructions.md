## Repo overview

This is a small React + Vite TypeScript app that uses the Google GenAI Live API for an audio-driven, conversational "Socratic Bible Study" experience.

Key integration points:
- `hooks/useGeminiLive.ts` — primary AI integration. Creates a `GoogleGenAI` instance, opens a LiveSession and wires Web Audio input/output. Most agent work (adding tools, changing model config, handling server messages) should start here.
- `services/audioUtils.ts` — base64 encode/decode and PCM <-> AudioBuffer helpers. Note: the code assumes 16-bit PCM (Int16) and uses 16000 Hz input / 24000 Hz output in `useGeminiLive`.
- `services/historyService.ts` — localStorage-based session persistence under key `socraticBibleStudyHistory`.
- `components/*` — UI components. `MicButton.tsx` shows how `AppState` maps to UI states and disables interaction during CONNECTING.

Quick run commands (from repo root):
- Install: `npm install`
- Dev: `npm run dev` (Vite)
- Build: `npm run build`

Environment
- README.md instructs to set `GEMINI_API_KEY` in `.env.local`. Note: the code reads `process.env.API_KEY` in `useGeminiLive.ts` — confirm which env var is present in your local `.env.local` and keep these consistent when changing keys.

Patterns and conventions to follow
- Live session lifecycle: `connect({ callbacks: { onopen, onmessage, onerror, onclose } })` — keep audio resource allocation and cleanup paired (see `startSession` / `stopSession`). Avoid leaving AudioContexts open.
- Tool declarations: `getScripture` is registered via `tools: [{ functionDeclarations: [getScriptureFunctionDeclaration] }]` in the session config. Tool calls arrive via `message.toolCall` in `onmessage` — follow the existing pattern (identify `fc.name`, call external API, then `session.sendToolResponse(...)`).
- Audio timing: `nextAudioStartTime` is used to schedule playback buffers; when modifying output audio handling keep the same scheduling approach to avoid audio glitches.
- Transcript updates: incoming partial transcripts are merged into the last transcript entry when the last entry matches the speaker and `isFinal` is false. Preserve this merge behavior when editing transcription logic.

Files to inspect when changing behavior
- `hooks/useGeminiLive.ts` — model selection, session config, audio wiring, message handling
- `services/audioUtils.ts` — encode/decode and `decodeAudioData` implementation
- `services/historyService.ts` — persistence behavior and storage key
- `components/MicButton.tsx` and `App.tsx` — UX decisions tied to `AppState` transitions
- `types.ts` — domain types (AppState, TranscriptEntry, Passage, ChatSession)

External interactions to be aware of
- Uses `@google/genai` Live API. Model string is currently hard-coded: `gemini-2.5-flash-native-audio-preview-09-2025`.
- Runtime fetch to `https://bible-api.com/...` inside a tool-call handler to resolve scripture references. Network errors are caught and send a tool response with an error message.

Project-specific gotchas
- Env var mismatch: README asks for `GEMINI_API_KEY` while `useGeminiLive.ts` references `process.env.API_KEY`. Check `.env.local` and adjust the code or README to match.
- The code uses `ScriptProcessorNode` (legacy) for microphone processing — be careful when modernizing this; switching to AudioWorklet requires changes to how audio frames are captured and sent.
- `decodeAudioData` assumes 16-bit PCM frames and explicit sample rates; adjust both `useGeminiLive` and `audioUtils` together if sample rates or channel counts change.

What a new agent should do first
1. Open `hooks/useGeminiLive.ts` and `services/audioUtils.ts` to understand live session setup and audio transformations.
2. Confirm the correct environment variable is present in `.env.local` and reconcile `README.md` vs `useGeminiLive.ts`.
3. When adding tools, add `FunctionDeclaration` objects in `useGeminiLive`'s config and handle `message.toolCall` in the existing `onmessage` handler.
4. Run `npm install` then `npm run dev` to test locally. Watch the console for errors (the app logs session lifecycle events and errors).

If anything in this file is unclear or you want examples added (e.g., where to add a new tool, or sample `.env.local` contents), tell me which section to expand and I'll iterate.
