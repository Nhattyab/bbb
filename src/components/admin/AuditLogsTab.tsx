import React, { useState } from 'react';
import { FileText, Search, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AuditLogEntry } from '../../types/bingo';

interface AuditLogsTabProps {
  logs: AuditLogEntry[];
}

export function AuditLogsTab({ logs }: AuditLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || log.actorRole === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Security & Operational Audit Logs</h2>
          <p className="text-xs text-slate-500">Immutable trail of game events, card changes, and host administrative actions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
            {logs.length} Total Events
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by action, actor, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="host">Host</option>
            <option value="system">System</option>
            <option value="player">Player</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No matching log entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Entity</th>
                  <th className="py-3 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map((log) => {
                  const roleBadgeColor =
                    log.actorRole === 'admin'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : log.actorRole === 'host'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : log.actorRole === 'system'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{log.actorName}</div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${roleBadgeColor}`}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{log.action}</td>
                      <td className="py-2.5 px-3 text-slate-500 uppercase">{log.entityType}</td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-md truncate">{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
