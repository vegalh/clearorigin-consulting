import { useState } from 'react';
import type { RecurringAvailability, Weekday } from '@/types';
import { WEEKDAY_LABELS } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
          <div key={row.weekday} className="flex flex-wrap items-center gap-3 border-b border-co-line pb-3 last:border-0">
            <label className="flex w-36 items-center gap-2 text-sm font-medium text-co-ink">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={(e) => updateRow(row.weekday, { enabled: e.target.checked })}
              />
              {WEEKDAY_LABELS[row.weekday]}
            </label>
            {row.enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) => updateRow(row.weekday, { startTime: e.target.value })}
                  className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1"
                />
                <span className="text-co-muted">to</span>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) => updateRow(row.weekday, { endTime: e.target.value })}
                  className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1"
                />
              </div>
            ) : (
              <span className="text-sm text-co-muted">Unavailable</span>
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
