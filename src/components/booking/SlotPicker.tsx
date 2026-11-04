import { useMemo, useState } from 'react';
import type { TimeSlot } from '@/types';
import { localDateString } from '@/lib/scheduling';
import { formatDisplayTime, formatShortWeekday } from '@/lib/dates/format';

interface SlotPickerProps {
  slots: TimeSlot[];
  timezone: string;
  selected: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

interface DayGroup {
  dateStr: string;
  slots: TimeSlot[];
}

/**
 * Groups generated slots by calendar date in the viewer's chosen timezone,
 * then shows a horizontal day picker + a grid of times for the active day.
 */
export function SlotPicker({ slots, timezone, selected, onSelect }: SlotPickerProps) {
  const dayGroups = useMemo<DayGroup[]>(() => {
    const byDate = new Map<string, TimeSlot[]>();
    for (const slot of slots) {
      const dateStr = localDateString(new Date(slot.startUtc), timezone);
      const existing = byDate.get(dateStr);
      if (existing) {
        existing.push(slot);
      } else {
        byDate.set(dateStr, [slot]);
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, daySlots]) => ({ dateStr, slots: daySlots }));
  }, [slots, timezone]);

  // Explicit user selection, when it still points at a day in the current
  // `dayGroups` (e.g. the slot list changed after a booking/reschedule).
  // Falls back to the first available day, computed during render instead
  // of synced via an effect.
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const activeDate = (selectedDate && dayGroups.some((g) => g.dateStr === selectedDate) ? selectedDate : dayGroups[0]?.dateStr) ?? null;

  if (dayGroups.length === 0) {
    return (
      <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted">
        No openings for this session type right now. Try another session length, or check back soon.
      </p>
    );
  }

  const activeGroup = dayGroups.find((g) => g.dateStr === activeDate) ?? dayGroups[0];

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {dayGroups.map((group) => {
          const first = group.slots[0];
          const { weekday, day, month } = formatShortWeekday(first.startUtc, timezone);
          const isActive = group.dateStr === activeGroup.dateStr;
          return (
            <button
              key={group.dateStr}
              type="button"
              onClick={() => setSelectedDate(group.dateStr)}
              className={`flex min-w-[64px] flex-col items-center rounded-co-md border px-3 py-2 text-xs transition-colors ${
                isActive
                  ? 'border-co-orange-dark bg-co-orange-dark text-white'
                  : 'border-co-line bg-co-paper text-co-ink hover:border-co-orange-dark'
              }`}
            >
              <span className="font-medium">{weekday}</span>
              <span className="text-sm font-semibold">{day}</span>
              <span className={isActive ? 'text-white/80' : 'text-co-muted'}>{month}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {activeGroup.slots.map((slot) => {
          const isSelected = selected?.startUtc === slot.startUtc;
          return (
            <button
              key={slot.startUtc}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-co-sm border px-3 py-2 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-co-orange-dark bg-co-orange-dark text-white'
                  : 'border-co-line bg-co-paper text-co-ink hover:border-co-orange-dark'
              }`}
            >
              {formatDisplayTime(slot.startUtc, timezone)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
