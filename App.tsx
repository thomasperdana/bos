
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MicButton from './components/MicButton';
import PassageDisplay from './components/PassageDisplay';
import Transcript from './components/Transcript';
import SessionHistoryPanel from './components/SessionHistoryPanel';
import Welcome from './components/Welcome';
import { useGeminiLive } from './hooks/useGeminiLive';
import { AppState, ChatSession } from './types';
import * as historyService from './services/historyService';

const App: React.FC = () => {
  const {
    appState,
    transcript,
    passage,
    error,
    startSession,
    stopSession,
  } = useGeminiLive();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const previousAppState = useRef<AppState>(appState);

  useEffect(() => {
    setSessions(historyService.loadSessions());
  }, []);
  
  useEffect(() => {
    historyService.saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (previousAppState.current === AppState.ACTIVE && appState === AppState.IDLE && transcript.length > 0) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        startTime: Date.now(),
        passage,
        transcript,
      };
      setSessions(prev => [newSession, ...prev]);
      setSelectedSession(newSession);
    }
    previousAppState.current = appState;
  }, [appState, transcript, passage]);

  const handleMicClick = () => {
    if (appState === AppState.ACTIVE) {
      stopSession();
    } else {
      setSelectedSession(null);
      startSession();
    }
  };
  
  const handleSelectSession = (session: ChatSession) => {
    if (appState === AppState.ACTIVE) {
        stopSession();
    }
    setSelectedSession(session);
  };

  const handleNewSession = () => {
    if (appState === AppState.ACTIVE) {
        stopSession();
    }
    setSelectedSession(null);
    startSession();
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all session history? This cannot be undone.')) {
        setSessions([]);
        setSelectedSession(null);
        historyService.clearSessions();
    }
  };

  const isLiveSession = appState === AppState.ACTIVE || appState === AppState.CONNECTING;
  const displayedTranscript = isLiveSession ? transcript : selectedSession?.transcript ?? [];
  const displayedPassage = isLiveSession ? passage : selectedSession?.passage ?? null;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-serif">
      <SessionHistoryPanel
        sessions={sessions}
        selectedSessionId={isLiveSession ? null : selectedSession?.id ?? null}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onClearHistory={handleClearHistory}
      />
      <div className="flex flex-col flex-grow">
        <Header />
        <main className="flex-grow flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto pb-32">
          {!isLiveSession && !selectedSession && <Welcome onStart={handleNewSession} />}
          {displayedPassage && <PassageDisplay passage={displayedPassage} />}
          {displayedTranscript.length > 0 && <Transcript transcript={displayedTranscript} />}
          {error && (
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white p-3 rounded-lg shadow-lg">
                  <p><span className="font-bold">Error:</span> {error}</p>
              </div>
          )}
        </main>
        {(isLiveSession || (!selectedSession && appState !== AppState.ERROR)) && (
            <footer className="fixed bottom-0 left-64 right-0 bg-gray-900/80 backdrop-blur-sm p-4 flex justify-center">
                <MicButton appState={appState} onClick={handleMicClick} />
            </footer>
        )}
      </div>
    </div>
  );
};

export default App;
