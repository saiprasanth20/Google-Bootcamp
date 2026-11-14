import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { useEventSphere } from '@/src/context/EventSphereContext';
import { SafeImage } from '@/src/components/SafeImage';

export const RecapComposerModal: React.FC = () => {
  const {
    recapComposerEventId,
    closeRecapComposer,
    events,
    addRecap,
  } = useEventSphere();

  const event = useMemo(
    () => events.find((e) => e.id === recapComposerEventId) ?? null,
    [events, recapComposerEventId]
  );

  const [processReview, setProcessReview] = useState('');
  const [learningInput, setLearningInput] = useState('');
  const [keyLearnings, setKeyLearnings] = useState<string[]>([
    '',
  ]);
  const [projectLink, setProjectLink] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  if (!event) return null;

  const handleAddLearning = () => {
    const trimmed = learningInput.trim();
    if (!trimmed) return;
    setKeyLearnings((prev) => [...prev.filter((l) => l.trim().length > 0), trimmed]);
    setLearningInput('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedLearnings = [
      ...keyLearnings.map((l) => l.trim()).filter(Boolean),
      ...(learningInput.trim() ? [learningInput.trim()] : []),
    ];
    if (!processReview.trim()) return;

    addRecap({
      eventId: event.id,
      processReview: processReview.trim(),
      keyLearnings:
        cleanedLearnings.length > 0
          ? cleanedLearnings
          : ['Connected with builders and shipped a working prototype on-site.'],
      projectLink: projectLink.trim() || undefined,
      photos,
    });

    setProcessReview('');
    setLearningInput('');
    setKeyLearnings(['']);
    setProjectLink('');
    setPhotos([]);
    closeRecapComposer();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Write Event Recap for ${event.title}`}
    >
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              Write Event Recap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {event.title} · {event.city}
            </p>
          </div>
          <button
            type="button"
            onClick={closeRecapComposer}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close recap composer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto es-scroll p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              How It Went & Process Review
            </label>
            <textarea
              required
              rows={4}
              value={processReview}
              onChange={(e) => setProcessReview(e.target.value)}
              placeholder="Share the venue logistics, registration/selection experience, mentorship quality, and overall builder vibe..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Key Learnings & Takeaways
            </label>
            <div className="space-y-2">
              {keyLearnings
                .filter((l) => l.length > 0)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <span className="flex-1">• {item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setKeyLearnings((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-slate-400 hover:text-red-500 p-1"
                      aria-label="Remove takeaway"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={learningInput}
                  onChange={(e) => setLearningInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLearning();
                    }
                  }}
                  placeholder="Add a technical takeaway (press Enter or Add)"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddLearning}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Project / GitHub / Demo Link (optional)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Showcase Photos (up to 4)
              </label>
              <button
                type="button"
                onClick={() =>
                  setPhotos((prev) =>
                    prev.includes(event.coverImage)
                      ? prev
                      : [...prev, event.coverImage].slice(0, 4)
                  )
                }
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Use event venue snapshot
              </button>
            </div>
            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-4 px-4 text-xs text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload demo or venue photos from your device</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden aspect-[4/3] border border-slate-200 dark:border-slate-700">
                    <SafeImage
                      src={photo}
                      alt={`Uploaded showcase ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="absolute top-1.5 right-1.5 p-1 rounded bg-slate-950/75 text-white opacity-90 hover:opacity-100"
                      aria-label="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={closeRecapComposer}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Publish Recap
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
