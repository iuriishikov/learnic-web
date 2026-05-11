'use client';

import { ExperienceCard, type UserExperience } from '@/features/user-experiences';

/**
 * Mock fixtures that exercise the four interesting shape combinations
 * of the card: with/without an icon URL, with/without a description
 * subtitle, ongoing vs. closed period, and with/without a source link.
 *
 * `iconUrl` references `picsum.photos` — a public placeholder service
 * — so the demo works without hitting the real S3 storage. When the
 * cards render against real data the URLs come from presigned S3 GETs
 * resolved server-side in `listUserExperiencesAction`.
 */
const SAMPLES: UserExperience[] = [
  {
    id: 'demo-1',
    userId: 'demo-user',
    title: 'Lead Product Designer',
    description: 'Polymath',
    startDate: '2020-05-01',
    endDate: null,
    sourceUrl: 'https://example.com/polymath',
    iconUrl: 'https://picsum.photos/seed/polymath/200',
  },
  {
    id: 'demo-2',
    userId: 'demo-user',
    title: 'Product Designer',
    description: 'Spherule',
    startDate: '2018-01-01',
    endDate: '2020-05-01',
    sourceUrl: 'https://example.com/spherule/editor',
    iconUrl: 'https://picsum.photos/seed/spherule/200',
  },
  {
    id: 'demo-3',
    userId: 'demo-user',
    title: 'MSc Human-Computer Interaction',
    description: 'University of Cambridge',
    startDate: '2016-09-01',
    endDate: '2018-06-01',
    sourceUrl: null,
    iconUrl: null,
  },
  {
    id: 'demo-4',
    userId: 'demo-user',
    title: 'Freelance designer',
    description: null,
    startDate: '2015-03-01',
    endDate: '2016-08-01',
    sourceUrl: 'https://example.com/portfolio',
    iconUrl: null,
  },
];

export function UserExperiencesDemoView() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 md:py-16">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Demo
        </p>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          ExperienceCard
        </h1>
        <p className="text-sm text-muted-foreground">
          Карточка опыта в четырёх типичных состояниях: с иконкой и без, с
          описанием и без, текущая позиция (Present) и завершённая, со ссылкой
          и без.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLES.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} />
        ))}
      </div>
    </main>
  );
}
