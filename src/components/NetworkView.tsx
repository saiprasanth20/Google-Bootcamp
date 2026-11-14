import React, { useMemo, useState } from 'react';
import { MessageSquare, Search, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';

export const NetworkView: React.FC = () => {
  const { attendees, events, chats, openConnectDrawer } = useEventSphere();
  const [filter, setFilter] = useState<'all' | 'connected' | 'discover'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((a) => {
      if (filter === 'connected' && a.connectionStatus !== 'connected') {
        return false;
      }
      if (filter === 'discover' && a.connectionStatus === 'connected') {
        return false;
      }
      if (q) {
        const hay = [a.name, a.role, a.org, a.city, ...a.skills]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [attendees, filter, query]);

  const connectedCount = attendees.filter(
    (a) => a.connectionStatus === 'connected'
  ).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Builder Network
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Co-attendees, hackathon teammates, and active event threads ({connectedCount} connected).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Builders
            </button>
            <button
              type="button"
              onClick={() => setFilter('connected')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'connected'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Connected ({connectedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('discover')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === 'discover'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Discover
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills or city..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((person) => {
          const initials = person.name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const thread = chats[person.id] ?? [];
          const sharedEvent = events.find(
            (e) =>
              e.id === person.connectedViaEventId ||
              e.id === person.eventLinks[0]?.eventId
          );

          return (
            <div
              key={person.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ backgroundColor: person.avatarColor }}
                      className="w-10 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {person.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {person.role} · {person.org}
                      </p>
                    </div>
                  </div>
                  {person.connectionStatus === 'connected' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : person.connectionStatus === 'pending' ? (
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : null}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {person.city} · {person.intentBadge}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {person.bio}
                </p>

                {sharedEvent && (
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate">
                    Event context: {sharedEvent.title}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {person.skills.slice(0, 3).join(' · ')}
                </span>
                <button
                  type="button"
                  onClick={() => openConnectDrawer(person.id, sharedEvent?.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                    person.connectionStatus === 'connected'
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {person.connectionStatus === 'connected' ? (
                    <>
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>
                        Chat{thread.length > 0 ? ` (${thread.length})` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect & Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
