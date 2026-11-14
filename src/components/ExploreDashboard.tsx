import React, { useEffect, useRef } from 'react';
import {
  Search,
  Globe2,
  MapPin,
  Check,
  ArrowUpRight,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';
import { DateFilter, EventCategory } from '@/src/types';
import { SafeImage } from '@/src/components/SafeImage';
import { InteractiveGlobe } from '@/src/components/InteractiveGlobe';
import { GoogleStreetMap } from '@/src/components/GoogleStreetMap';

interface ExploreDashboardProps {
  googleMapsApiKey: string;
}

const CATEGORIES: Array<'All' | EventCategory> = [
  'All',
  'Hackathon',
  'Conference',
  'Meetup',
  'Workshop',
];

const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: 'all', label: 'All Dates' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past / Recaps' },
];

export const ExploreDashboard: React.FC<ExploreDashboardProps> = ({
  googleMapsApiKey,
}) => {
  const {
    filteredEvents,
    selectedEventId,
    setSelectedEventId,
    spatialMode,
    setSpatialMode,
    openEventHub,
    toggleGoing,
    user,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    cityFilter,
    setCityFilter,
    availableCities,
    getEventAttendeeCount,
    darkMode,
    setDarkMode,
  } = useEventSphere();

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll highlighted card into view smoothly when selected via globe/map
  useEffect(() => {
    const el = cardRefs.current[selectedEventId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEventId]);

  const handleZoomToStreetMap = (eventId: string) => {
    setSelectedEventId(eventId);
    setSpatialMode('map');
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== 'All' ||
    dateFilter !== 'all' ||
    cityFilter !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setDateFilter('all');
    setCityFilter('All');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-61px)] min-h-[600px]">
      {/* Workspace Filter & Spatial Switcher Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search & Category Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, cities, tags..."
                aria-label="Search events"
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:bg-white dark:focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              {DATE_FILTERS.map((df) => (
                <button
                  key={df.value}
                  type="button"
                  onClick={() => setDateFilter(df.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    dateFilter === df.value
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {df.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter by city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Spatial Mode Switcher & Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setSpatialMode('globe')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  spatialMode === 'globe'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
              <button
                type="button"
                onClick={() => setSpatialMode('map')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  spatialMode === 'map'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Street Map</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Dashboard */}
      <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12">
        {/* Left Feed Pane */}
        <aside className="lg:col-span-5 xl:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 overflow-y-auto es-scroll p-4 space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-tabular">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No events match your current filters
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Try clearing a city or category filter, or discover new events via Gemini search.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              const isGoing = user.goingEventIds.includes(ev.id);
              const isAttended = user.attendedEventIds.includes(ev.id);
              const count = getEventAttendeeCount(ev.id);

              return (
                <div
                  key={ev.id}
                  ref={(el) => {
                    cardRefs.current[ev.id] = el;
                  }}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`group cursor-pointer rounded-xl border transition-all p-3.5 ${
                    isSelected
                      ? 'border-blue-600 bg-white dark:bg-slate-900 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-3.5">
                    <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                      <SafeImage
                        src={ev.coverImage}
                        alt={ev.title}
                        className="w-full h-full object-cover"
                        fallbackLabel={ev.city}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {ev.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{ev.startDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.city}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug line-clamp-2">
                        {ev.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        {ev.venueName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                      {count} builders{isAttended ? ' · Attended' : isGoing ? ' · Going' : ''}
                    </span>

                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => toggleGoing(ev.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1 ${
                          isGoing
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isGoing && <Check className="w-3 h-3" />}
                        <span>{isGoing ? 'Going' : 'RSVP'}</span>
                      </button>

                      {isSelected && spatialMode === 'globe' && (
                        <button
                          type="button"
                          onClick={() => handleZoomToStreetMap(ev.id)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                        >
                          Street Map
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEventHub(ev.id, 'overview')}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 whitespace-nowrap flex items-center gap-1"
                      >
                        <span>Hub</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Right Spatial Viewport (3D Globe or Google Street Map) */}
        <section className="lg:col-span-7 xl:col-span-8 relative min-h-[380px] lg:min-h-0 h-full order-1 lg:order-2">
          {spatialMode === 'globe' ? (
            <InteractiveGlobe
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onZoomToStreetMap={handleZoomToStreetMap}
              onOpenHub={(id) => openEventHub(id, 'overview')}
              getAttendeeCount={getEventAttendeeCount}
              darkMode={darkMode}
            />
          ) : (
            <GoogleStreetMap
              apiKey={googleMapsApiKey}
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              onOpenHub={(id) => openEventHub(id, 'overview')}
              getAttendeeCount={getEventAttendeeCount}
            />
          )}
        </section>
      </div>
    </div>
  );
};
