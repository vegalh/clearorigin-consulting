import { useMemo } from 'react';
import type { Instructor, SessionType } from '@/types';
import { useAppData } from '@/state/AppDataContext';
import { getAvailableSlots } from '@/services/availabilityService';

/** Live-recomputed available slots for an instructor + session type, scoped to the current app data. */
export function useAvailableSlots(instructor: Instructor | undefined, sessionType: SessionType | undefined) {
  const { data } = useAppData();
  return useMemo(() => {
    if (!instructor || !sessionType) return [];
    return getAvailableSlots(data, instructor, sessionType);
  }, [data, instructor, sessionType]);
}
