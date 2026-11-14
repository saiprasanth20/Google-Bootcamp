import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';

export const ConnectChatDrawer: React.FC = () => {
  const {
    drawerAttendeeId,
    drawerContextEventId,
    closeConnectDrawer,
    attendees,
    events,
    chats,
    sendConnectionRequest,
    acceptSimulatedReply,
    sendChatMessage,
  } = useEventSphere();

  const attendee = useMemo(
    () => attendees.find((a) => a.id === drawerAttendeeId) ?? null,
    [attendees, drawerAttendeeId]
  );

  const contextEvent = useMemo(() => {
    if (drawerContextEventId) {
      return events.find((e) => e.id === drawerContextEventId) ?? null;
    }
    if (attendee?.connectedViaEventId) {
      return events.find((e) => e.id === attendee.connectedViaEventId) ?? null;
    }
    const firstLinkId = attendee?.eventLinks[0]?.eventId;
    return firstLinkId ? events.find((e) => e.id === firstLinkId) ?? null : null;
  }, [events, drawerContextEventId, attendee]);

  const [introMessage, setIntroMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!attendee) return;
    if (contextEvent) {
      setIntroMessage(
        `Hi ${attendee.name.split(' ')[0]}! Connecting via ${contextEvent.title} — saw your note about "${attendee.intentBadge}" and would love to sync around ${contextEvent.city}.`
      );
    } else {
      setIntroMessage(
        `Hi ${attendee.name.split(' ')[0]}! Saw your builder profile on EventSphere and would love to connect.`
      );
    }
    setChatInput('');
  }, [attendee?.id, contextEvent?.id]);

  const thread = attendee ? chats[attendee.id] ?? [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.length]);

  if (!attendee) return null;

  const initials = attendee.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!introMessage.trim()) return;
    sendConnectionRequest(attendee.id, introMessage.trim(), contextEvent?.id);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(attendee.id, chatInput.trim(), contextEvent?.title);
    setChatInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Connect with ${attendee.name}`}
    >
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ backgroundColor: attendee.avatarColor }}
              className="w-10 h-10 rounded-full text-white font-semibold text-sm flex items-center justify-center shrink-0"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {attendee.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {attendee.role} · {attendee.org}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConnectDrawer}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close networking drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shared Event Context Bar */}
        {contextEvent && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                Connecting via {contextEvent.title}
              </span>
              <span className="text-slate-500 dark:text-slate-400 shrink-0 font-mono-tabular">
                {contextEvent.city}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{contextEvent.venueName}</span>
            </p>
          </div>
        )}

        {/* Attendee Bio & Status */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">
              {attendee.intentBadge} · {attendee.skills.slice(0, 3).join(' / ')}
            </span>
            {attendee.connectionStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            )}
            {attendee.connectionStatus === 'pending' && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium shrink-0">
                <Clock className="w-3.5 h-3.5" />
                Invite Pending
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {attendee.bio}
          </p>
        </div>

        {/* Body: Request Form or Chat Thread */}
        <div className="flex-1 overflow-y-auto es-scroll p-5 space-y-3">
          {attendee.connectionStatus === 'none' && thread.length === 0 ? (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contextual Intro Message
                </label>
                <textarea
                  rows={4}
                  value={introMessage}
                  onChange={(e) => setIntroMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Connection Invite</span>
              </button>
            </form>
          ) : (
            <>
              {thread.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'me' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] font-mono-tabular text-slate-400 mt-1 px-1">
                    {msg.sender === 'me' ? 'You' : attendee.name.split(' ')[0]} ·{' '}
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {attendee.connectionStatus === 'pending' && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                  <span>Waiting for {attendee.name.split(' ')[0]} to accept...</span>
                  <button
                    type="button"
                    onClick={() =>
                      acceptSimulatedReply(attendee.id, contextEvent?.id)
                    }
                    className="px-2.5 py-1 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Simulate Accept</span>
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Footer (when connected) */}
        {attendee.connectionStatus === 'connected' && (
          <form
            onSubmit={handleSendChat}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message ${attendee.name.split(' ')[0]}...`}
              className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-3.5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
