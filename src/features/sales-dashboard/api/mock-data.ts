import type {
  ActivityEntry,
  Kpi,
  Order,
  SalesPoint,
} from '../model/types';

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function spark(seed: number, length = 24): number[] {
  return Array.from({ length }, (_, i) => {
    const trend = i * 0.04;
    const wave = Math.sin(i * 0.7 + seed) * 0.18;
    const noise = Math.sin(i * 1.7 + seed * 2) * 0.06;
    return Math.max(0.05, 0.4 + trend + wave + noise);
  });
}

export function getSalesKpisMock(): Promise<Kpi[]> {
  const kpis: Kpi[] = [
    {
      id: 'students',
      value: 124,
      trendPercent: 12.8,
      format: 'integer',
      spark: spark(0.3),
    },
    {
      id: 'profileViews',
      value: 4_812,
      trendPercent: 6.2,
      format: 'integer',
      spark: spark(1.4),
    },
    {
      id: 'productViews',
      value: 11_204,
      trendPercent: -1.4,
      format: 'integer',
      spark: spark(2.7),
    },
  ];
  return delay(kpis, 650);
}

export function getSalesSeriesMock(): Promise<{
  total: number;
  trendPercent: number;
  points: SalesPoint[];
}> {
  const points: SalesPoint[] = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const base = 280 + day * 8;
    const seasonal = Math.sin(day * 0.45) * 90;
    const noise = Math.sin(day * 1.9) * 40;
    const previousNoise = Math.sin(day * 0.6 + 1.2) * 60;
    return {
      day,
      current: Math.round(base + seasonal + noise),
      previous: Math.round(base - 150 + previousNoise),
    };
  });
  const total = Math.round(points.reduce((sum, p) => sum + p.current, 0));
  return delay({ total, trendPercent: 3.2, points }, 800);
}

const CUSTOMERS = [
  {
    id: 'c1',
    name: 'Сиенна Хьюитт',
    email: 'hi@siennahewitt.com',
    initials: 'СХ',
  },
  {
    id: 'c2',
    name: 'Аммар Фоули',
    email: 'ammarfoley@gmail.com',
    initials: 'АФ',
  },
  {
    id: 'c3',
    name: 'Пиппа Уилкинсон',
    email: 'pippa@pippaw.com',
    initials: 'ПУ',
  },
  {
    id: 'c4',
    name: 'Олли Шрёдер',
    email: 'olly_s@icloud.com',
    initials: 'ОШ',
  },
  {
    id: 'c5',
    name: 'Матильда Льюис',
    email: 'mathilde@hey.com',
    initials: 'МЛ',
  },
  {
    id: 'c6',
    name: 'Юлиус Вон',
    email: 'juliusvaughan@gmail.com',
    initials: 'ЮВ',
  },
  {
    id: 'c7',
    name: 'Заид Шварц',
    email: 'zaid@zaidstudio.com',
    initials: 'ЗШ',
  },
];

export function getOrdersMock(): Promise<Order[]> {
  const dates = [
    '2027-01-16',
    '2027-01-16',
    '2027-01-15',
    '2027-01-14',
    '2027-01-14',
    '2027-01-14',
    '2027-01-14',
  ];
  const amounts = [10_014, 9_632, 10_424, 8_848, 9_632, 10_710, 8_204];
  const ratings = [5, 4.5, 5, 5, 4.5, 5, 4];
  const orders: Order[] = CUSTOMERS.map((customer, i) => ({
    id: `o${i + 1}`,
    number: `#${26678 - i}`,
    date: dates[i]!,
    status: i === 6 ? 'refunded' : 'paid',
    amount: amounts[i]!,
    rating: ratings[i]!,
    customer: { ...customer, avatarUrl: null },
  }));
  return delay(orders, 900);
}

const ACTIVITY_CUSTOMERS = [
  { id: 'a1', name: 'Деми Уикинсон', initials: 'ДУ', online: true },
  { id: 'a2', name: 'Алия Лэйн', initials: 'АЛ' },
  { id: 'a3', name: 'Лана Штайнер', initials: 'ЛШ' },
  { id: 'a4', name: 'Кэндис Ву', initials: 'КВ' },
  { id: 'a5', name: 'Ава Райт', initials: 'АР' },
  { id: 'a6', name: 'Корай Окумус', initials: 'КО' },
  { id: 'a7', name: 'Энди Лэйн', initials: 'ЭЛ' },
  { id: 'a8', name: 'Дрю Кано', initials: 'ДК' },
  { id: 'a9', name: 'Захир Мейс', initials: 'ЗМ' },
  { id: 'a10', name: 'Рене Уэллс', initials: 'РУ' },
  { id: 'a11', name: 'Джошуа Уилсон', initials: 'ДУ', online: true },
  { id: 'a12', name: 'Лори Брайсон', initials: 'ЛБ' },
  { id: 'a13', name: 'Локи Брайт', initials: 'ЛБ' },
  { id: 'a14', name: 'Анита Круз', initials: 'АК' },
  { id: 'a15', name: 'Игнат Семёнов', initials: 'ИС' },
  { id: 'a16', name: 'Полина Захарова', initials: 'ПЗ' },
  { id: 'a17', name: 'Артём Богомолов', initials: 'АБ' },
  { id: 'a18', name: 'Мирослава Гольдберг', initials: 'МГ' },
  { id: 'a19', name: 'Ринат Каримов', initials: 'РК' },
  { id: 'a20', name: 'Светлана Илларионова', initials: 'СИ' },
  { id: 'a21', name: 'Даниил Серебряков', initials: 'ДС' },
  { id: 'a22', name: 'Юлия Воронцова', initials: 'ЮВ' },
  { id: 'a23', name: 'Богдан Ершов', initials: 'БЕ' },
  { id: 'a24', name: 'Алина Тимофеева', initials: 'АТ' },
  { id: 'a25', name: 'Михаил Ковальский', initials: 'МК', online: true },
  { id: 'a26', name: 'Виктория Голубева', initials: 'ВГ' },
  { id: 'a27', name: 'Тимур Назаров', initials: 'ТН' },
  { id: 'a28', name: 'Дарья Куликова', initials: 'ДК' },
  { id: 'a29', name: 'Степан Морозов', initials: 'СМ' },
  { id: 'a30', name: 'Алла Ткаченко', initials: 'АТ' },
  { id: 'a31', name: 'Илья Зимин', initials: 'ИЗ' },
  { id: 'a32', name: 'Карина Беляева', initials: 'КБ' },
  { id: 'a33', name: 'Эдуард Шмидт', initials: 'ЭШ' },
  { id: 'a34', name: 'Глеб Овчинников', initials: 'ГО' },
  { id: 'a35', name: 'Ева Гончарова', initials: 'ЕГ' },
  { id: 'a36', name: 'Тимофей Никитин', initials: 'ТН' },
  { id: 'a37', name: 'Маргарита Юрова', initials: 'МЮ' },
  { id: 'a38', name: 'Олег Барсуков', initials: 'ОБ' },
  { id: 'a39', name: 'Нина Виноградова', initials: 'НВ' },
  { id: 'a40', name: 'Платон Зайцев', initials: 'ПЗ' },
  { id: 'a41', name: 'Лиза Маслова', initials: 'ЛМ' },
  { id: 'a42', name: 'Святослав Гордеев', initials: 'СГ' },
  { id: 'a43', name: 'Анна Ефремова', initials: 'АЕ' },
  { id: 'a44', name: 'Тая Юнусова', initials: 'ТЮ' },
  { id: 'a45', name: 'Назар Шевченко', initials: 'НШ' },
  { id: 'a46', name: 'Алёна Калинина', initials: 'АК' },
  { id: 'a47', name: 'Кирилл Сафонов', initials: 'КС' },
  { id: 'a48', name: 'Юна Литвинова', initials: 'ЮЛ' },
  { id: 'a49', name: 'Артур Гриценко', initials: 'АГ' },
  { id: 'a50', name: 'Майя Большакова', initials: 'МБ' },
];

const ACTIVITY_PRODUCTS = [
  'Алгебра 11 класс',
  'Подготовка к ЕГЭ',
  'Геометрия с нуля',
  'Алгебра 11 класс',
  'Python для всех',
  'Подготовка к ЕГЭ',
  'Профориентация подростков',
  'Геометрия с нуля',
  'Профориентация подростков',
  'История XX века',
  'Сценарий короткого фильма',
  'Подготовка к ЕГЭ',
  'Алгебра 11 класс',
  'Профориентация подростков',
  'React для дизайнеров',
  'Алгоритмы и структуры данных',
  'Подготовка к ОГЭ',
  'История XX века',
  'Алгебра 11 класс',
  'Python для всех',
  'Сценарий короткого фильма',
  'Подготовка к ЕГЭ',
  'Геометрия с нуля',
  'Алгоритмы и структуры данных',
  'React для дизайнеров',
  'Алгебра 11 класс',
  'Подготовка к ЕГЭ',
  'Профориентация подростков',
  'История XX века',
  'Алгоритмы и структуры данных',
  'Алгебра 11 класс',
  'Подготовка к ОГЭ',
  'Геометрия с нуля',
  'Python для всех',
  'Сценарий короткого фильма',
  'История XX века',
  'Подготовка к ЕГЭ',
  'Алгоритмы и структуры данных',
  'React для дизайнеров',
  'Алгебра 11 класс',
  'Подготовка к ОГЭ',
  'Геометрия с нуля',
  'Python для всех',
  'Профориентация подростков',
  'Сценарий короткого фильма',
  'Алгебра 11 класс',
  'История XX века',
  'Подготовка к ЕГЭ',
  'Алгоритмы и структуры данных',
  'Геометрия с нуля',
];

export function getActivityFeedMock(): Promise<ActivityEntry[]> {
  const entries: ActivityEntry[] = ACTIVITY_CUSTOMERS.map((customer, i) => ({
    id: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      email: `${customer.id}@learnic.demo`,
      initials: customer.initials,
      avatarUrl: null,
      online: customer.online ?? false,
    },
    productTitle: ACTIVITY_PRODUCTS[i] ?? 'Курс',
  }));
  return delay(entries, 750);
}
