import { useMemo, useState } from 'react';
import type { LearnerGroupId } from '@/types';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Portrait } from '@/components/ui/Portrait';
import { useAppData } from '@/state/AppDataContext';
import { learnerGroupLabels } from '@/config/learnerOptions';
import { useI18n } from '@/i18n/useI18n';

export function InstructorsPage() {
  const { data } = useAppData();
  const { m, loc } = useI18n();
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<LearnerGroupId | 'all'>('all');

  const languages = useMemo(() => {
    const set = new Set<string>();
    data.instructors.forEach((instructor) => instructor.languages.forEach((lang) => set.add(lang)));
    return Array.from(set).sort();
  }, [data.instructors]);

  const filteredInstructors = useMemo(
    () =>
      data.instructors.filter(
        (instructor) =>
          (languageFilter === 'all' || instructor.languages.includes(languageFilter)) &&
          (groupFilter === 'all' || instructor.approach?.learnerGroups.includes(groupFilter)),
      ),
    [data.instructors, languageFilter, groupFilter],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.instructors.title}</h1>
          <p className="mt-2 text-sm text-co-muted">
            {m.instructors.count(filteredInstructors.length)}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <label htmlFor="group-filter" className="w-16 shrink-0 text-xs font-medium text-co-muted sm:w-auto">
              {m.instructors.learnerFilter}
            </label>
            <Select
              id="group-filter"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as LearnerGroupId | 'all')}
              wrapperClassName="flex-1 sm:w-48 sm:flex-none"
            >
              <option value="all">{m.instructors.allLearners}</option>
              {(Object.keys(learnerGroupLabels) as LearnerGroupId[]).map((id) => (
                <option key={id} value={id}>
                  {loc.learnerGroup(id).title}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="language-filter" className="w-16 shrink-0 text-xs font-medium text-co-muted sm:w-auto">
              {m.instructors.languageFilter}
            </label>
            <Select
              id="language-filter"
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              wrapperClassName="flex-1 sm:w-44 sm:flex-none"
            >
              <option value="all">{m.instructors.allLanguages}</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {loc.language(lang)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {filteredInstructors.map((instructor) => (
          <Card key={instructor.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Portrait instructor={instructor} size="sm" />
              <div className="min-w-0">
                <p className="font-medium text-co-ink">
                  {instructor.name} {instructor.chineseName && <span className="text-sm font-normal text-co-muted">{instructor.chineseName}</span>}
                </p>
                <p className="text-xs text-co-muted">{loc.instructor(instructor).title}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-co-muted">{loc.instructor(instructor).bio}</p>
            {instructor.qualifications && (
              <p className="text-xs text-co-muted">
                {m.instructors.yearsAndCert(instructor.qualifications.yearsTeaching, loc.instructor(instructor).qualifications!.certifications[0])}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {loc.instructor(instructor).specialties.map((specialty) => (
                <span key={specialty} className="rounded-full bg-co-sage/25 px-2.5 py-1 text-[11px] font-medium text-co-sage-dark">
                  {specialty}
                </span>
              ))}
            </div>

            <ButtonLink to={`/instructors/${instructor.id}`} variant="primary" size="sm" className="mt-auto">
              {m.instructors.viewAndBook}
            </ButtonLink>
          </Card>
        ))}
        {filteredInstructors.length === 0 && (
          <p className="rounded-co-md border border-dashed border-co-line bg-co-paper p-6 text-sm text-co-muted sm:col-span-2 lg:col-span-3">
            {m.instructors.noMatches}
          </p>
        )}
      </div>
    </div>
  );
}
