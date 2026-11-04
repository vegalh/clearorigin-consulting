import type { MeetingProvider } from '@/types';
import { Card } from '@/components/ui/Card';
import { DemoLabel } from '@/components/ui/Badge';

const providers: { id: MeetingProvider; label: string }[] = [
  { id: 'zoom', label: 'Zoom' },
  { id: 'google_meet', label: 'Google Meet' },
];

export function MeetingSettings({ provider, onChange }: { provider: MeetingProvider; onChange: (provider: MeetingProvider) => void }) {
  return (
    <Card id="meeting-settings" className="scroll-mt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-co-sage-dark">Meeting platform</h2>
        <DemoLabel>No real meetings</DemoLabel>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm text-co-ink">Preferred platform for new bookings</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {providers.map((p) => (
            <label
              key={p.id}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                provider === p.id ? 'border-co-orange-dark bg-co-pale/40 text-co-orange-dark' : 'border-co-line text-co-ink'
              }`}
            >
              <input type="radio" name="meeting-provider" value={p.id} checked={provider === p.id} onChange={() => onChange(p.id)} className="sr-only" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-xs leading-relaxed text-co-muted">
        In production, ClearOrigin's server would create the meeting through an authorized Zoom or Google integration once a booking is
        confirmed, then attach the link to the booking and calendar invite. Credentials stay server-side. Existing bookings keep their platform.
      </p>
    </Card>
  );
}
