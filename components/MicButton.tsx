
import React from 'react';
import { AppState } from '../types';
import { IconMic, IconStop, IconSpinner } from './Icons';

interface MicButtonProps {
  appState: AppState;
  onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ appState, onClick }) => {
  const getButtonContent = () => {
    switch (appState) {
      case AppState.CONNECTING:
        return <IconSpinner />;
      case AppState.ACTIVE:
        return <IconStop />;
      case AppState.IDLE:
      case AppState.ERROR:
      default:
        return <IconMic />;
    }
  };

  const getButtonClass = () => {
    switch (appState) {
        case AppState.ACTIVE:
            return 'bg-red-600 hover:bg-red-700 animate-pulse';
        case AppState.CONNECTING:
            return 'bg-yellow-500 cursor-not-allowed';
        default:
            return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={appState === AppState.CONNECTING}
      className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${getButtonClass()} focus:ring-blue-400`}
    >
      {getButtonContent()}
    </button>
  );
};

export default MicButton;
