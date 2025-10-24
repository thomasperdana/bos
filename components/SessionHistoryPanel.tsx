
import React from 'react';
import { ChatSession } from '../types';
import { IconTrash, IconPlus } from './Icons';

interface SessionHistoryPanelProps {
  sessions: ChatSession[];
  selectedSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onClearHistory: () => void;
}

const SessionHistoryPanel: React.FC<SessionHistoryPanelProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  onNewSession,
  onClearHistory,
}) => {
  return (
    <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col flex-shrink-0 h-screen border-r border-gray-700">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Session History</h2>
      </div>
      <div className="p-2 space-y-2">
         <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors text-white"
        >
          <IconPlus />
          New Chat
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto p-2">
        {sessions.length === 0 && (
            <div className="text-center text-gray-500 p-4">No past sessions.</div>
        )}
        {sessions.map(session => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session)}
            className={`w-full text-left p-3 rounded-md mb-2 transition-colors ${
              selectedSessionId === session.id ? 'bg-amber-400/20' : 'hover:bg-gray-700'
            }`}
          >
            <p className="font-semibold truncate">{session.passage?.reference || 'Conversation'}</p>
            <p className="text-xs text-gray-400">{new Date(session.startTime).toLocaleString()}</p>
          </button>
        ))}
      </nav>
      {sessions.length > 0 && (
        <div className="p-2 border-t border-gray-700">
            <button
            onClick={onClearHistory}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-gray-400 hover:bg-red-800 hover:text-white transition-colors"
            >
            <IconTrash />
            Clear History
            </button>
        </div>
      )}
    </aside>
  );
};

export default SessionHistoryPanel;
