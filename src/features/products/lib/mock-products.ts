import type { Product } from '../model/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p_001',
    type: 'course',
    title: 'Дизайн-система с нуля',
    description:
      'Десять модулей о токенах, компонентах и документации — от Figma до production-ready кода.',
    status: 'published',
    studentsCount: 1248,
    lessonsCount: 32,
    durationMinutes: 540,
    updatedAt: '2026-04-22T09:30:00.000Z',
    coverHue: 265,
  },
  {
    id: 'p_002',
    type: 'webinar',
    title: 'Как нанимать сильных продактов в 2026',
    description:
      'Открытый разговор с лидами найма Linear, Notion и Vercel. Один час — три фреймворка собеседований.',
    status: 'published',
    studentsCount: 412,
    durationMinutes: 75,
    scheduledAt: '2026-05-14T17:00:00.000Z',
    updatedAt: '2026-04-28T14:10:00.000Z',
    coverHue: 220,
  },
  {
    id: 'p_003',
    type: 'course',
    title: 'TypeScript для архитекторов',
    description:
      'Продвинутые типы, conditional inference, generic constraints и DX больших монорепо.',
    status: 'draft',
    studentsCount: 0,
    lessonsCount: 18,
    durationMinutes: 360,
    updatedAt: '2026-04-29T18:45:00.000Z',
    coverHue: 160,
  },
  {
    id: 'p_004',
    type: 'webinar',
    title: 'AI-инструменты для маркетологов',
    description:
      'Живая демонстрация воркфлоу: контент-план, креативы и A/B-тесты за час с одной командой.',
    status: 'draft',
    studentsCount: 0,
    durationMinutes: 60,
    scheduledAt: '2026-05-21T15:00:00.000Z',
    updatedAt: '2026-04-30T11:15:00.000Z',
    coverHue: 30,
  },
  {
    id: 'p_005',
    type: 'course',
    title: 'Микросервисы на Go',
    description:
      'Разбор проды: gRPC, observability, миграции и graceful shutdown. С реальным репозиторием.',
    status: 'published',
    studentsCount: 583,
    lessonsCount: 24,
    durationMinutes: 480,
    updatedAt: '2026-04-15T08:00:00.000Z',
    coverHue: 195,
  },
  {
    id: 'p_006',
    type: 'webinar',
    title: 'Бренд-стратегия за один спринт',
    description:
      'Воркшоп по позиционированию: канвас, упражнения и обратная связь от практикующего бренд-стратега.',
    status: 'archived',
    studentsCount: 96,
    durationMinutes: 90,
    scheduledAt: '2026-02-04T16:00:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z',
    coverHue: 340,
  },
];
