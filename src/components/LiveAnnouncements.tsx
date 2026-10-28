import React from 'react';
import { Megaphone, AlertCircle, Info, Sparkles } from 'lucide-react';

interface LiveAnnouncementsProps {
  announcements: string[];
  isServiceSuspended?: boolean;
}

export const LiveAnnouncements: React.FC<LiveAnnouncementsProps> = ({
  announcements,
  isServiceSuspended,
}) => {
  const currentAnnouncements = announcements || [];

  return (
    <section
      aria-label="Live Game Announcements"
      className="bg-white rounded-2xl shadow-xs border border-indigo-100 p-3.5 space-y-2.5 transition-all"
    >
      <div className="flex items-center justify-between gap-2 border-b border-indigo-50/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Live Announcements</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full font-mono">
                Current Game
              </span>
            </h2>
          </div>
        </div>

        {isServiceSuspended && (
          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
            <span>Games Suspended</span>
          </span>
        )}
      </div>

      {isServiceSuspended && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Bingo games are currently suspended by the administrator.</span>
        </div>
      )}

      {currentAnnouncements.length === 0 ? (
        <div className="py-2.5 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>No new announcements for this game session.</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {currentAnnouncements.slice(0, 3).map((ann, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl text-xs flex items-start gap-2 transition-all ${
                idx === 0
                  ? 'bg-amber-50/90 text-amber-950 border border-amber-200 font-medium shadow-2xs'
                  : 'bg-slate-50/70 text-slate-700 border border-slate-100'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {idx === 0 ? (
                  <Sparkles className="w-3 h-3 text-amber-600" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                )}
              </div>
              <p className="leading-snug text-[11px] sm:text-xs">{ann}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
