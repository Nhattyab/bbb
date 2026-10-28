import React from 'react';
import { Trophy } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center text-white select-none antialiased p-4">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl ring-4 ring-white/10 mb-5 animate-pulse">
        <Trophy className="w-10 h-10" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase text-center">
        10:20 BINGO
      </h1>
      <p className="text-xs text-indigo-300 font-semibold uppercase tracking-widest mt-1">
        Championship Tournament
      </p>
      <div className="w-32 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
        <div className="w-1/2 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
    </div>
  );
};
