import React, { useState } from 'react';
import { Globe2 } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 text-slate-500 dark:text-slate-400 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Globe2 className="w-7 h-7 mb-2 opacity-60" />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
