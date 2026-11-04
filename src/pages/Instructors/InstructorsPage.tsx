import { useMemo, useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/state/AppDataContext';

export function InstructorsPage() {
  const { data } = useAppData();
  const [languageFilter, setLanguageFilter] = useState<string>('all');

  const languages = useMemo(() => {
    const set = new Set<string>();
    data.instructors.forEach((instructor) => instructor.languages.forEach((lang) => set.add(lang)));
    return Array.from(set).sort();
  }, [data.instructors]);

  const filteredInstructors = useMemo(() => {
    if (languageFilter === 'all') return data.instructors;
    return data.instructors.filter((instructor) => instructor.languages.includes(languageFilter));
  }, [data.instructors, languageFilter]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-co-ink">Find your conversation partner.</h1>
          <p className="mt-2 text-sm text-co-muted">
            {filteredInstructors.length} instructor{filteredInstructors.length === 1 ? '' : 's'} available
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="language-filter" className="text-xs font-medium text-co-muted">
            Language
          </label>
          <select
            id="language-filter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-full border border-co-line bg-co-paper px-3 py-2 text-sm text-co-ink"
          >
            <option value="all">All languages</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredInstructors.map((instructor) => (
          <Card key={instructor.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ${instructor.avatarColorClass}`}
              >
                {instructor.avatarInitials}
              </span>
              <div>
                <p className="font-medium text-co-ink">{instructor.name}</p>
                <p className="text-xs text-co-muted">{instructor.title}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-co-muted">{instructor.bio}</p>

            <div className="flex flex-wrap gap-1.5">
              {instructor.specialties.map((specialty) => (
                <span key={specialty} className="rounded-full bg-co-sage/25 px-2.5 py-1 text-[11px] font-medium text-co-sage-dark">
                  {specialty}
                </span>
              ))}
            </div>

            <ButtonLink to={`/instructors/${instructor.id}`} variant="primary" size="sm" className="mt-auto">
              View profile &amp; book
            </ButtonLink>
          </Card>
        ))}
      </div>
    </div>
  );
}
