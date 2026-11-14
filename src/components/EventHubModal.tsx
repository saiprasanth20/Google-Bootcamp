import React, { useMemo, useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  ExternalLink,
  Check,
  Users,
  MessageSquare,
  Heart,
  Sparkles,
  Loader2,
  PenSquare,
  Search,
  Send,
  ArrowUpRight,
} from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';
import { SafeImage } from '@/src/components/SafeImage';
import { GoogleStreetMap } from '@/src/components/GoogleStreetMap';
import { IntentBadge, SynthesisResult } from '@/src/types';

interface EventHubModalProps {
  googleMapsApiKey: string;
  onJumpToFullMap: (eventId: string) => void;
}

const INTENT_FILTERS: Array<'All' | IntentBadge> = [
  'All',
  'Looking for Teammates',
  'Open to Meetup',
  'Splitting Travel',
  'Hiring / Mentoring',
];

export const EventHubModal: React.FC<EventHubModalProps> = ({
  googleMapsApiKey,
  onJumpToFullMap,
}) => {
  const {
    hubEventId,
    hubTab,
    openEventHub,
    closeEventHub,
    events,
    user,
    attendees,
    recaps,
    toggleGoing,
    toggleAttended,
    updateStatusNote,
    openConnectDrawer,
    openRecapComposer,
    toggleRecapLike,
    addRecapComment,
    getEventAttendeeCount,
  } = useEventSphere();

  const [intentFilter, setIntentFilter] = useState<'All' | IntentBadge>('All');
  const [skillSearch, setSkillSearch] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [synthesisMap, setSynthesisMap] = useState<Record<string, SynthesisResult>>({});
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);

  const event = useMemo(
    () => events.find((e) => e.id === hubEventId) ?? null,
    [events, hubEventId]
  );

  const eventAttendees = useMemo(() => {
    if (!event) return [];
    const q = skillSearch.trim().toLowerCase();
    return attendees
      .map((a) => {
        const link = a.eventLinks.find((l) => l.eventId === event.id);
        return link ? { attendee: a, link } : null;
      })
      .filter((x): x is { attendee: (typeof attendees)[number]; link: NonNullable<(typeof attendees)[number]['eventLinks'][number]> } => x !== null)
      .filter(({ attendee }) => {
        if (intentFilter !== 'All' && attendee.intentBadge !== intentFilter) {
          return false;
        }
        if (q) {
          const hay = [
            attendee.name,
            attendee.role,
            attendee.org,
            attendee.city,
            ...attendee.skills,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [attendees, event, intentFilter, skillSearch]);

  const eventRecaps = useMemo(() => {
    if (!event) return [];
    return recaps.filter((r) => r.eventId === event.id);
  }, [recaps, event]);

  if (!event) return null;

  const isGoing = user.goingEventIds.includes(event.id);
  const isAttended = user.attendedEventIds.includes(event.id);
  const myNote = user.statusNotes[event.id] ?? '';
  const synthesis = synthesisMap[event.id] ?? null;

  const handleSynthesize = async () => {
    setSynthesizing(true);
    setSynthesisError(null);
    try {
      const res = await fetch('/api/events/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            title: event.title,
            city: event.city,
            country: event.country,
            startDate: event.startDate,
            description: event.description,
          },
          recaps: eventRecaps.map((r) => ({
            authorName: r.authorName,
            authorRole: r.authorRole,
            processReview: r.processReview,
            keyLearnings: r.keyLearnings,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize takeaways.');
      }
      setSynthesisMap((prev) => ({ ...prev, [event.id]: data as SynthesisResult }));
    } catch (err: unknown) {
      setSynthesisError(
        err instanceof Error ? err.message : 'Unable to generate AI synthesis.'
      );
    } finally {
      setSynthesizing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <div className="w-full max-w-5xl h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Top Breadcrumb Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <button
              type="button"
              onClick={closeEventHub}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Explore
            </button>
            <span aria-hidden="true">/</span>
            <span>{event.city}</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {event.title}
            </span>
          </div>
          <button
            type="button"
            onClick={closeEventHub}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close Event Hub"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Hub Body */}
        <div className="flex-1 overflow-y-auto es-scroll">
          {/* Hero Header */}
          <div className="relative h-52 sm:h-60 w-full overflow-hidden">
            <SafeImage
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
              fallbackLabel={event.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/15" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
                  <span className="font-medium">{event.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.startDate}
                    {event.endDate !== event.startDate ? ` → ${event.endDate}` : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.venueName}, {event.city}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-balance">
                  {event.title}
                </h1>
              </div>

              {/* RSVP Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleGoing(event.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isGoing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white/95 text-slate-900 hover:bg-white'
                  }`}
                >
                  {isGoing && <Check className="w-3.5 h-3.5" />}
                  <span>{isGoing ? 'Going' : 'Mark Going'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleAttended(event.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isAttended
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-900/80 text-white border border-white/25 hover:bg-slate-900'
                  }`}
                >
                  {isAttended && <Check className="w-3.5 h-3.5" />}
                  <span>{isAttended ? 'Attended' : 'Mark Attended'}</span>
                </button>

                {isAttended && (
                  <button
                    type="button"
                    onClick={() => openRecapComposer(event.id)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    <span>Write Event Recap</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Status Note Bar when Going */}
          {isGoing && (
            <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/25 border-b border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                Your Attendee Lobby Note:
              </span>
              <input
                type="text"
                value={myNote}
                onChange={(e) => updateStatusNote(event.id, e.target.value)}
                placeholder="e.g., Arriving Friday morning, looking to team up..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
          )}

          {/* Lifecycle Tabs */}
          <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => openEventHub(event.id, 'overview')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                hubTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Overview & Location
            </button>
            <button
              type="button"
              onClick={() => openEventHub(event.id, 'lobby')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                hubTab === 'lobby'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Attendee Lobby</span>
              <span className="font-mono-tabular text-[11px] opacity-75">
                ({getEventAttendeeCount(event.id)})
              </span>
            </button>
            <button
              type="button"
              onClick={() => openEventHub(event.id, 'recaps')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                hubTab === 'recaps'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Recaps & Showcase</span>
              <span className="font-mono-tabular text-[11px] opacity-75">
                ({eventRecaps.length})
              </span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="p-6">
            {hubTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      About This Event
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Topics: {event.tags.join(' · ')}
                    </div>
                  </div>

                  {event.schedule && event.schedule.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Schedule Highlights
                      </h2>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800">
                        {event.schedule.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono-tabular font-medium text-slate-500 dark:text-slate-400 w-24 shrink-0">
                                {item.time}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {item.title}
                              </span>
                            </div>
                            {item.speaker && (
                              <span className="text-slate-500 dark:text-slate-400 sm:text-right">
                                {item.speaker}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                    >
                      <span>Official Event Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEventHub(event.id, 'lobby')}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 inline-flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Browse Attendee Lobby</span>
                    </button>
                  </div>
                </div>

                {/* Embedded Venue Map */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Venue Location
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        closeEventHub();
                        onJumpToFullMap(event.id);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Open in Street Map</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <GoogleStreetMap
                      apiKey={googleMapsApiKey}
                      events={[event]}
                      selectedEventId={event.id}
                      onSelectEvent={() => {}}
                      onOpenHub={() => {}}
                      getAttendeeCount={getEventAttendeeCount}
                      compact
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {event.venueName} · {event.city}, {event.country} ·{' '}
                    <span className="font-mono-tabular">
                      {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {hubTab === 'lobby' && (
              <div className="space-y-5">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {INTENT_FILTERS.map((intent) => (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => setIntentFilter(intent)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          intentFilter === intent
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {intent}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full md:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Filter by skill, role, or city..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Current user lobby entry if going or attended */}
                {(isGoing || isAttended) && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        You ({isAttended ? 'Attended' : 'Going'}) · {user.city} ·{' '}
                        {user.skills.slice(0, 3).join(' / ')}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {user.name} — {user.role}, {user.org}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {myNote || 'Planning to attend — open to connect!'}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                      Visible in Lobby
                    </span>
                  </div>
                )}

                {eventAttendees.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No builders match those lobby filters yet.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Clear the intent filter or mark yourself Going to seed the lobby.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eventAttendees.map(({ attendee, link }) => {
                      const initials = attendee.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div
                          key={attendee.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 p-4 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              style={{ backgroundColor: attendee.avatarColor }}
                              className="w-10 h-10 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {attendee.intentBadge} · {attendee.city} ·{' '}
                                {link.status === 'attended' ? 'Attended' : 'Going'}
                              </div>
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                                {attendee.name}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {attendee.role} · {attendee.org}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            “{link.statusNote}”
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {attendee.skills.join(' · ')}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                openConnectDrawer(attendee.id, event.id)
                              }
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                                attendee.connectionStatus === 'connected'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : attendee.connectionStatus === 'pending'
                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {attendee.connectionStatus === 'connected'
                                ? 'Message'
                                : attendee.connectionStatus === 'pending'
                                  ? 'Pending'
                                  : 'Connect & Plan'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {hubTab === 'recaps' && (
              <div className="space-y-6">
                {/* AI Event Synthesis Banner */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Community Takeaways Brief</span>
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Synthesize attendee recaps and live web search context into what people learned & how it went.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleSynthesize()}
                        disabled={synthesizing}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        {synthesizing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <span>Synthesize Community Takeaways</span>
                        )}
                      </button>

                      {isAttended ? (
                        <button
                          type="button"
                          onClick={() => openRecapComposer(event.id)}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap flex items-center gap-1.5"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                          <span>Write Recap</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            toggleAttended(event.id);
                            openRecapComposer(event.id);
                          }}
                          className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          Mark Attended & Write Recap
                        </button>
                      )}
                    </div>
                  </div>

                  {synthesisError && (
                    <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                      {synthesisError}
                    </p>
                  )}

                  {synthesis && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {synthesis.headline}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {synthesis.summary}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {synthesis.highlights.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                              How It Went
                            </p>
                            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              {synthesis.highlights.map((h, i) => (
                                <li key={i}>• {h}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {synthesis.topTakeaways.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                              What People Learned
                            </p>
                            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                              {synthesis.topTakeaways.map((t, i) => (
                                <li key={i}>• {t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {synthesis.sources.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-3">
                          {synthesis.sources.slice(0, 4).map((s, i) => (
                            <a
                              key={i}
                              href={s.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span className="truncate max-w-[200px]">{s.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recaps List */}
                {eventRecaps.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No post-event recaps published for this event yet.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mark this event as Attended to share your project demo, photos, and key takeaways.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {eventRecaps.map((recap) => (
                      <article
                        key={recap.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {recap.authorRole} · {recap.authorOrg} ·{' '}
                              <span className="font-mono-tabular">{recap.createdAt}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                              {recap.authorName}
                            </h4>
                          </div>

                          {recap.authorId !== user.id && (
                            <button
                              type="button"
                              onClick={() =>
                                openConnectDrawer(recap.authorId, event.id)
                              }
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              Get in Touch
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {recap.processReview}
                        </p>

                        {recap.keyLearnings.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Key Learnings
                            </p>
                            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              {recap.keyLearnings.map((k, idx) => (
                                <li key={idx}>• {k}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {recap.photos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {recap.photos.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                className="rounded-lg overflow-hidden aspect-[16/9] border border-slate-200 dark:border-slate-800"
                              >
                                <SafeImage
                                  src={photo}
                                  alt={`${recap.authorName} recap photo ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleRecapLike(recap.id)}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                recap.likedByMe
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  recap.likedByMe ? 'fill-current' : ''
                                }`}
                              />
                              <span className="font-mono-tabular">{recap.likes}</span>
                            </button>
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="font-mono-tabular">
                                {recap.comments.length}
                              </span>
                            </span>
                          </div>

                          {recap.projectLink && (
                            <a
                              href={recap.projectLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>View Project / Repo</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Comments Thread */}
                        <div className="space-y-2 pt-2">
                          {recap.comments.map((cmt) => (
                            <div
                              key={cmt.id}
                              className="rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                            >
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {cmt.authorName}
                              </span>{' '}
                              <span className="text-slate-400">· {cmt.authorRole}</span>
                              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                                {cmt.text}
                              </p>
                            </div>
                          ))}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const draft = commentDrafts[recap.id] ?? '';
                              if (!draft.trim()) return;
                              addRecapComment(recap.id, draft);
                              setCommentDrafts((prev) => ({
                                ...prev,
                                [recap.id]: '',
                              }));
                            }}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              value={commentDrafts[recap.id] ?? ''}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({
                                  ...prev,
                                  [recap.id]: e.target.value,
                                }))
                              }
                              placeholder="Add a comment or follow-up question..."
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Post</span>
                            </button>
                          </form>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
