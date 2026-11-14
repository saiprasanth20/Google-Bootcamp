import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { Coffee, Compass, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { EventItem } from '@/src/types';

interface NearbySpot {
  id: string;
  name: string;
  address: string;
  rating?: number;
  lat: number;
  lng: number;
}

interface GoogleStreetMapProps {
  apiKey: string;
  events: EventItem[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  onOpenHub: (eventId: string) => void;
  getAttendeeCount: (eventId: string) => number;
  compact?: boolean;
}

const EventAdvancedMarker: React.FC<{
  event: EventItem;
  isSelected: boolean;
  attendeeCount: number;
  onSelect: () => void;
  onOpenHub: () => void;
}> = ({ event, isSelected, attendeeCount, onSelect, onOpenHub }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setInfoOpen(true);
    } else {
      setInfoOpen(false);
    }
  }, [isSelected]);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: event.lat, lng: event.lng }}
        title={event.title}
        zIndex={isSelected ? 50 : 10}
        onClick={() => {
          onSelect();
          setInfoOpen(true);
        }}
      >
        <Pin
          background={isSelected ? '#2563EB' : '#0F172A'}
          borderColor={isSelected ? '#1D4ED8' : '#334155'}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.25 : 1}
        />
      </AdvancedMarker>
      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={270}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-slate-900">
            <div className="text-[11px] font-medium text-slate-500">
              {event.category} · {event.startDate}
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
              {event.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1">{event.venueName}</p>
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {attendeeCount} builders
              </span>
              <button
                type="button"
                onClick={onOpenHub}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Open Hub →
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const NearbySpotMarker: React.FC<{ spot: NearbySpot }> = ({ spot }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: spot.lat, lng: spot.lng }}
        title={spot.name}
        zIndex={25}
        onClick={() => setOpen(true)}
      >
        <Pin
          background="#D97706"
          borderColor="#B45309"
          glyphColor="#FFFFFF"
          scale={0.9}
        />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={220}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-1 text-slate-900">
            <div className="text-[11px] font-medium text-amber-700">
              Nearby Meetup Spot
            </div>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">
              {spot.name}
            </p>
            {spot.address && (
              <p className="text-[11px] text-slate-600 mt-0.5">{spot.address}</p>
            )}
            {spot.rating !== undefined && (
              <p className="text-[11px] text-slate-500 mt-1">
                Rating: {spot.rating.toFixed(1)} / 5
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapInner: React.FC<{
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (id: string) => void;
  onOpenHub: (id: string) => void;
  getAttendeeCount: (id: string) => number;
  compact?: boolean;
}> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenHub,
  getAttendeeCount,
  compact = false,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const loadingStatus = useApiLoadingStatus();

  const [showNearbySpots, setShowNearbySpots] = useState(false);
  const [nearbySpots, setNearbySpots] = useState<NearbySpot[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  // Pan & zoom cleanly when selected event changes
  useEffect(() => {
    if (!map || !selectedEvent) return;
    map.panTo({ lat: selectedEvent.lat, lng: selectedEvent.lng });
    map.setZoom(compact ? 14 : 13);
  }, [map, selectedEvent?.id, selectedEvent?.lat, selectedEvent?.lng, compact]);

  // Fetch nearby meetup spots via modern Places API (New) when toggled ON
  const fetchNearbyMeetupSpots = useCallback(async () => {
    if (!placesLib || !selectedEvent) return;
    setNearbyLoading(true);
    setNearbyError(null);

    try {
      const request = {
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating'],
        locationRestriction: {
          center: { lat: selectedEvent.lat, lng: selectedEvent.lng },
          radius: 1500,
        },
        includedPrimaryTypes: ['cafe', 'coffee_shop'],
        maxResultCount: 6,
      };
      const { places } = (await placesLib.Place.searchNearby(request)) as {
        places?: Array<{
          id?: string;
          displayName?: string | null;
          formattedAddress?: string | null;
          rating?: number | null;
          location?: {
            lat: number | (() => number);
            lng: number | (() => number);
          } | null;
        }>;
      };
      const mapped: NearbySpot[] = (places ?? [])
        .map((p): NearbySpot | null => {
          const loc = p.location;
          if (!loc) return null;
          const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
          const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return {
            id: p.id || `${lat}-${lng}`,
            name: p.displayName || 'Coffee & Meetup Spot',
            address: p.formattedAddress || '',
            rating: p.rating ?? undefined,
            lat,
            lng,
          };
        })
        .filter((x: NearbySpot | null): x is NearbySpot => x !== null);

      setNearbySpots(mapped);
      if (mapped.length === 0) {
        setNearbyError('No nearby cafes found within 1.5 km.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('OVER_QUERY_LIMIT') ||
        msg.includes('429')
      ) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setNearbyError('Nearby Places search unavailable for this venue right now.');
      setNearbySpots([]);
    } finally {
      setNearbyLoading(false);
    }
  }, [placesLib, selectedEvent]);

  useEffect(() => {
    if (showNearbySpots && selectedEvent) {
      void fetchNearbyMeetupSpots();
    } else {
      setNearbySpots([]);
      setNearbyError(null);
    }
  }, [showNearbySpots, selectedEvent?.id, fetchNearbyMeetupSpots]);

  if (
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <FallbackStreetMap
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={onSelectEvent}
        onOpenHub={onOpenHub}
        getAttendeeCount={getAttendeeCount}
      />
    );
  }

  const defaultCenter = selectedEvent
    ? { lat: selectedEvent.lat, lng: selectedEvent.lng }
    : { lat: 37.7749, lng: -122.4194 };

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <GoogleMap
        defaultCenter={defaultCenter}
        defaultZoom={compact ? 14 : 13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={compact}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {events.map((ev) => (
          <EventAdvancedMarker
            key={ev.id}
            event={ev}
            isSelected={ev.id === selectedEvent?.id}
            attendeeCount={getAttendeeCount(ev.id)}
            onSelect={() => onSelectEvent(ev.id)}
            onOpenHub={() => onOpenHub(ev.id)}
          />
        ))}
        {showNearbySpots &&
          nearbySpots.map((spot) => <NearbySpotMarker key={spot.id} spot={spot} />)}
      </GoogleMap>

      {/* Nearby Meetup Spots Toggle Control */}
      {!compact && selectedEvent && (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-xs">
          <button
            type="button"
            onClick={() => setShowNearbySpots((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium shadow-sm transition-colors whitespace-nowrap ${
              showNearbySpots
                ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span>
              {nearbyLoading
                ? 'Searching Nearby Cafes...'
                : showNearbySpots
                  ? 'Hide Nearby Meetup Spots'
                  : 'Nearby Meetup Spots'}
            </span>
          </button>

          {showNearbySpots && (nearbySpots.length > 0 || nearbyError) && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-3 shadow-lg max-h-56 overflow-y-auto es-scroll">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Cafes & Hubs near {selectedEvent.venueName}
              </p>
              {nearbyError ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {nearbyError}
                </p>
              ) : (
                <ul className="space-y-2">
                  {nearbySpots.map((spot) => (
                    <li
                      key={spot.id}
                      className="text-xs border-b border-slate-100 dark:border-slate-800 last:border-b-0 pb-1.5 last:pb-0"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2">
                        <span className="truncate">{spot.name}</span>
                        {spot.rating !== undefined && (
                          <span className="font-mono-tabular text-[11px] text-amber-600 shrink-0">
                            {spot.rating.toFixed(1)}★
                          </span>
                        )}
                      </div>
                      {spot.address && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {spot.address}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FallbackStreetMap: React.FC<{
  events: EventItem[];
  selectedEvent: EventItem | null;
  onSelectEvent: (id: string) => void;
  onOpenHub: (id: string) => void;
  getAttendeeCount: (id: string) => number;
}> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenHub,
  getAttendeeCount,
}) => {
  const [showFallbackSpots, setShowFallbackSpots] = useState(false);

  const citySpots = useMemo(() => {
    if (!selectedEvent) return [];
    return [
      {
        id: 'spot-1',
        name: `${selectedEvent.city} Roastery & Workspace`,
        dist: '280 m walk',
      },
      {
        id: 'spot-2',
        name: `Atrium Espresso Bar`,
        dist: '450 m walk',
      },
      {
        id: 'spot-3',
        name: `Founders Commons Coworking`,
        dist: '620 m walk',
      },
    ];
  }, [selectedEvent]);

  return (
    <div className="relative w-full h-full min-h-[340px] bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col justify-between p-5">
      {/* Subtle architectural street grid SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="street-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate-300 dark:text-slate-700"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#street-grid)" />
      </svg>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-950/90 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Venue Blueprint</span>
        </div>

        <button
          type="button"
          onClick={() => setShowFallbackSpots((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            showFallbackSpots
              ? 'bg-amber-600 text-white border-amber-700'
              : 'bg-white/95 dark:bg-slate-950/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Nearby Meetup Spots</span>
        </button>
      </div>

      {/* Plotted event pins in relative coordinate space */}
      <div className="relative z-10 flex-1 my-4 flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
          {events.slice(0, 6).map((ev) => {
            const active = ev.id === selectedEvent?.id;
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onSelectEvent(ev.id)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active
                    ? 'border-blue-600 bg-white dark:bg-slate-950 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/75 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400">
                  <span>
                    {ev.lat.toFixed(3)}, {ev.lng.toFixed(3)}
                  </span>
                  <span>{getAttendeeCount(ev.id)} going</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {ev.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {ev.venueName} · {ev.city}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {showFallbackSpots && selectedEvent && (
        <div className="relative z-10 mb-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/40 p-3">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1.5">
            Meetup Spots Near {selectedEvent.venueName}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {citySpots.map((spot) => (
              <div
                key={spot.id}
                className="rounded-lg bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 px-2.5 py-2 text-xs"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {spot.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {spot.dist}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="relative z-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{selectedEvent.venueName}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedEvent.city}, {selectedEvent.country} ·{' '}
              <span className="font-mono-tabular">
                {selectedEvent.lat.toFixed(4)}, {selectedEvent.lng.toFixed(4)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedEvent.lat},${selectedEvent.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => onOpenHub(selectedEvent.id)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
            >
              Open Event Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const GoogleStreetMap: React.FC<GoogleStreetMapProps> = ({
  apiKey,
  events,
  selectedEventId,
  onSelectEvent,
  onOpenHub,
  getAttendeeCount,
  compact = false,
}) => {
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  );

  if (!apiKey) {
    return (
      <FallbackStreetMap
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={onSelectEvent}
        onOpenHub={onOpenHub}
        getAttendeeCount={getAttendeeCount}
      />
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language="en"
      region="US"
      libraries={['places', 'marker', 'geometry']}
    >
      <MapInner
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={onSelectEvent}
        onOpenHub={onOpenHub}
        getAttendeeCount={getAttendeeCount}
        compact={compact}
      />
    </APIProvider>
  );
};
