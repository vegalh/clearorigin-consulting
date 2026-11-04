import { useState } from 'react';
import type { RecurringAvailability, Weekday } from '@/types';
import { WEEKDAY_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { inputClass } from '@/components/ui/fieldStyles';

interface DayRow {
  weekday: Weekday;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const weekdayOrder: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

function buildRows(instructorId: string, rules: RecurringAvailability[]): DayRow[] {
  return weekdayOrder.map((weekday) => {
    const rule = rules.find((r) => r.instructorId === instructorId && r.dayOfWeek === weekday);
    return {
      weekday,
      enabled: Boolean(rule),
      startTime: rule?.startTime ?? '09:00',
      endTime: rule?.endTime ?? '17:00',
    };
  });
}

export function WeeklyScheduleEditor({
  instructorId,
  rules,
  onSave,
}: {
  instructorId: string;
  rules: RecurringAvailability[];
  onSave: (rules: RecurringAvailability[]) => void;
}) {
  // Lazily initialized from props once; the parent remounts this component
  // (via `key={instructorId}`) whenever the acting instructor changes, so no
  // effect is needed to re-sync state from props.
  const [rows, setRows] = useState<DayRow[]>(() => buildRows(instructorId, rules));
  const [saved, setSaved] = useState(false);

  const updateRow = (weekday: Weekday, patch: Partial<DayRow>) => {
    setSaved(false);
    setRows((prev) => prev.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  };

  const handleSave = () => {
    const nextRules: RecurringAvailability[] = rows
      .filter((row) => row.enabled)
      .map((row) => ({
        id: `${instructorId}-${row.weekday}`,
        instructorId,
        dayOfWeek: row.weekday,
        startTime: row.startTime,
        endTime: row.endTime,
      }));
    onSave(nextRules);
    setSaved(true);
  };

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Weekly recurring schedule</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.weekday} className="flex flex-col gap-2 border-b border-co-line pb-3 last:border-0 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-co-ink sm:w-36 sm:shrink-0">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={row.enabled}
                onChange={(e) => updateRow(row.weekday, { enabled: e.target.checked })}
              />
              {WEEKDAY_LABELS[row.weekday]}
            </label>
            {row.enabled ? (
              <div className="flex items-center gap-2 text-sm sm:w-auto">
                <input
                  type="time"
                  value={row.startTime}
                  aria-label={`${WEEKDAY_LABELS[row.weekday]} start time`}
                  onChange={(e) => updateRow(row.weekday, { startTime: e.target.value })}
                  className={`${inputClass} min-w-0 flex-1 py-1.5 sm:w-32 sm:flex-none`}
                />
                <span className="text-co-muted">to</span>
                <input
                  type="time"
                  value={row.endTime}
                  aria-label={`${WEEKDAY_LABELS[row.weekday]} end time`}
                  onChange={(e) => updateRow(row.weekday, { endTime: e.target.value })}
                  className={`${inputClass} min-w-0 flex-1 py-1.5 sm:w-32 sm:flex-none`}
                />
              </div>
            ) : (
              <span className="pl-6 text-sm text-co-muted sm:pl-0">Unavailable</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={handleSave}>
          Save weekly schedule
        </Button>
        {saved && <span className="text-xs font-medium text-co-sage-dark">Saved</span>}
      </div>
    </Card>
  );
}
