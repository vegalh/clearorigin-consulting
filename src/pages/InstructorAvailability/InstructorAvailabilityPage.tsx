import { useAppData } from '@/state/AppDataContext';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { ExceptionsEditor } from './ExceptionsEditor';

export function InstructorAvailabilityPage() {
  const { data, currentInstructorId, replaceRecurringAvailability, addAvailabilityException, removeAvailabilityException } =
    useAppData();

  const instructor = data.instructors.find((i) => i.id === currentInstructorId);
  if (!instructor) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-co-ink">Availability</h1>
      <p className="mt-2 text-sm text-co-muted">
        Editing the schedule for {instructor.name}, interpreted in their timezone ({instructor.timezone.replace('_', ' ')}
        ). Changes apply immediately to what students see.
      </p>

      <div className="mt-8 space-y-6">
        <WeeklyScheduleEditor
          key={instructor.id}
          instructorId={instructor.id}
          rules={data.recurringAvailability}
          onSave={(rules) => replaceRecurringAvailability(instructor.id, rules)}
        />
        <ExceptionsEditor
          key={instructor.id}
          instructorId={instructor.id}
          exceptions={data.availabilityExceptions}
          onAdd={addAvailabilityException}
          onRemove={removeAvailabilityException}
        />
      </div>
    </div>
  );
}
