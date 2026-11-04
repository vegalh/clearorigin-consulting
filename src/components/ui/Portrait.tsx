import type { Instructor } from '@/types';

type Size = 'sm' | 'md' | 'lg';

const avatarSizes: Record<Exclude<Size, 'lg'>, string> = {
  sm: 'h-12 w-12 text-sm',
  md: 'h-16 w-16 text-lg',
};

/**
 * Instructor portrait. Uses a real photograph only when one has been
 * provided (`photoUrl`); otherwise shows a warm placeholder — initials for
 * small avatars, an illustrated silhouette for the large profile portrait.
 * No stock photos stand in for real people.
 */
export function Portrait({ instructor, size = 'md', showLabel = false }: { instructor: Instructor; size?: Size; showLabel?: boolean }) {
  const isLarge = size === 'lg';

  if (instructor.photoUrl) {
    return (
      <img
        src={instructor.photoUrl}
        alt={`Portrait of ${instructor.name}`}
        className={isLarge ? 'aspect-[4/5] w-full rounded-co-lg object-cover' : `${avatarSizes[size]} rounded-full object-cover`}
      />
    );
  }

  if (!isLarge) {
    return (
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${avatarSizes[size]} ${instructor.avatarColorClass}`}
      >
        {instructor.avatarInitials}
      </span>
    );
  }

  return (
    <div
      role="img"
      aria-label={`Illustrated placeholder portrait for ${instructor.name}`}
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-co-lg ${instructor.avatarColorClass}`}
    >
      <svg viewBox="0 0 100 125" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
        <circle cx="50" cy="52" r="19" fill="var(--color-co-paper)" fillOpacity="0.88" />
        <path d="M14 125c2-26 17-41 36-41s34 15 36 41z" fill="var(--color-co-paper)" fillOpacity="0.88" />
      </svg>
      <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-co-paper text-xs font-semibold text-co-ink">
        {instructor.avatarInitials}
      </span>
      {showLabel && (
        <span className="absolute left-3 top-3 rounded-full bg-co-paper/90 px-2 py-0.5 text-[10px] font-medium text-co-muted">Demo portrait</span>
      )}
    </div>
  );
}
