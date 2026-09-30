import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-zinc-950 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[130px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] animate-blob animation-delay-4000" />
    </div>
  );
};
