import React, { useState } from 'react';
import { History, Eye, Download, Search, Calendar, Trophy, Hash } from 'lucide-react';
import { HistoricalGame } from '../../types/bingo';

interface GameHistoryTabProps {
  history: HistoricalGame[];
  onViewRecap: (game: HistoricalGame) => void;
}

export function GameHistoryTab({ history, onViewRecap }: GameHistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.gameCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.winners.some((w) => w.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Game Code', 'Title', 'Date', 'Rule', 'Balls Called', 'Winners', 'Prize Pool'];
    const rows = filteredHistory.map((g) => [
      g.gameCode,
      `"${g.title.replace(/"/g, '""')}"`,
      new Date(g.completedAt).toISOString(),
      g.winningRule,
      g.ballsCalledCount,
      `"${g.winners.map((w) => w.displayName).join(', ')}"`,
      g.prizePool,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bingo_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Tournament History & Reports</h2>
          <p className="text-xs text-slate-500">Archived game sessions, winner records, and auditable ball histories</p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredHistory.length === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game title, code, or winner name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No game records found</p>
            <p className="text-xs text-slate-400">Completed championships will automatically archive here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Game Code</th>
                  <th className="py-3 px-3">Title & Rule</th>
                  <th className="py-3 px-3">Date Completed</th>
                  <th className="py-3 px-3">Stats</th>
                  <th className="py-3 px-3">Winner(s)</th>
                  <th className="py-3 px-3">Prize</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{g.gameCode}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{g.title}</div>
                      <div className="text-[11px] text-slate-500 capitalize">{g.winningRule.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(g.completedAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(g.completedAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>{g.ballsCalledCount} balls called</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{g.registeredPlayersCount} players / {g.totalCardsCount} cards</span>
                    </td>
                    <td className="py-3 px-3">
                      {g.winners.length === 0 ? (
                        <span className="text-slate-400 italic">No winners</span>
                      ) : (
                        <div className="space-y-1">
                          {g.winners.map((w) => (
                            <div key={w.id} className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>{w.displayName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">${g.prizePool.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onViewRecap(g)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Recap</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
