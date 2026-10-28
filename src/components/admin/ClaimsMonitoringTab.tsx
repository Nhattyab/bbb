import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { BingoClaim, GameSession } from '../../types/bingo';
import { WINNING_RULE_LABELS } from '../../utils/bingoRules';

interface ClaimsMonitoringTabProps {
  claims: (BingoClaim & { cardMatrix?: any; cardMarked?: any; isCardBlocked?: boolean })[];
  game: GameSession | null;
  onResolveClaim: (claimId: string, action: 'confirm' | 'reject', reason?: string) => Promise<void>;
  onInspectCard: (cardId: string) => void;
}

export function ClaimsMonitoringTab({
  claims,
  game,
  onResolveClaim,
  onInspectCard,
}: ClaimsMonitoringTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Bingo Claims Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit feed of all player claims submitted during the current and recent games.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Card ID</th>
                <th className="px-4 py-3">Claimed Pattern</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No claims submitted yet in this game.
                  </td>
                </tr>
              ) : (
                claims.map((cl) => (
                  <tr key={cl.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{cl.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{cl.userId}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{cl.cardId}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {WINNING_RULE_LABELS[cl.pattern] || cl.pattern}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(cl.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {cl.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Confirmed Winner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Rejected / Card Blocked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => onInspectCard(cl.cardId)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                        title="Inspect Card"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" />
                        <span>Inspect</span>
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
