import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { AvailabilityException, AvailabilityExceptionType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const exceptionTypeLabels: Record<AvailabilityExceptionType, string> = {
  blocked_day: 'Block the whole day',
  extra_hours: 'Add one-off hours',
  blocked_range: 'Block a time range',
};

interface ExceptionsEditorProps {
  instructorId: string;
  exceptions: AvailabilityException[];
  onAdd: (exception: AvailabilityException) => void;
  onRemove: (id: string) => void;
}

export function ExceptionsEditor({ instructorId, exceptions, onAdd, onRemove }: ExceptionsEditorProps) {
  const [type, setType] = useState<AvailabilityExceptionType>('blocked_day');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sorted = exceptions
    .filter((e) => e.instructorId === instructorId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleAdd = () => {
    if (!date) {
      setError('Please choose a date.');
      return;
    }
    if (type !== 'blocked_day' && startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    setError(null);
    onAdd({
      id: crypto.randomUUID(),
      instructorId,
      date,
      type,
      startTime: type === 'blocked_day' ? undefined : startTime,
      endTime: type === 'blocked_day' ? undefined : endTime,
      note: note.trim() || undefined,
    });
    setDate('');
    setNote('');
  };

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Date exceptions</h2>

      <div className="mt-4 space-y-2">
        {sorted.length === 0 && <p className="text-sm text-co-muted">No date exceptions yet.</p>}
        {sorted.map((exception) => (
          <div
            key={exception.id}
            className="flex items-center justify-between gap-3 rounded-co-sm border border-co-line px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-co-ink">
                {exception.date} &mdash; {exceptionTypeLabels[exception.type]}
              </p>
              {exception.startTime && exception.endTime && (
                <p className="text-xs text-co-muted">
                  {exception.startTime} &ndash; {exception.endTime}
                </p>
              )}
              {exception.note && <p className="text-xs text-co-muted">{exception.note}</p>}
            </div>
            <button
              type="button"
              aria-label="Remove exception"
              onClick={() => onRemove(exception.id)}
              className="text-co-muted hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3 border-t border-co-line pt-4">
        <p className="text-xs font-medium text-co-muted">Add an exception</p>
        <div className="flex flex-wrap gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AvailabilityExceptionType)}
            className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1.5 text-sm"
          >
            {Object.entries(exceptionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1.5 text-sm"
          />
          {type !== 'blocked_day' && (
            <>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1.5 text-sm"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-co-sm border border-co-line bg-co-paper px-2 py-1.5 text-sm"
              />
            </>
          )}
        </div>
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-co-sm border border-co-line bg-co-paper px-3 py-1.5 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          Add exception
        </Button>
      </div>
    </Card>
  );
}
