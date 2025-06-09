import React from 'react';
import Link from 'next/link';

const TopBar = () => {
  return (
    <div className="w-full h-16 bg-gradient-to-r from-primary-start to-primary-end text-white flex items-center px-6 shadow-elevated">
      <h1 className="text-xl font-semibold tracking-tight">AI Model Comparison</h1>
      <div className="flex-grow"></div>
      <nav className="flex gap-4">
        <Link href="/comparisons" className="px-4 py-2 hover:bg-white/10 rounded-md transition-colors">
          History
        </Link>
      </nav>
    </div>
  );
};

export default TopBar; 