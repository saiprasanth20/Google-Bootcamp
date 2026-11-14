import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ArrowUpRight,
} from 'lucide-react';
import { EventItem } from '@/src/types';

interface InteractiveGlobeProps {
  events: EventItem[];
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  onZoomToStreetMap: (eventId: string) => void;
  onOpenHub: (eventId: string) => void;
  getAttendeeCount: (eventId: string) => number;
  darkMode: boolean;
}

// Simplified continental outlines [lng, lat] for crisp vector landmass rendering
const CONTINENT_POLYGONS: Array<Array<[number, number]>> = [
  // North America
  [
    [-168, 65], [-162, 70], [-140, 70], [-125, 72], [-95, 74], [-78, 70],
    [-64, 62], [-55, 52], [-66, 44], [-74, 40], [-81, 31], [-80, 25],
    [-83, 29], [-90, 29], [-97, 26], [-96, 19], [-88, 21], [-84, 10],
    [-78, 8], [-85, 11], [-94, 15], [-105, 20], [-112, 28], [-117, 32],
    [-124, 40], [-125, 49], [-136, 58], [-152, 60], [-164, 55], [-168, 65],
  ],
  // Greenland
  [
    [-52, 60], [-42, 60], [-22, 70], [-18, 81], [-45, 83], [-68, 77],
    [-55, 68], [-52, 60],
  ],
  // South America
  [
    [-78, 9], [-71, 12], [-61, 10], [-50, 1], [-35, -6], [-39, -15],
    [-40, -22], [-48, -28], [-54, -34], [-63, -41], [-68, -52], [-73, -54],
    [-75, -45], [-71, -30], [-70, -18], [-77, -12], [-81, -5], [-79, 2], [-78, 9],
  ],
  // UK & Ireland
  [
    [-6, 50], [1.5, 51], [1.5, 53], [-2, 58], [-6, 58], [-6, 54], [-10, 53], [-6, 50],
  ],
  // Europe + Eurasia + Asia
  [
    [-9, 37], [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 54], [10, 58],
    [5, 61], [16, 69], [28, 71], [42, 68], [60, 70], [82, 73], [105, 76],
    [135, 72], [168, 67], [178, 66], [162, 59], [156, 51], [142, 53],
    [135, 44], [129, 35], [126, 38], [122, 40], [118, 38], [122, 31],
    [114, 22], [108, 16], [109, 11], [103, 2], [100, 7], [96, 16],
    [90, 22], [82, 16], [77, 8], [72, 20], [67, 24], [58, 25], [51, 26],
    [56, 22], [44, 13], [35, 29], [32, 31], [35, 36], [27, 37], [23, 38],
    [19, 40], [14, 41], [12, 44], [6, 43], [0, 39], [-5, 36], [-9, 37],
  ],
  // Africa
  [
    [-17, 15], [-16, 21], [-6, 35], [10, 37], [15, 32], [32, 31], [39, 20],
    [43, 12], [51, 11], [45, 2], [40, -11], [35, -24], [28, -33], [18, -34],
    [14, -22], [12, -12], [9, 4], [2, 6], [-8, 5], [-15, 11], [-17, 15],
  ],
  // Madagascar
  [
    [44, -25], [47, -25], [50, -15], [49, -12], [44, -18], [44, -25],
  ],
  // Japan Archipelago
  [
    [130, 31], [134, 34], [139, 35], [141, 41], [145, 44], [141, 45],
    [139, 39], [136, 36], [131, 34], [130, 31],
  ],
  // Maritime SE Asia (Sumatra/Java/Borneo)
  [
    [95, 5], [105, -6], [115, -8], [118, -2], [110, 2], [103, 1], [95, 5],
  ],
  // Australia
  [
    [114, -22], [122, -17], [131, -12], [136, -12], [142, -11], [146, -18],
    [153, -26], [150, -37], [140, -38], [131, -32], [121, -34], [115, -34],
    [114, -22],
  ],
];

const DEG2RAD = Math.PI / 180;

function projectPoint(
  lat: number,
  lng: number,
  rotLng: number,
  rotLat: number,
  radius: number,
  cx: number,
  cy: number
) {
  const phi = lat * DEG2RAD;
  const lambda = (lng - rotLng) * DEG2RAD;
  const phi0 = rotLat * DEG2RAD;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const cosLambda = Math.cos(lambda);
  const sinLambda = Math.sin(lambda);

  const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda;
  const x = cx + radius * cosPhi * sinLambda;
  const y = cy - radius * (cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLambda);

  return { x, y, z, visible: z > -0.05 };
}

function normalizeLng(lng: number): number {
  let res = lng;
  while (res > 180) res -= 360;
  while (res < -180) res += 360;
  return res;
}

export const InteractiveGlobe: React.FC<InteractiveGlobeProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onZoomToStreetMap,
  onOpenHub,
  getAttendeeCount,
  darkMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? events[0] ?? null,
    [events, selectedEventId]
  );

  // Camera state stored in refs for 60fps animation without React re-render overhead
  const rotRef = useRef<{ lng: number; lat: number }>({
    lng: selectedEvent ? selectedEvent.lng : 40,
    lat: selectedEvent ? selectedEvent.lat * 0.65 : 22,
  });
  const targetRotRef = useRef<{ lng: number; lat: number } | null>(null);
  const velocityRef = useRef<{ lng: number; lat: number }>({ lng: 0, lat: 0 });
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, moved: false, lastX: 0, lastY: 0 });

  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const screenPinsRef = useRef<
    Array<{ event: EventItem; x: number; y: number; r: number }>
  >([]);

  // Smoothly fly to selected event whenever selectedEventId changes
  useEffect(() => {
    if (!selectedEvent) return;
    targetRotRef.current = {
      lng: selectedEvent.lng,
      lat: Math.max(-55, Math.min(55, selectedEvent.lat * 0.72)),
    };
  }, [selectedEvent?.id, selectedEvent?.lat, selectedEvent?.lng]);

  // Animation & Canvas Render Loop
  useEffect(() => {
    let rafId = 0;

    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(300, Math.floor(rect.width));
        const height = Math.max(300, Math.floor(rect.height));

        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.clearRect(0, 0, width, height);

          // Update rotation physics
          if (!dragRef.current.active) {
            if (targetRotRef.current) {
              const dLng = normalizeLng(
                targetRotRef.current.lng - rotRef.current.lng
              );
              const dLat = targetRotRef.current.lat - rotRef.current.lat;
              rotRef.current.lng = normalizeLng(rotRef.current.lng + dLng * 0.085);
              rotRef.current.lat += dLat * 0.085;
              if (Math.abs(dLng) < 0.25 && Math.abs(dLat) < 0.25) {
                targetRotRef.current = null;
              }
            } else {
              rotRef.current.lng = normalizeLng(
                rotRef.current.lng + velocityRef.current.lng
              );
              rotRef.current.lat = Math.max(
                -65,
                Math.min(65, rotRef.current.lat + velocityRef.current.lat)
              );
              velocityRef.current.lng *= 0.92;
              velocityRef.current.lat *= 0.92;

              if (
                autoRotate &&
                Math.abs(velocityRef.current.lng) < 0.02
              ) {
                rotRef.current.lng = normalizeLng(rotRef.current.lng + 0.12);
              }
            }
          }

          const cx = width / 2;
          const cy = height / 2 - 14;
          const baseRadius = Math.min(width, height) * 0.36;
          const radius = baseRadius * zoomScale;

          // Subtle background radial aura
          const bgGrad = ctx.createRadialGradient(
            cx,
            cy,
            radius * 0.3,
            cx,
            cy,
            radius * 1.45
          );
          if (darkMode) {
            bgGrad.addColorStop(0, 'rgba(37, 99, 235, 0.14)');
            bgGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.04)');
            bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
          } else {
            bgGrad.addColorStop(0, 'rgba(37, 99, 235, 0.08)');
            bgGrad.addColorStop(0.75, 'rgba(226, 232, 240, 0.15)');
            bgGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          // Sphere base ocean fill
          const sphereGrad = ctx.createRadialGradient(
            cx - radius * 0.32,
            cy - radius * 0.32,
            radius * 0.12,
            cx,
            cy,
            radius
          );
          if (darkMode) {
            sphereGrad.addColorStop(0, '#1e293b');
            sphereGrad.addColorStop(0.65, '#0f172a');
            sphereGrad.addColorStop(1, '#090e1a');
          } else {
            sphereGrad.addColorStop(0, '#ffffff');
            sphereGrad.addColorStop(0.7, '#eef2f7');
            sphereGrad.addColorStop(1, '#dbe4f0');
          }

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = sphereGrad;
          ctx.fill();

          // Clip inner globe features
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();

          // Latitude & longitude graticule lines
          ctx.strokeStyle = darkMode
            ? 'rgba(148, 163, 184, 0.12)'
            : 'rgba(100, 116, 139, 0.14)';
          ctx.lineWidth = 0.75;

          for (let lat = -60; lat <= 60; lat += 30) {
            ctx.beginPath();
            let started = false;
            for (let lng = -180; lng <= 180; lng += 6) {
              const p = projectPoint(
                lat,
                lng,
                rotRef.current.lng,
                rotRef.current.lat,
                radius,
                cx,
                cy
              );
              if (p.z >= 0) {
                if (!started) {
                  ctx.moveTo(p.x, p.y);
                  started = true;
                } else {
                  ctx.lineTo(p.x, p.y);
                }
              } else {
                started = false;
              }
            }
            ctx.stroke();
          }

          for (let lng = -180; lng < 180; lng += 30) {
            ctx.beginPath();
            let started = false;
            for (let lat = -84; lat <= 84; lat += 6) {
              const p = projectPoint(
                lat,
                lng,
                rotRef.current.lng,
                rotRef.current.lat,
                radius,
                cx,
                cy
              );
              if (p.z >= 0) {
                if (!started) {
                  ctx.moveTo(p.x, p.y);
                  started = true;
                } else {
                  ctx.lineTo(p.x, p.y);
                }
              } else {
                started = false;
              }
            }
            ctx.stroke();
          }

          // Render continents
          ctx.fillStyle = darkMode
            ? 'rgba(71, 85, 105, 0.55)'
            : 'rgba(148, 163, 184, 0.36)';
          ctx.strokeStyle = darkMode
            ? 'rgba(148, 163, 184, 0.45)'
            : 'rgba(100, 116, 139, 0.45)';
          ctx.lineWidth = 1;

          for (const poly of CONTINENT_POLYGONS) {
            const projected: Array<{ x: number; y: number; z: number }> = [];
            let visibleCount = 0;
            for (const [lng, lat] of poly) {
              const p = projectPoint(
                lat,
                lng,
                rotRef.current.lng,
                rotRef.current.lat,
                radius,
                cx,
                cy
              );
              projected.push(p);
              if (p.z > -0.1) visibleCount++;
            }
            if (visibleCount < 2) continue;

            ctx.beginPath();
            let drawing = false;
            for (let i = 0; i < projected.length; i++) {
              const pt = projected[i];
              if (pt.z > -0.15) {
                if (!drawing) {
                  ctx.moveTo(pt.x, pt.y);
                  drawing = true;
                } else {
                  ctx.lineTo(pt.x, pt.y);
                }
              } else {
                drawing = false;
              }
            }
            ctx.fill();
            ctx.stroke();
          }

          // Subtle arc connecting selected event to other events in feed
          if (selectedEvent) {
            const pSelected = projectPoint(
              selectedEvent.lat,
              selectedEvent.lng,
              rotRef.current.lng,
              rotRef.current.lat,
              radius,
              cx,
              cy
            );
            if (pSelected.z > 0) {
              ctx.strokeStyle = darkMode
                ? 'rgba(59, 130, 246, 0.25)'
                : 'rgba(37, 99, 235, 0.22)';
              ctx.lineWidth = 1;
              ctx.setLineDash([3, 4]);
              for (const ev of events) {
                if (ev.id === selectedEvent.id) continue;
                const pOther = projectPoint(
                  ev.lat,
                  ev.lng,
                  rotRef.current.lng,
                  rotRef.current.lat,
                  radius,
                  cx,
                  cy
                );
                if (pOther.z > 0.05) {
                  ctx.beginPath();
                  ctx.moveTo(pSelected.x, pSelected.y);
                  const midX = (pSelected.x + pOther.x) / 2;
                  const midY =
                    (pSelected.y + pOther.y) / 2 -
                    Math.hypot(pOther.x - pSelected.x, pOther.y - pSelected.y) * 0.18;
                  ctx.quadraticCurveTo(midX, midY, pOther.x, pOther.y);
                  ctx.stroke();
                }
              }
              ctx.setLineDash([]);
            }
          }

          ctx.restore();

          // Outer sphere rim stroke
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = darkMode
            ? 'rgba(148, 163, 184, 0.28)'
            : 'rgba(100, 116, 139, 0.3)';
          ctx.lineWidth = 1.25;
          ctx.stroke();

          // Plot Event Pins (sorted back-to-front by z)
          const visiblePins: Array<{
            event: EventItem;
            x: number;
            y: number;
            z: number;
            r: number;
          }> = [];

          for (const ev of events) {
            const p = projectPoint(
              ev.lat,
              ev.lng,
              rotRef.current.lng,
              rotRef.current.lat,
              radius,
              cx,
              cy
            );
            if (p.z > 0.02) {
              const count = getAttendeeCount(ev.id);
              const r = Math.min(11, Math.max(5.5, 5 + count * 0.7));
              visiblePins.push({ event: ev, x: p.x, y: p.y, z: p.z, r });
            }
          }

          visiblePins.sort((a, b) => a.z - b.z);
          screenPinsRef.current = visiblePins.map(({ event, x, y, r }) => ({
            event,
            x,
            y,
            r,
          }));

          for (const pin of visiblePins) {
            const isSelected = pin.event.id === selectedEvent?.id;
            const isHovered = pin.event.id === hoveredEventId;

            if (isSelected) {
              ctx.beginPath();
              ctx.arc(pin.x, pin.y, pin.r + 9, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(pin.x, pin.y, pin.r + 4.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(37, 99, 235, 0.16)';
              ctx.fill();
            }

            // Pin core
            ctx.beginPath();
            ctx.arc(
              pin.x,
              pin.y,
              isSelected ? pin.r + 1.5 : isHovered ? pin.r + 1 : pin.r,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = isSelected
              ? '#2563EB'
              : isHovered
                ? '#3B82F6'
                : darkMode
                  ? '#10B981'
                  : '#0F172A';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = darkMode ? '#0F172A' : '#FFFFFF';
            ctx.stroke();

            // City label near visible pins
            if (isSelected || isHovered || pin.z > 0.55) {
              ctx.font = isSelected
                ? '600 11px "Plus Jakarta Sans", sans-serif'
                : '500 10px "DM Sans", sans-serif';
              const label = pin.event.city;
              const labelX = pin.x + pin.r + 6;
              const labelY = pin.y + 3.5;

              ctx.fillStyle = darkMode
                ? 'rgba(15, 23, 42, 0.78)'
                : 'rgba(255, 255, 255, 0.85)';
              const metrics = ctx.measureText(label);
              ctx.fillRect(
                labelX - 4,
                labelY - 10,
                metrics.width + 8,
                14
              );

              ctx.fillStyle = isSelected
                ? darkMode
                  ? '#93C5FD'
                  : '#1D4ED8'
                : darkMode
                  ? '#E2E8F0'
                  : '#1E293B';
              ctx.fillText(label, labelX, labelY);
            }
          }

          ctx.restore();
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [events, selectedEvent, hoveredEventId, zoomScale, autoRotate, darkMode, getAttendeeCount]);

  const findPinAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let closest: { event: EventItem; x: number; y: number; dist: number } | null = null;
    for (const pin of screenPinsRef.current) {
      const dist = Math.hypot(x - pin.x, y - pin.y);
      if (dist <= Math.max(16, pin.r + 8)) {
        if (!closest || dist < closest.dist) {
          closest = { event: pin.event, x: pin.x, y: pin.y, dist };
        }
      }
    }
    return closest;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    targetRotRef.current = null;
    velocityRef.current = { lng: 0, lat: 0 };
    dragRef.current = {
      active: true,
      moved: false,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragRef.current.moved = true;
      }
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      const sensitivity = 0.36 / zoomScale;
      rotRef.current.lng = normalizeLng(rotRef.current.lng - dx * sensitivity);
      rotRef.current.lat = Math.max(
        -65,
        Math.min(65, rotRef.current.lat + dy * sensitivity)
      );
      velocityRef.current = {
        lng: -dx * sensitivity * 0.45,
        lat: dy * sensitivity * 0.45,
      };
      setHoveredEventId(null);
      return;
    }

    const hit = findPinAtPoint(e.clientX, e.clientY);
    if (hit) {
      setHoveredEventId(hit.event.id);
      setHoverPos({ x: hit.x, y: hit.y });
    } else {
      setHoveredEventId(null);
      setHoverPos(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    if (!wasMoved) {
      const hit = findPinAtPoint(e.clientX, e.clientY);
      if (hit) {
        onSelectEvent(hit.event.id);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoomScale((prev) => Math.max(0.75, Math.min(1.75, Number((prev + delta).toFixed(2)))));
  };

  const hoveredEvent = useMemo(
    () => events.find((e) => e.id === hoveredEventId) ?? null,
    [events, hoveredEventId]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[420px] select-none overflow-hidden bg-slate-50 dark:bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
        }}
        onWheel={handleWheel}
        className={`w-full h-full block ${hoveredEvent ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
        aria-label="Interactive 3D Event Globe"
      />

      {/* Top-left coordinate & control readout */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">Drag to spin</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <span className="font-mono-tabular text-[11px] text-slate-500 dark:text-slate-400">
            {events.length} active hubs
          </span>
        </div>
      </div>

      {/* Top-right globe controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          title={autoRotate ? 'Pause rotation' : 'Resume rotation'}
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={autoRotate ? 'Pause globe rotation' : 'Resume globe rotation'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setZoomScale((s) => Math.min(1.75, Number((s + 0.15).toFixed(2))))}
          title="Zoom in"
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zoom in globe"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoomScale((s) => Math.max(0.75, Number((s - 0.15).toFixed(2))))}
          title="Zoom out"
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zoom out globe"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoomScale(1);
            if (selectedEvent) {
              targetRotRef.current = {
                lng: selectedEvent.lng,
                lat: Math.max(-55, Math.min(55, selectedEvent.lat * 0.72)),
              };
            }
          }}
          title="Reset focus"
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Recenter globe on selected event"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover pin tooltip */}
      {hoveredEvent && hoverPos && hoveredEvent.id !== selectedEvent?.id && (
        <div
          style={{
            left: Math.min(Math.max(hoverPos.x + 14, 16), (containerRef.current?.clientWidth ?? 500) - 220),
            top: Math.max(hoverPos.y - 44, 56),
          }}
          className="absolute pointer-events-none z-10 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-md"
        >
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {hoveredEvent.title}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {hoveredEvent.city} · {hoveredEvent.startDate}
          </p>
        </div>
      )}

      {/* Selected Event Focus Strip at Bottom */}
      {selectedEvent && (
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{selectedEvent.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {selectedEvent.lat.toFixed(2)}°, {selectedEvent.lng.toFixed(2)}°
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {getAttendeeCount(selectedEvent.id)} builders
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {selectedEvent.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>
                {selectedEvent.venueName}, {selectedEvent.city}, {selectedEvent.country}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenHub(selectedEvent.id)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>Open Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onZoomToStreetMap(selectedEvent.id)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Zoom to Street Map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
