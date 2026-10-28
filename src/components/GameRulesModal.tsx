import React from 'react';
import { X, BookOpen, ShieldAlert, Award, Clock } from 'lucide-react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Official Tournament Rules</h3>
              <p className="text-[11px] text-indigo-100">10:20 BINGO Championship Regulations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 leading-relaxed">
          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-[10px]">1</span>
              <span>Card Registration</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Every card must be explicitly registered prior to the start of the tournament. Unregistered cards cannot be used to claim Bingo.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-[10px]">2</span>
              <span>Manual Marking & Number Calling</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Numbers called by the host do not automatically mark your cards. You must manually daub called numbers. When Auto Complete is enabled in Settings, manually daubing a called number on one card synchronizes that number across your other matching cards.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-[10px]">3</span>
              <span>15-Second Winner Claim Window</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              When the first valid Bingo claim is verified, a 15-second claim window opens. Any other players with valid winning cards can submit their claim within this window to share the victory.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-black flex items-center justify-center text-[10px]">4</span>
              <span>Card Blocking on False Claims</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Submitting an invalid claim blocks the claiming card from winning in that game session. All validations are authoritative on the server.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
