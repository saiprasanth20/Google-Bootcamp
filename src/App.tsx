import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  EventSphereProvider,
  useEventSphere,
} from '@/src/context/EventSphereContext';
import { ExploreDashboard } from '@/src/components/ExploreDashboard';
import { MyEventsView } from '@/src/components/MyEventsView';
import { NetworkView } from '@/src/components/NetworkView';
import { PassportView } from '@/src/components/PassportView';
import { DiscoverEventModal } from '@/src/components/DiscoverEventModal';
import { EventHubModal } from '@/src/components/EventHubModal';
import { ConnectChatDrawer } from '@/src/components/ConnectChatDrawer';
import { RecapComposerModal } from '@/src/components/RecapComposerModal';
import { ToastHost } from '@/src/components/ToastHost';
import { AppView } from '@/src/types';

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'explore', label: 'Explore' },
  { id: 'my-events', label: 'My Events' },
  { id: 'network', label: 'Network' },
  { id: 'passport', label: 'Passport' },
];

const EventSphereShell: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setSpatialMode,
    setSelectedEventId,
    setIsDiscoverModalOpen,
  } = useEventSphere();

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.googleMapsApiKey) {
          setGoogleMapsApiKey(data.googleMapsApiKey);
        }
      })
      .catch(() => {
        // Ignore network error; fallback map remains available
      });
  }, []);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const handleJumpToFullMap = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveView('explore');
    setSpatialMode('map');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-[61px] flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setActiveView('explore')}
          className="text-lg font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          EventSphere
        </button>

        {/* Zone 2: 4 single-line navigation links */}
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`py-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  active
                    ? 'border-blue-600 text-slate-900 dark:text-slate-100'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setIsDiscoverModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Event</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {activeView === 'explore' && (
          <ExploreDashboard googleMapsApiKey={googleMapsApiKey} />
        )}
        {activeView === 'my-events' && <MyEventsView />}
        {activeView === 'network' && <NetworkView />}
        {activeView === 'passport' && <PassportView />}
      </main>

      {/* Global Interactive Overlays */}
      <DiscoverEventModal />
      <EventHubModal
        googleMapsApiKey={googleMapsApiKey}
        onJumpToFullMap={handleJumpToFullMap}
      />
      <ConnectChatDrawer />
      <RecapComposerModal />
      <ToastHost />
    </div>
  );
};

export default function App() {
  return (
    <EventSphereProvider>
      <EventSphereShell />
    </EventSphereProvider>
  );
}
