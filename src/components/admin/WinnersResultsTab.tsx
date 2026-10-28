import React from 'react';
import { Trophy, Award, Eye, FileText, Download } from 'lucide-react';
import { Winner } from '../../types/bingo';

interface WinnersResultsTabProps {
  winners: Winner[];
  totalPrizePool: number;
  onInspectWinnerCard: (winner: Winner) => void;
  onExportCertificate: (winner: Winner) => void;
}

export function WinnersResultsTab({
  winners,
  totalPrizePool,
  onInspectWinnerCard,
  onExportCertificate,
}: WinnersResultsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Confirmed Tournament Winners</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent registry of all official Bingo claims verified during the championship.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Allocated</span>
          <span className="text-lg font-black font-mono text-emerald-600 block">
            ${(winners.length * (totalPrizePool / Math.max(1, winners.length))).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Winner Name</th>
                <th className="px-4 py-3">Card ID</th>
                <th className="px-4 py-3">Pattern</th>
                <th className="px-4 py-3">Confirmed At</th>
                <th className="px-4 py-3">Prize Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {winners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No confirmed winners in the active championship round yet.
                  </td>
                </tr>
              ) : (
                winners.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-[10px]">
                          🏆
                        </div>
                        <span className="font-bold text-slate-900">{w.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{w.cardId}</td>
                    <td className="px-4 py-3 text-slate-700">{w.winningPattern}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(w.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                      ${w.prizeAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => onInspectWinnerCard(w)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                        title="Inspect 5x5 Winning Card"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => onExportCertificate(w)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition cursor-pointer"
                        title="Export Winner Certificate"
                      >
                        <FileText className="w-3.5 h-3.5 inline mr-1" />
                        <span>Certificate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
