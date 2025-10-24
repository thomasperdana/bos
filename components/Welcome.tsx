
import React from 'react';
import { IconMic } from './Icons';

interface WelcomeProps {
    onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
    return (
        <div className="text-center m-auto text-gray-400 p-8">
            <div className="max-w-md mx-auto">
                <h2 className="text-3xl font-bold text-gray-200 mb-2">Welcome to Socratic Bible Study</h2>
                <p className="mb-6">Select a past session from the history panel or start a new conversation to begin your journey through scripture.</p>
                <p className="text-sm">Click the "New Chat" button in the sidebar or the microphone icon below to get started.</p>
            </div>
        </div>
    );
};

export default Welcome;
