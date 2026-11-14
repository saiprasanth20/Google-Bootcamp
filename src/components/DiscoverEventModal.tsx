import React, { useState } from 'react';
import {
  Globe2,
  Search,
  Plus,
  ExternalLink,
  MapPin,
  Calendar,
  Loader2,
  X,
  Check,
} from 'lucide-react';
import { DiscoveredEvent, EventCategory, GroundingSource } from '@/src/types';
import { useEventSphere } from '@/src/context/EventSphereContext';

const CITY_PRESETS: Record<string, { country: string; lat: number; lng: number }> = {
  Bengaluru: { country: 'India', lat: 12.9716, lng: 77.5946 },
  'San Francisco': { country: 'USA', lat: 37.7749, lng: -122.4194 },
  London: { country: 'UK', lat: 51.5074, lng: -0.1278 },
  Tokyo: { country: 'Japan', lat: 35.6762, lng: 139.6503 },
  'New York': { country: 'USA', lat: 40.7128, lng: -74.006 },
};

const SUGGESTED_QUERIES = [
  'Upcoming AI hackathons in Bengaluru',
  'React Conf 2026',
  'Open source developer conferences in London 2026',
  'Tokyo robotics and AI meetup 2026',
];

export const DiscoverEventModal: React.FC = () => {
  const { isDiscoverModalOpen, setIsDiscoverModalOpen, addEvent, setSpatialMode } =
    useEventSphere();

  const [mode, setMode] = useState<'discover' | 'manual'>('discover');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoveredEvent[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Manual form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [startDate, setStartDate] = useState('2026-12-12');
  const [endDate, setEndDate] = useState('2026-12-13');
  const [city, setCity] = useState('Bengaluru');
  const [country, setCountry] = useState('India');
  const [venueName, setVenueName] = useState('');
  const [lat, setLat] = useState('12.9716');
  const [lng, setLng] = useState('77.5946');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('AI, Full-Stack, Community');

  if (!isDiscoverModalOpen) return null;

  const handleSearch = async (searchText?: string) => {
    const q = (searchText ?? query).trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/events/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to discover events.');
      }
      setResults(Array.isArray(data.events) ? data.events : []);
      setSources(Array.isArray(data.sources) ? data.sources : []);
      if (!data.events || data.events.length === 0) {
        setError('No structured events matched that query. Try a broader city or conference name.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reach discovery service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscovered = (ev: DiscoveredEvent) => {
    addEvent({
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate,
      venueName: ev.venueName,
      city: ev.city,
      country: ev.country,
      lat: ev.lat,
      lng: ev.lng,
      description: ev.description,
      sourceUrl: ev.sourceUrl,
      tags: ev.tags,
    });
    setAddedIds((prev) => ({ ...prev, [ev.tempId]: true }));
    setSpatialMode('globe');
  };

  const handleCityPreset = (selectedCity: string) => {
    setCity(selectedCity);
    const preset = CITY_PRESETS[selectedCity];
    if (preset) {
      setCountry(preset.country);
      setLat(String(preset.lat));
      setLng(String(preset.lng));
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venueName.trim()) return;
    addEvent({
      title: title.trim(),
      category,
      startDate,
      endDate: endDate || startDate,
      venueName: venueName.trim(),
      city: city.trim() || 'San Francisco',
      country: country.trim() || 'USA',
      lat: Number(lat) || 37.7749,
      lng: Number(lng) || -122.4194,
      description:
        description.trim() ||
        'Community tech gathering listed on EventSphere.',
      sourceUrl: sourceUrl.trim() || 'https://eventsphere.community',
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setTitle('');
    setVenueName('');
    setDescription('');
    setIsDiscoverModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Discover or Submit Real Events"
    >
      <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Add Event to Globe
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search live web events via Google Search Grounding or submit details manually
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDiscoverModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Switch */}
        <div className="px-6 pt-4">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode('discover')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'discover'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Discover Real Events
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto es-scroll p-6">
          {mode === 'discover' ? (
            <div className="space-y-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSearch();
                }}
                className="flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Upcoming AI hackathons in Bengaluru or React Conf 2026"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching Web...</span>
                    </>
                  ) : (
                    <>
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Find Verified Events</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                  Try:
                </span>
                {SUGGESTED_QUERIES.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => void handleSearch(sq)}
                    className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {sq}
                  </button>
                ))}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-3">
                  {[1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse space-y-2"
                    >
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800/70 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="space-y-3">
                  {results.map((ev) => {
                    const isAdded = Boolean(addedIds[ev.tempId]);
                    return (
                      <div
                        key={ev.tempId}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {ev.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {ev.startDate}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.city}, {ev.country}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                            {ev.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {ev.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{ev.venueName}</span>
                            <span className="font-mono-tabular">
                              ({ev.lat.toFixed(2)}, {ev.lng.toFixed(2)})
                            </span>
                            {ev.sourceUrl && (
                              <a
                                href={ev.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span>Official link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddDiscovered(ev)}
                          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                            isAdded
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Globe</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Globe</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {sources.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Grounded Web Sources
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {sources.slice(0, 5).map((src, i) => (
                      <a
                        key={`${src.uri}-${i}`}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 truncate max-w-[260px]"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Bengaluru Open Hardware Sprint"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Conference">Conference</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City (or Quick Preset)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                    <select
                      aria-label="City coordinate preset"
                      value=""
                      onChange={(e) => handleCityPreset(e.target.value)}
                      className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Preset...</option>
                      {Object.keys(CITY_PRESETS).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g., Indiranagar Social Hub"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share tracks, target builders, and what attendees should expect..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Official Event URL
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiscoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Publish to Globe
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
