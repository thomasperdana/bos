
import React, { useEffect, useRef } from 'react';
import { Speaker, TranscriptEntry } from '../types';
import { IconUser, IconAI } from './Icons';

interface TranscriptProps {
  transcript: TranscriptEntry[];
}

const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="space-y-6">
            {transcript.map((entry, index) => (
                <div key={index} className={`flex items-start gap-4 ${entry.speaker === Speaker.User ? 'justify-start' : 'justify-end'}`}>
                    {entry.speaker === Speaker.User && <IconUser />}
                    <div className={`max-w-xl p-4 rounded-lg shadow-md ${entry.speaker === Speaker.User ? 'bg-blue-900/50' : 'bg-gray-700'}`}>
                        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                    </div>
                    {entry.speaker === Speaker.AI && <IconAI />}
                </div>
            ))}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default Transcript;
