import { ButtonLink } from '@/components/ui/Button';
import { DraftLabel } from '@/components/ui/Badge';
import { useI18n } from '@/i18n/useI18n';

export function FaqPage() {
  const { m, loc } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-serif text-2xl font-medium tracking-tight text-co-ink sm:text-3xl">{m.faq.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-co-muted">{m.faq.intro}</p>

      <nav aria-label={m.faq.sectionsLabel} className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {loc.faqSections.map((section) => (
          <a
            key={section.id}
            href={`#faq-${section.id}`}
            className="whitespace-nowrap rounded-full border border-co-line bg-co-paper px-4 py-2 text-xs font-medium text-co-ink hover:border-co-orange-dark"
          >
            {section.title}
          </a>
        ))}
      </nav>

      {loc.faqSections.map((section) => (
        <section key={section.id} id={`faq-${section.id}`} className="mt-10 scroll-mt-6" aria-labelledby={`faq-${section.id}-title`}>
          <h2 id={`faq-${section.id}-title`} className="font-serif text-xl font-medium tracking-tight text-co-ink">
            {section.title}
          </h2>
          <div className="mt-4 divide-y divide-co-line rounded-co-lg border border-co-line bg-co-paper">
            {section.items.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium text-co-ink">
                  {item.question}
                  <span aria-hidden="true" className="mt-0.5 text-co-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-co-muted">{item.answer}</p>
                {item.status === 'proposed' && (
                  <div className="mt-3">
                    <DraftLabel>{m.faq.needsConfirmation}</DraftLabel>
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-12 flex flex-col gap-3 rounded-co-lg border border-co-line bg-co-pale/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-co-ink">{m.faq.ctaBody}</p>
        <ButtonLink to="/book?course=trial-lesson" variant="primary" size="sm">
          {m.faq.cta}
        </ButtonLink>
      </div>
    </div>
  );
}
