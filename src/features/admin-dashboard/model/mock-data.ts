/**
 * Remaining mock content for the admin dashboard. The metrics, side
 * stats and top-teachers list are now backed by the real API (see
 * `api/`); only the "Недавние публикации" blog rail is still
 * placeholder — there is no posts/blog backend yet. Values are
 * deterministic (fixed dates, no `Math.random` / live `Date.now()`)
 * so server and client render identically.
 */

export type RecentPost = {
  id: string;
  title: string;
  description: string;
  author: string;
  publishedAt: number;
  category: string;
  /** Deterministic seed for the brand cover placeholder in `BlogPostCard`. */
  imageSeed: string;
};

export const RECENT_POSTS: readonly RecentPost[] = [
  {
    id: 'p1',
    title: 'Создаём REST API на FastAPI',
    description:
      'Рост RESTful API породил волну инструментов для проектирования, ' +
      'тестирования и сопровождения сервисов.',
    author: 'Лана Стайнер',
    publishedAt: Date.UTC(2027, 0, 18),
    category: 'Backend',
    imageSeed: 'fastapi-rest',
  },
  {
    id: 'p2',
    title: 'Совместная работа над дизайном',
    description:
      'Командная работа делает продукт сильнее, а решения каждого ' +
      'дизайнера — точнее и осознаннее.',
    author: 'Натали Крейг',
    publishedAt: Date.UTC(2027, 0, 14),
    category: 'Дизайн',
    imageSeed: 'design-collab',
  },
  {
    id: 'p3',
    title: 'Оптимизация рендеринга в React',
    description:
      'Где на самом деле тормозит интерфейс и как мемоизация, ' +
      'виртуализация и Server Components меняют картину.',
    author: 'Орландо Диггс',
    publishedAt: Date.UTC(2027, 0, 9),
    category: 'Frontend',
    imageSeed: 'react-perf',
  },
  {
    id: 'p4',
    title: 'Как мы перестроили онбординг',
    description:
      'Снизили отток на первой неделе: меньше шагов и больше ' +
      'подсказок в нужный момент.',
    author: 'Кейт Моррисон',
    publishedAt: Date.UTC(2027, 0, 4),
    category: 'Продукт',
    imageSeed: 'onboarding-flow',
  },
  {
    id: 'p5',
    title: 'CI/CD без боли: наш путь',
    description:
      'От ручных деплоев к автоматическим релизам — какие шаги ' +
      'дали больше всего стабильности.',
    author: 'Дрю Кано',
    publishedAt: Date.UTC(2026, 11, 28),
    category: 'DevOps',
    imageSeed: 'cicd-pipeline',
  },
];
