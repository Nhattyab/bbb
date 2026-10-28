import React, { useRef } from 'react';
import { X, Award, Download, Printer } from 'lucide-react';
import { Winner } from '../../types/bingo';

interface CertificateExportModalProps {
  winner: Winner | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateExportModal({
  winner,
  isOpen,
  onClose,
}: CertificateExportModalProps) {
  const certRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !winner) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Official Championship Winner Certificate</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Preview Frame */}
        <div className="p-6">
          <div
            ref={certRef}
            className="border-8 border-double border-amber-600/80 p-8 text-center bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 rounded-xl shadow-xs relative"
          >
            <div className="uppercase tracking-[0.25em] text-[10px] font-black text-amber-700 mb-2">
              10:20 Bingo Championship
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif mb-4">
              Certificate of Victory
            </h1>
            <p className="text-xs text-slate-500 mb-2">This is proudly presented to</p>
            <div className="text-2xl font-extrabold text-blue-900 border-b-2 border-slate-300 pb-2 mb-4 mx-8 font-serif">
              {winner.displayName}
            </div>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              for successfully achieving an authenticated <strong className="uppercase">{winner.winningPattern.replace(/_/g, ' ')}</strong> on
              Card <span className="font-mono font-bold">#{winner.cardId}</span> and claiming the championship prize of
              <strong className="text-emerald-700"> ${winner.prizeAmount.toFixed(2)}</strong>.
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-left text-[10px] text-slate-500">
              <div>
                <span className="block font-bold text-slate-700">Date Verified</span>
                <span>{new Date(winner.confirmedAt).toLocaleDateString()}</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500 mx-auto flex items-center justify-center text-amber-600 font-black text-[9px] uppercase tracking-tighter">
                  Verified
                </div>
              </div>
              <div className="text-right">
                <span className="block font-bold text-slate-700">Championship Host</span>
                <span>Official Host Verification</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
