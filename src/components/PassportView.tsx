import React, { useMemo, useState } from 'react';
import {
  Check,
  Edit3,
  ExternalLink,
  MapPin,
  PenSquare,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';
import { SafeImage } from '@/src/components/SafeImage';

export const PassportView: React.FC = () => {
  const {
    user,
    events,
    recaps,
    attendees,
    updateProfile,
    openEventHub,
    openRecapComposer,
    resetDemoData,
  } = useEventSphere();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [org, setOrg] = useState(user.org);
  const [city, setCity] = useState(user.city);
  const [bio, setBio] = useState(user.bio);
  const [skillsText, setSkillsText] = useState(user.skills.join(', '));

  const goingEvents = useMemo(
    () => events.filter((e) => user.goingEventIds.includes(e.id)),
    [events, user.goingEventIds]
  );

  const attendedEvents = useMemo(
    () => events.filter((e) => user.attendedEventIds.includes(e.id)),
    [events, user.attendedEventIds]
  );

  const myRecaps = useMemo(
    () => recaps.filter((r) => r.authorId === user.id),
    [recaps, user.id]
  );

  const connectedCount = attendees.filter(
    (a) => a.connectionStatus === 'connected'
  ).length;

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || user.name,
      role: role.trim() || user.role,
      org: org.trim() || user.org,
      city: city.trim() || user.city,
      bio: bio.trim() || user.bio,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    setEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Builder Passport Header */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        {!editing ? (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white font-display font-bold text-xl flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Builder Passport · {user.city} ·{' '}
                  <span className="font-mono-tabular">
                    {attendedEvents.length} attended · {myRecaps.length} recaps ·{' '}
                    {connectedCount} connections
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {user.name}
                </h1>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {user.role} at {user.org}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed pt-1">
                  {user.bio}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Stack: {user.skills.join(' · ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setName(user.name);
                  setRole(user.role);
                  setOrg(user.org);
                  setCity(user.city);
                  setBio(user.bio);
                  setSkillsText(user.skills.join(', '));
                  setEditing(true);
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Passport</span>
              </button>
              <button
                type="button"
                onClick={resetDemoData}
                className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5"
                title="Reset local demo data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Home City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Bio
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Passport</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Event Timeline Split */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Upcoming Events (Going)
          </h2>
          {goingEvents.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No upcoming RSVPs yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {goingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                      {ev.startDate} · {ev.city}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {ev.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEventHub(ev.id, 'lobby')}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                  >
                    Open Lobby
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Past Events (Verified Attended)
          </h2>
          {attendedEvents.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mark an event as Attended to unlock recap publishing.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono-tabular">
                      Verified Attended · {ev.startDate} · {ev.city}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {ev.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openRecapComposer(ev.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shrink-0 inline-flex items-center gap-1.5"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    <span>Write Recap</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Showcase Wall */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Post-Event Showcase Wall
          </h2>
          <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
            {myRecaps.length} published {myRecaps.length === 1 ? 'recap' : 'recaps'}
          </span>
        </div>

        {myRecaps.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              Your Showcase Wall is ready for your first event recap.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Publish a recap on any Attended event and it will appear here permanently.
            </p>
            {attendedEvents[0] && (
              <button
                type="button"
                onClick={() => openRecapComposer(attendedEvents[0].id)}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Write Recap for {attendedEvents[0].title}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myRecaps.map((recap) => {
              const ev = events.find((e) => e.id === recap.eventId);
              return (
                <article
                  key={recap.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col"
                >
                  {recap.photos[0] && (
                    <div className="h-44 overflow-hidden">
                      <SafeImage
                        src={recap.photos[0]}
                        alt={ev?.title ?? 'Event recap'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono-tabular flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {recap.createdAt}
                        </span>
                        {ev && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.city}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {ev?.title ?? 'Event Recap'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {recap.processReview}
                      </p>
                      <ul className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {recap.keyLearnings.map((l, idx) => (
                          <li key={idx}>• {l}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      {ev && (
                        <button
                          type="button"
                          onClick={() => openEventHub(ev.id, 'recaps')}
                          className="text-xs font-medium text-slate-700 dark:text-slate-200 hover:underline"
                        >
                          View in Event Hub
                        </button>
                      )}
                      {recap.projectLink && (
                        <a
                          href={recap.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Project Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
