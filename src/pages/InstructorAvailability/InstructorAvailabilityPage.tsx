import { useAppData } from '@/state/AppDataContext';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { ExceptionsEditor } from './ExceptionsEditor';
import { MeetingSettings } from './MeetingSettings';
import { useI18n } from '@/i18n/useI18n';

export function InstructorAvailabilityPage() {
  const {
    data,
    currentInstructorId,
    replaceRecurringAvailability,
    addAvailabilityException,
    removeAvailabilityException,
    setMeetingProvider,
  } = useAppData();
  const { m, loc } = useI18n();

  const instructor = data.instructors.find((i) => i.id === currentInstructorId);
  if (!instructor) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.availability.title}</h1>
      <p className="mt-2 text-sm text-co-muted">{m.availability.intro(loc.shortName(instructor), loc.timezone(instructor.timezone))}</p>

      <div className="mt-8 space-y-6">
        <WeeklyScheduleEditor
          key={`weekly-${instructor.id}`}
          instructorId={instructor.id}
          rules={data.recurringAvailability}
          onSave={(rules) => replaceRecurringAvailability(instructor.id, rules)}
        />
        <ExceptionsEditor
          key={`exceptions-${instructor.id}`}
          instructorId={instructor.id}
          exceptions={data.availabilityExceptions}
          onAdd={addAvailabilityException}
          onRemove={removeAvailabilityException}
        />
        <MeetingSettings
          provider={data.meetingConfigurations.find((m) => m.instructorId === instructor.id)?.provider ?? 'zoom'}
          onChange={(provider) => setMeetingProvider(instructor.id, provider)}
        />
      </div>
    </div>
  );
}
