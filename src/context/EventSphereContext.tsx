import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppView,
  AttendeePersona,
  ChatMessage,
  DateFilter,
  EventCategory,
  EventItem,
  RecapItem,
  SpatialMode,
  ToastItem,
  UserProfile,
} from '@/src/types';
import {
  INITIAL_USER_PROFILE,
  SEED_ATTENDEES,
  SEED_CHATS,
  SEED_EVENTS,
  SEED_RECAPS,
} from '@/src/data/seedData';
import { pickCoverImageForCity } from '@/src/data/eventImages';

const STORAGE_KEY = 'eventsphere_state_v1';
const TODAY_ISO = '2026-11-13';

interface PersistedState {
  user: UserProfile;
  events: EventItem[];
  attendees: AttendeePersona[];
  recaps: RecapItem[];
  chats: Record<string, ChatMessage[]>;
  darkMode: boolean;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.user && Array.isArray(parsed.events) && parsed.events.length > 0) {
        return {
          user: parsed.user,
          events: parsed.events,
          attendees: Array.isArray(parsed.attendees) ? parsed.attendees : SEED_ATTENDEES,
          recaps: Array.isArray(parsed.recaps) ? parsed.recaps : SEED_RECAPS,
          chats: parsed.chats ?? SEED_CHATS,
          darkMode: Boolean(parsed.darkMode),
        };
      }
    }
  } catch {
    // Ignore corrupt localStorage and fall back to seed
  }
  return {
    user: INITIAL_USER_PROFILE,
    events: SEED_EVENTS,
    attendees: SEED_ATTENDEES,
    recaps: SEED_RECAPS,
    chats: SEED_CHATS,
    darkMode: false,
  };
}

export type HubTab = 'overview' | 'lobby' | 'recaps';

interface EventSphereContextValue {
  user: UserProfile;
  events: EventItem[];
  filteredEvents: EventItem[];
  attendees: AttendeePersona[];
  recaps: RecapItem[];
  chats: Record<string, ChatMessage[]>;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;

  // Navigation & spatial state
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  spatialMode: SpatialMode;
  setSpatialMode: (mode: SpatialMode) => void;
  selectedEventId: string;
  setSelectedEventId: (id: string) => void;
  hubEventId: string | null;
  hubTab: HubTab;
  openEventHub: (eventId: string, tab?: HubTab) => void;
  closeEventHub: () => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: 'All' | EventCategory;
  setCategoryFilter: (cat: 'All' | EventCategory) => void;
  dateFilter: DateFilter;
  setDateFilter: (df: DateFilter) => void;
  cityFilter: string;
  setCityFilter: (city: string) => void;
  availableCities: string[];

  // Modals & Drawers
  isDiscoverModalOpen: boolean;
  setIsDiscoverModalOpen: (open: boolean) => void;
  recapComposerEventId: string | null;
  openRecapComposer: (eventId: string) => void;
  closeRecapComposer: () => void;
  drawerAttendeeId: string | null;
  drawerContextEventId: string | null;
  openConnectDrawer: (attendeeId: string, eventId?: string) => void;
  closeConnectDrawer: () => void;

  // Mutations
  toggleGoing: (eventId: string, statusNote?: string) => void;
  toggleAttended: (eventId: string) => void;
  updateStatusNote: (eventId: string, note: string) => void;
  addEvent: (eventInput: Omit<EventItem, 'id' | 'coverImage'> & { coverImage?: string }) => EventItem;
  updateProfile: (partial: Partial<UserProfile>) => void;
  sendConnectionRequest: (attendeeId: string, introText: string, eventId?: string) => void;
  acceptSimulatedReply: (attendeeId: string, eventId?: string) => void;
  sendChatMessage: (attendeeId: string, text: string, eventContextTitle?: string) => void;
  addRecap: (input: {
    eventId: string;
    processReview: string;
    keyLearnings: string[];
    projectLink?: string;
    photos: string[];
  }) => void;
  toggleRecapLike: (recapId: string) => void;
  addRecapComment: (recapId: string, text: string) => void;
  getEventAttendeeCount: (eventId: string) => number;
  resetDemoData: () => void;

  // Toasts
  toasts: ToastItem[];
  pushToast: (title: string, detail?: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;
}

const EventSphereContext = createContext<EventSphereContextValue | null>(null);

export const EventSphereProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initial = useMemo(() => loadInitialState(), []);

  const [user, setUser] = useState<UserProfile>(initial.user);
  const [events, setEvents] = useState<EventItem[]>(initial.events);
  const [attendees, setAttendees] = useState<AttendeePersona[]>(initial.attendees);
  const [recaps, setRecaps] = useState<RecapItem[]>(initial.recaps);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(initial.chats);
  const [darkMode, setDarkMode] = useState<boolean>(initial.darkMode);

  const [activeView, setActiveView] = useState<AppView>('explore');
  const [spatialMode, setSpatialMode] = useState<SpatialMode>('globe');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initial.events[0]?.id ?? ''
  );
  const [hubEventId, setHubEventId] = useState<string | null>(null);
  const [hubTab, setHubTab] = useState<HubTab>('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | EventCategory>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [cityFilter, setCityFilter] = useState<string>('All');

  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [recapComposerEventId, setRecapComposerEventId] = useState<string | null>(null);
  const [drawerAttendeeId, setDrawerAttendeeId] = useState<string | null>(null);
  const [drawerContextEventId, setDrawerContextEventId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        user,
        events,
        attendees,
        recaps,
        chats,
        darkMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota exceeded
    }
  }, [user, events, attendees, recaps, chats, darkMode]);

  const pushToast = useCallback(
    (title: string, detail?: string, tone: ToastItem['tone'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, detail, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const availableCities = useMemo(() => {
    const seen: Record<string, true> = {};
    const list: string[] = [];
    for (const ev of events) {
      if (!seen[ev.city]) {
        seen[ev.city] = true;
        list.push(ev.city);
      }
    }
    return list;
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (categoryFilter !== 'All' && ev.category !== categoryFilter) {
        return false;
      }
      if (cityFilter !== 'All' && ev.city !== cityFilter) {
        return false;
      }
      if (dateFilter === 'upcoming' && ev.endDate < TODAY_ISO) {
        return false;
      }
      if (dateFilter === 'past' && ev.endDate >= TODAY_ISO) {
        return false;
      }
      if (q) {
        const haystack = [
          ev.title,
          ev.city,
          ev.country,
          ev.venueName,
          ev.category,
          ev.description,
          ...ev.tags,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [events, categoryFilter, cityFilter, dateFilter, searchQuery]);

  const openEventHub = useCallback((eventId: string, tab: HubTab = 'overview') => {
    setSelectedEventId(eventId);
    setHubEventId(eventId);
    setHubTab(tab);
  }, []);

  const closeEventHub = useCallback(() => {
    setHubEventId(null);
  }, []);

  const openRecapComposer = useCallback((eventId: string) => {
    setRecapComposerEventId(eventId);
  }, []);

  const closeRecapComposer = useCallback(() => {
    setRecapComposerEventId(null);
  }, []);

  const openConnectDrawer = useCallback((attendeeId: string, eventId?: string) => {
    setDrawerAttendeeId(attendeeId);
    setDrawerContextEventId(eventId ?? null);
  }, []);

  const closeConnectDrawer = useCallback(() => {
    setDrawerAttendeeId(null);
    setDrawerContextEventId(null);
  }, []);

  const toggleGoing = useCallback(
    (eventId: string, statusNote?: string) => {
      const ev = events.find((e) => e.id === eventId);
      setUser((prev) => {
        const isAlreadyGoing = prev.goingEventIds.includes(eventId);
        const nextGoing = isAlreadyGoing
          ? prev.goingEventIds.filter((id) => id !== eventId)
          : [...prev.goingEventIds, eventId];
        const nextNotes = { ...prev.statusNotes };
        if (!isAlreadyGoing && statusNote !== undefined) {
          nextNotes[eventId] = statusNote;
        } else if (!isAlreadyGoing && !nextNotes[eventId]) {
          nextNotes[eventId] = 'Planning to attend — open to connect and team up!';
        }
        return {
          ...prev,
          goingEventIds: nextGoing,
          statusNotes: nextNotes,
        };
      });
      if (ev) {
        const wasGoing = user.goingEventIds.includes(eventId);
        pushToast(
          wasGoing ? 'Removed from Going' : 'Added to Attendee Lobby',
          ev.title,
          wasGoing ? 'info' : 'success'
        );
      }
    },
    [events, user.goingEventIds, pushToast]
  );

  const toggleAttended = useCallback(
    (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      const wasAttended = user.attendedEventIds.includes(eventId);
      setUser((prev) => {
        const nextAttended = wasAttended
          ? prev.attendedEventIds.filter((id) => id !== eventId)
          : [...prev.attendedEventIds, eventId];
        return {
          ...prev,
          attendedEventIds: nextAttended,
        };
      });
      if (ev) {
        pushToast(
          wasAttended ? 'Removed Attended Badge' : 'Marked as Attended — Recap Unlocked',
          ev.title,
          wasAttended ? 'info' : 'success'
        );
      }
    },
    [events, user.attendedEventIds, pushToast]
  );

  const updateStatusNote = useCallback((eventId: string, note: string) => {
    setUser((prev) => ({
      ...prev,
      statusNotes: {
        ...prev.statusNotes,
        [eventId]: note,
      },
    }));
  }, []);

  const addEvent = useCallback(
    (
      eventInput: Omit<EventItem, 'id' | 'coverImage'> & { coverImage?: string }
    ): EventItem => {
      const newEvent: EventItem = {
        ...eventInput,
        id: `evt-${Date.now()}`,
        coverImage: eventInput.coverImage || pickCoverImageForCity(eventInput.city),
      };
      setEvents((prev) => [newEvent, ...prev]);
      setSelectedEventId(newEvent.id);
      pushToast('Event Added to Globe', `${newEvent.title} · ${newEvent.city}`, 'success');
      return newEvent;
    },
    [pushToast]
  );

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      setUser((prev) => ({ ...prev, ...partial }));
      pushToast('Builder Passport Updated', undefined, 'success');
    },
    [pushToast]
  );

  const acceptSimulatedReply = useCallback(
    (attendeeId: string, eventId?: string) => {
      const target = attendees.find((a) => a.id === attendeeId);
      const ev = events.find((e) => e.id === eventId);
      if (!target) return;

      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? {
                ...a,
                connectionStatus: 'connected',
                connectedViaEventId: eventId ?? a.connectedViaEventId,
              }
            : a
        )
      );

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const replyText = ev
        ? `Accepted! Awesome connecting via ${ev.title}. Let's definitely meet up around ${ev.venueName} or compare notes beforehand.`
        : `Hey ${user.name.split(' ')[0]}! Thanks for reaching out — glad to be connected on EventSphere.`;

      setChats((prev) => ({
        ...prev,
        [attendeeId]: [
          ...(prev[attendeeId] ?? []),
          {
            id: `msg-${Date.now()}-reply`,
            sender: 'them',
            text: replyText,
            timestamp: nowStr,
            eventContextTitle: ev?.title,
          },
        ],
      }));

      pushToast('Connection Accepted', `${target.name} is now in your network`, 'success');
    },
    [attendees, events, user.name, pushToast]
  );

  const sendConnectionRequest = useCallback(
    (attendeeId: string, introText: string, eventId?: string) => {
      const target = attendees.find((a) => a.id === attendeeId);
      const ev = events.find((e) => e.id === eventId);
      if (!target) return;

      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? {
                ...a,
                connectionStatus: 'pending',
                connectedViaEventId: eventId ?? a.connectedViaEventId,
              }
            : a
        )
      );

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setChats((prev) => ({
        ...prev,
        [attendeeId]: [
          ...(prev[attendeeId] ?? []),
          {
            id: `msg-${Date.now()}`,
            sender: 'me',
            text: introText,
            timestamp: nowStr,
            eventContextTitle: ev?.title,
          },
        ],
      }));

      pushToast('Connection Request Sent', `Invite delivered to ${target.name}`, 'success');

      setTimeout(() => {
        setAttendees((current) => {
          const stillPending = current.find(
            (a) => a.id === attendeeId && a.connectionStatus === 'pending'
          );
          if (!stillPending) return current;
          return current.map((a) =>
            a.id === attendeeId ? { ...a, connectionStatus: 'connected' } : a
          );
        });
        setChats((prev) => {
          const existing = prev[attendeeId] ?? [];
          const alreadyReplied = existing.some(
            (m) => m.sender === 'them' && m.text.includes('Accepted!')
          );
          if (alreadyReplied) return prev;
          return {
            ...prev,
            [attendeeId]: [
              ...existing,
              {
                id: `msg-${Date.now()}-auto`,
                sender: 'them',
                text: ev
                  ? `Accepted! Great to meet someone else heading to ${ev.title}. What track or sessions are you most excited about?`
                  : `Accepted! Happy to connect — what are you building right now?`,
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                eventContextTitle: ev?.title,
              },
            ],
          };
        });
      }, 1500);
    },
    [attendees, events, pushToast]
  );

  const sendChatMessage = useCallback(
    (attendeeId: string, text: string, eventContextTitle?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const target = attendees.find((a) => a.id === attendeeId);
      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setChats((prev) => ({
        ...prev,
        [attendeeId]: [
          ...(prev[attendeeId] ?? []),
          {
            id: `msg-${Date.now()}`,
            sender: 'me',
            text: trimmed,
            timestamp: nowStr,
            eventContextTitle,
          },
        ],
      }));

      setTimeout(() => {
        const replyPool = [
          `Sounds great! I'll check my schedule around ${target?.city ?? 'the venue'} and ping you on the exact spot.`,
          `Love that approach — let's sync near the main coffee bar 20 minutes before the session starts.`,
          `Definitely down! Bring your prototype or repo link so we can jam on it together.`,
        ];
        const reply =
          replyPool[Math.floor(Math.random() * replyPool.length)] ?? replyPool[0];
        setChats((prev) => ({
          ...prev,
          [attendeeId]: [
            ...(prev[attendeeId] ?? []),
            {
              id: `msg-${Date.now()}-r`,
              sender: 'them',
              text: reply,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              eventContextTitle,
            },
          ],
        }));
      }, 850);
    },
    [attendees]
  );

  const addRecap = useCallback(
    (input: {
      eventId: string;
      processReview: string;
      keyLearnings: string[];
      projectLink?: string;
      photos: string[];
    }) => {
      const ev = events.find((e) => e.id === input.eventId);
      const newRecap: RecapItem = {
        id: `recap-${Date.now()}`,
        eventId: input.eventId,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        authorOrg: user.org,
        createdAt: TODAY_ISO,
        processReview: input.processReview,
        keyLearnings: input.keyLearnings,
        projectLink: input.projectLink || undefined,
        photos:
          input.photos.length > 0
            ? input.photos
            : [ev?.coverImage || pickCoverImageForCity(ev?.city || 'San Francisco')],
        likes: 1,
        likedByMe: true,
        comments: [],
      };
      setRecaps((prev) => [newRecap, ...prev]);
      setUser((prev) => ({
        ...prev,
        attendedEventIds: prev.attendedEventIds.includes(input.eventId)
          ? prev.attendedEventIds
          : [...prev.attendedEventIds, input.eventId],
      }));
      pushToast('Recap Published', ev ? `Added to ${ev.title}` : undefined, 'success');
    },
    [events, user.id, user.name, user.role, user.org, pushToast]
  );

  const toggleRecapLike = useCallback((recapId: string) => {
    setRecaps((prev) =>
      prev.map((r) => {
        if (r.id !== recapId) return r;
        const liked = !r.likedByMe;
        return {
          ...r,
          likedByMe: liked,
          likes: Math.max(0, r.likes + (liked ? 1 : -1)),
        };
      })
    );
  }, []);

  const addRecapComment = useCallback(
    (recapId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setRecaps((prev) =>
        prev.map((r) =>
          r.id === recapId
            ? {
                ...r,
                comments: [
                  ...r.comments,
                  {
                    id: `cmt-${Date.now()}`,
                    authorName: user.name,
                    authorRole: user.role,
                    text: trimmed,
                    createdAt: TODAY_ISO,
                  },
                ],
              }
            : r
        )
      );
    },
    [user.name, user.role]
  );

  const getEventAttendeeCount = useCallback(
    (eventId: string) => {
      const linkedCount = attendees.filter((a) =>
        a.eventLinks.some((l) => l.eventId === eventId)
      ).length;
      const meIncluded =
        user.goingEventIds.includes(eventId) || user.attendedEventIds.includes(eventId)
          ? 1
          : 0;
      return linkedCount + meIncluded;
    },
    [attendees, user.goingEventIds, user.attendedEventIds]
  );

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(INITIAL_USER_PROFILE);
    setEvents(SEED_EVENTS);
    setAttendees(SEED_ATTENDEES);
    setRecaps(SEED_RECAPS);
    setChats(SEED_CHATS);
    setSelectedEventId(SEED_EVENTS[0].id);
    pushToast('Workspace Reset', 'Restored default global events & network', 'info');
  }, [pushToast]);

  const value: EventSphereContextValue = {
    user,
    events,
    filteredEvents,
    attendees,
    recaps,
    chats,
    darkMode,
    setDarkMode,
    activeView,
    setActiveView,
    spatialMode,
    setSpatialMode,
    selectedEventId,
    setSelectedEventId,
    hubEventId,
    hubTab,
    openEventHub,
    closeEventHub,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    cityFilter,
    setCityFilter,
    availableCities,
    isDiscoverModalOpen,
    setIsDiscoverModalOpen,
    recapComposerEventId,
    openRecapComposer,
    closeRecapComposer,
    drawerAttendeeId,
    drawerContextEventId,
    openConnectDrawer,
    closeConnectDrawer,
    toggleGoing,
    toggleAttended,
    updateStatusNote,
    addEvent,
    updateProfile,
    sendConnectionRequest,
    acceptSimulatedReply,
    sendChatMessage,
    addRecap,
    toggleRecapLike,
    addRecapComment,
    getEventAttendeeCount,
    resetDemoData,
    toasts,
    pushToast,
    dismissToast,
  };

  return (
    <EventSphereContext.Provider value={value}>
      {children}
    </EventSphereContext.Provider>
  );
};

export function useEventSphere() {
  const ctx = useContext(EventSphereContext);
  if (!ctx) {
    throw new Error('useEventSphere must be used within EventSphereProvider');
  }
  return ctx;
}
