
import React from 'react';
import { Passage } from '../types';

interface PassageDisplayProps {
  passage: Passage;
}

const PassageDisplay: React.FC<PassageDisplayProps> = ({ passage }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 my-2 border border-amber-300/30 shadow-lg">
      <h2 className="text-xl font-bold text-amber-300 mb-2">{passage.reference} (KJV)</h2>
      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{passage.text}</p>
    </div>
  );
};

export default PassageDisplay;
