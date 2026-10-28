import React, { useState } from 'react';
import { Users, CreditCard, Search, ShieldAlert, Eye, ShieldCheck, RefreshCw } from 'lucide-react';
import { User, BingoCard } from '../../types/bingo';

interface PlayersCardsTabProps {
  players: (User & { cardsCount?: number; registeredCardsCount?: number; blockedCardsCount?: number })[];
  cards: (BingoCard & { ownerName?: string; ownerUsername?: string; markedCount?: number; markedPercentage?: number })[];
  onInspectCard: (card: BingoCard) => void;
  onBlockCard: (cardId: string) => void;
  onUnblockCard: (cardId: string) => void;
  onRefresh: () => void;
}

export function PlayersCardsTab({
  players,
  cards,
  onInspectCard,
  onBlockCard,
  onUnblockCard,
  onRefresh,
}: PlayersCardsTabProps) {
  const [subTab, setSubTab] = useState<'cards' | 'players'>('cards');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCards = cards.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      c.id.toLowerCase().includes(q) ||
      (c.ownerName && c.ownerName.toLowerCase().includes(q)) ||
      c.userId.toLowerCase().includes(q);

    if (!matchQ) return false;
    if (filterStatus === 'registered') return c.isRegistered && !c.isBlocked;
    if (filterStatus === 'unregistered') return !c.isRegistered && !c.isBlocked;
    if (filterStatus === 'blocked') return c.isBlocked;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Subtab selection & Search bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('cards')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              subTab === 'cards'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Cards Directory ({cards.length})
          </button>
          <button
            onClick={() => setSubTab('players')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              subTab === 'players'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Players Directory ({players.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-blue-600 transition"
            />
          </div>

          {subTab === 'cards' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="unregistered">Unregistered</option>
              <option value="blocked">Blocked</option>
            </select>
          )}

          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Table */}
      {subTab === 'cards' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Card ID</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Marked Cells</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No cards match current filter.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.id}</td>
                      <td className="px-4 py-3 text-slate-700">{c.ownerName || c.userId}</td>
                      <td className="px-4 py-3">
                        {c.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Blocked
                          </span>
                        ) : c.isRegistered ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Registered
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {c.markedCount ?? 0} / 25 ({c.markedPercentage ?? 0}%)
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.cardDateString}</td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => onInspectCard(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                          title="Inspect 5x5 Card Matrix"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" />
                          <span>Inspect</span>
                        </button>
                        {c.isBlocked ? (
                          <button
                            onClick={() => onUnblockCard(c.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition cursor-pointer"
                          >
                            Unblock
                          </button>
                        ) : (
                          <button
                            onClick={() => onBlockCard(c.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg transition cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Players Directory Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Username / ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Active Cards</th>
                  <th className="px-4 py-3">Bingos Won</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{p.displayName}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono">{p.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : p.role === 'host'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono">
                      {p.registeredCardsCount ?? 0} registered
                    </td>
                    <td className="px-4 py-3 text-amber-700 font-bold font-mono">
                      {p.stats?.bingosWon ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${p.balance?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
