import React, { ReactNode } from 'react';

interface PaneProps {
  title: string;
  children?: ReactNode;
}

const Pane = ({ title, children }: PaneProps) => {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg p-4 m-2">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
      <div className="h-[calc(100%-3rem)] overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Pane; 