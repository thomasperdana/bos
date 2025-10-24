
export enum Speaker {
  User = 'user',
  AI = 'ai',
}

export interface TranscriptEntry {
  speaker: Speaker;
  text: string;
  isFinal: boolean;
}

export interface Passage {
  reference: string;
  text: string;
}

export enum AppState {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ERROR = 'error',
}

export interface ChatSession {
  id: string;
  startTime: number;
  passage: Passage | null;
  transcript: TranscriptEntry[];
}
