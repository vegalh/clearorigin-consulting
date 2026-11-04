import { useContext, useMemo } from 'react';
import type { ChineseLevel, Course, Instructor, LearnerGroupId, LearningGoal, PaymentMethodId, SessionType } from '@/types';
import { formatDisplayDate, formatDisplayTime, formatDisplayTimeRange, formatShortDate, formatShortWeekday } from '@/lib/dates/format';
import { chineseLevelOptions, learnerGroupLabels, learningGoalOptions } from '@/config/learnerOptions';
import { heroContent, howToBegin, learnerGroups, teachingPhilosophy } from '@/config/siteContent';
import { faqSections } from '@/config/faq';
import { paymentMethods } from '@/services/payments/methods';
import { I18nContext } from './context';
import { en, type Messages } from './en';
import { zh } from './zh';
import * as zc from './zhContent';
import type { Lang } from './types';

const catalogs: Record<Lang, Messages> = { en, zh };

/** Patterns for service messages that embed values (exact matches live in `messages.reasons`). */
const zhReasonPatterns: [RegExp, (...groups: string[]) => string][] = [
  [/^(.+) doesn't teach the (.+)\.$/, (name, course) => `${name}不教授「${course}」。`],
  [/^Lessons can be rescheduled up to (\d+) hours before they start\.$/, (hours) => `课程开始前 ${hours} 小时以上才能改期。`],
];

function buildHelpers(lang: Lang) {
  const m = catalogs[lang];
  const isZh = lang === 'zh';

  const loc = {
    course(course: Course) {
      const copy = isZh ? zc.zhCourses[course.id] : undefined;
      return {
        title: copy?.title ?? course.title,
        description: copy?.description ?? course.description,
        includes: copy?.includes ?? course.includes,
        terms: copy?.terms ?? course.terms,
      };
    },
    courseTitle(course: Course | undefined, sessionType?: SessionType) {
      if (course) return loc.course(course).title;
      if (sessionType) return (isZh && zc.zhSessionTypes[sessionType.id]) || sessionType.name;
      return '';
    },
    instructor(instructor: Instructor) {
      const copy = isZh ? zc.zhInstructors[instructor.id] : undefined;
      const q = instructor.qualifications;
      const a = instructor.approach;
      return {
        title: copy?.title ?? instructor.title,
        bio: copy?.bio ?? instructor.bio,
        specialties: copy?.specialties ?? instructor.specialties,
        languages: copy?.languages ?? instructor.languages.map(loc.language),
        qualifications: q && {
          ...q,
          education: copy?.education ?? q.education,
          certifications: copy?.certifications ?? q.certifications,
          credentials: copy?.credentials ?? q.credentials,
          experience: copy?.experience ?? q.experience,
        },
        approach: a && { ...a, philosophy: copy?.philosophy ?? a.philosophy, methods: copy?.methods ?? a.methods },
      };
    },
    /** Name as the viewer should see it: Chinese name first in Chinese, romanized first in English. */
    instructorName(instructor: Instructor) {
      return isZh && instructor.chineseName ? instructor.chineseName : instructor.name;
    },
    /** Short, friendly form: "Maya" in English; the full Chinese name (陈美雅) in Chinese, where a given name alone reads oddly. */
    shortName(instructor: Instructor) {
      return isZh && instructor.chineseName ? instructor.chineseName : instructor.name.split(' ')[0];
    },
    language: (name: string) => (isZh && zc.zhLanguages[name]) || name,
    learnerGroup(id: LearnerGroupId) {
      const source = learnerGroups.find((g) => g.id === id);
      return isZh ? zc.zhLearnerGroups[id] : { title: learnerGroupLabels[id], body: source?.body ?? '' };
    },
    level: (v: ChineseLevel) => (isZh ? zc.zhLevels[v] : chineseLevelOptions.find((o) => o.value === v)?.label ?? v),
    goal: (v: LearningGoal) => (isZh ? zc.zhGoals[v] : learningGoalOptions.find((o) => o.value === v)?.label ?? v),
    paymentMethod(id: PaymentMethodId) {
      const source = paymentMethods.find((p) => p.id === id);
      return isZh ? zc.zhPaymentMethods[id] : { label: source?.label ?? id, description: source?.description ?? '' };
    },
    hero: isZh
      ? { ...heroContent, ...zc.zhHero, primaryCta: { ...heroContent.primaryCta, label: zc.zhHero.primaryCta }, secondaryCta: { ...heroContent.secondaryCta, label: zc.zhHero.secondaryCta } }
      : heroContent,
    philosophy: isZh ? zc.zhPhilosophy : teachingPhilosophy,
    howToBegin: isZh ? zc.zhHowToBegin : howToBegin,
    faqSections: isZh ? zc.zhFaqSections : faqSections,
    learnerGroups: learnerGroups.map((g) => ({ ...g, ...(isZh ? zc.zhLearnerGroups[g.id] : {}) })),
    reason(reason: string) {
      if (!isZh) return reason;
      if (m.reasons[reason]) return m.reasons[reason];
      for (const [pattern, build] of zhReasonPatterns) {
        const match = reason.match(pattern);
        if (match) return build(...match.slice(1));
      }
      return reason;
    },
    timezone: (tz: string) => tz.replace(/_/g, ' '),
  };

  const fmt = {
    date: (iso: string, tz: string) => formatDisplayDate(iso, tz, lang),
    time: (iso: string, tz: string) => formatDisplayTime(iso, tz, lang),
    timeRange: (start: string, end: string, tz: string) => formatDisplayTimeRange(start, end, tz, lang),
    shortWeekday: (iso: string, tz: string) => formatShortWeekday(iso, tz, lang),
    shortDate: (iso: string) => formatShortDate(iso, lang),
  };

  return { m, loc, fmt };
}

/** Current language, its UI strings (`m`), localized content (`loc`), and date formatters (`fmt`). */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  const helpers = useMemo(() => buildHelpers(ctx.lang), [ctx.lang]);
  return { lang: ctx.lang, setLang: ctx.setLang, ...helpers };
}
