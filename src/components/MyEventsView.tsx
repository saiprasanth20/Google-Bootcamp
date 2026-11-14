import React, { useMemo, useState } from 'react';
import { Calendar, MapPin, PenSquare, Users, ArrowUpRight } from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';
import { SafeImage } from '@/src/components/SafeImage';

export const MyEventsView: React.FC = () => {
  const {
    events,
    user,
    openEventHub,
    openRecapComposer,
    updateStatusNote,
    setActiveView,
    getEventAttendeeCount,
  } = useEventSphere();

  const [tab, setTab] = useState<'going' | 'attended'>('going');

  const goingEvents = useMemo(
    () => events.filter((e) => user.goingEventIds.includes(e.id)),
    [events, user.goingEventIds]
  );

  const attendedEvents = useMemo(
    () => events.filter((e) => user.attendedEventIds.includes(e.id)),
    [events, user.attendedEventIds]
  );

  const activeList = tab === 'going' ? goingEvents : attendedEvents;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            My Event Lifecycle
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your pre-event lobby notes and publish verified post-event recaps.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => setTab('going')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'going'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Upcoming · Going ({goingEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('attended')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === 'attended'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Past · Attended ({attendedEvents.length})
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {tab === 'going'
              ? 'No upcoming events marked Going yet'
              : 'No attended events recorded yet'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore the global globe to RSVP for upcoming events or mark past conferences attended.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('explore')}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Explore Global Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeList.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
            >
              <div className="h-40 overflow-hidden relative">
                <SafeImage
                  src={ev.coverImage}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{ev.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.startDate}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {getEventAttendeeCount(ev.id)} builders
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {ev.venueName}, {ev.city}
                    </span>
                  </p>

                  {tab === 'going' && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Lobby Status Note
                      </label>
                      <input
                        type="text"
                        value={user.statusNotes[ev.id] ?? ''}
                        onChange={(e) => updateStatusNote(ev.id, e.target.value)}
                        placeholder="Add your arrival time or teammate search note..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      openEventHub(ev.id, tab === 'going' ? 'lobby' : 'recaps')
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{tab === 'going' ? 'Attendee Lobby' : 'View Recaps'}</span>
                  </button>

                  {tab === 'attended' ? (
                    <button
                      type="button"
                      onClick={() => openRecapComposer(ev.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                      <span>Write Recap</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEventHub(ev.id, 'overview')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 inline-flex items-center gap-1"
                    >
                      <span>Open Hub</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
