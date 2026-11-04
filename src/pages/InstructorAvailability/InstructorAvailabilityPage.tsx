import { useAppData } from '@/state/AppDataContext';
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor';
import { ExceptionsEditor } from './ExceptionsEditor';

export function InstructorAvailabilityPage() {
  const { data, currentInstructorId, replaceRecurringAvailability, addAvailabilityException, removeAvailabilityException } =
    useAppData();

  const instructor = data.instructors.find((i) => i.id === currentInstructorId);
  if (!instructor) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl text-co-ink">Availability</h1>
      <p className="mt-2 text-sm text-co-muted">
        Shaping the hours you're open for conversation, in {instructor.name.split(' ')[0]}'s own timezone (
        {instructor.timezone.replace('_', ' ')}). Changes apply immediately to what students see.
      </p>

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
      </div>
    </div>
  );
}
