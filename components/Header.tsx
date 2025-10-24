
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-4 border-b border-gray-700 shadow-md bg-gray-800">
      <h1 className="text-2xl md:text-3xl font-bold text-amber-300">Socratic Bible Study</h1>
      <p className="text-sm md:text-base text-gray-400">An AI-Guided Journey Through Scripture</p>
    </header>
  );
};

export default Header;
