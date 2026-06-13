/**
 * Self-contained demo content for the landing-hero note reader showcase
 * ({@link import('./note-reader-demo-view').NoteReaderDemoView}). A full,
 * realistic «Математический анализ с нуля» note — modules, lessons and
 * renderable blocks — kept entirely offline so the showcase paints without a
 * backend, an enrollment or a network round-trip. This is mock CONTENT (the
 * design target is `/ru`), not product UI copy, so the Russian strings live
 * here as data rather than in a next-intl namespace — same as every other
 * `*-demo` surface in the app.
 *
 * The shapes mirror exactly what the real reader receives from
 * `GET /notes/{id}/scheme` + `GET /notes/{id}/release-lessons/{id}`, so the
 * showcase reuses the production `ProductReaderNav` + `LessonBlockViewer`
 * verbatim — what you screenshot here is what a learner actually sees.
 */

import type { FunctionGraphConfig } from '../model/draft';
import type { PublicLessonBlock } from '../model/public-content';
import type { PublicNoteScheme } from '../model/public-scheme';
import type { Product } from '../model/types';

/* -------------------------------------------------------------------------- */
/* Authoring shape — flattened into a scheme + per-lesson block map below.    */
/* -------------------------------------------------------------------------- */

type DemoLesson = {
  id: string;
  title: string;
  blocks: PublicLessonBlock[];
};

type DemoModule = {
  id: string;
  title: string;
  description: string | null;
  lessons: DemoLesson[];
};

/* -------------------------------------------------------------------------- */
/* Function-graph specs (camelCase `GraphSpec` + the interactive flag).       */
/* -------------------------------------------------------------------------- */

// Hero of the open lesson: a draggable point A sweeps the parabola
// f(x) = ¼x² + 1 while its tangent line rotates. Tangent at x = a is
// y = f(a) + f'(a)(x − a) = 0.5·a·x − 0.25·a² + 1 (f'(a) = ½a).
const TANGENT_GRAPH: FunctionGraphConfig = {
  interactive: true,
  viewport: { xMin: -5.5, xMax: 5.5, yMin: -1.5, yMax: 8.5 },
  axes: { showX: true, showY: true, showGrid: true, xLabel: 'x', yLabel: 'y' },
  parameters: [{ name: 'a', min: -5, max: 5, step: 0.5, value: 2 }],
  objects: [
    {
      kind: 'function',
      expr: '0.25*x^2 + 1',
      label: 'f(x) = ¼x² + 1',
      style: { color: 'brand', width: 2.5 },
    },
    {
      kind: 'function',
      expr: '0.5*a*x - 0.25*a^2 + 1',
      label: 'касательная',
      style: { color: 'foreground', width: 2 },
    },
    {
      kind: 'verticalLine',
      x: 'a',
      style: { color: 'muted-foreground', dash: 'dashed' },
    },
    {
      kind: 'point',
      x: 'a',
      y: '0.25*a^2 + 1',
      label: 'A',
      style: { color: 'destructive', width: 3 },
    },
  ],
};

// First-limit intuition: sin(x)/x → 1 as x → 0 (removable hole marked).
const SINC_GRAPH: FunctionGraphConfig = {
  interactive: false,
  viewport: { xMin: -10, xMax: 10, yMin: -0.45, yMax: 1.3 },
  axes: { showX: true, showY: true, showGrid: true, xLabel: 'x', yLabel: 'y' },
  objects: [
    {
      kind: 'function',
      expr: 'sin(x)/x',
      label: 'sin(x) / x',
      style: { color: 'brand', width: 2.5 },
    },
    {
      kind: 'point',
      x: 0,
      y: 1,
      label: '→ 1',
      style: { color: 'destructive', width: 3 },
    },
  ],
};

// Tangent + normal to y = x² at M(1, 1): tangent y = 2x − 1, normal y = −½x + 3⁄2.
const TANGENT_NORMAL_GRAPH: FunctionGraphConfig = {
  interactive: false,
  viewport: { xMin: -1, xMax: 4, yMin: -1.5, yMax: 5 },
  axes: { showX: true, showY: true, showGrid: true, xLabel: 'x', yLabel: 'y' },
  objects: [
    {
      kind: 'function',
      expr: 'x^2',
      label: 'y = x²',
      style: { color: 'brand', width: 2.5 },
    },
    {
      kind: 'function',
      expr: '2*x - 1',
      label: 'касательная',
      style: { color: 'foreground', width: 2 },
    },
    {
      kind: 'function',
      expr: '-0.5*x + 1.5',
      label: 'нормаль',
      style: { color: 'destructive', width: 2, dash: 'dashed' },
    },
    {
      kind: 'point',
      x: 1,
      y: 1,
      label: 'M',
      style: { color: 'destructive', width: 3 },
    },
  ],
};

// Definite integral as area under y = ⅓x² + ½ on [1, 4].
const INTEGRAL_GRAPH: FunctionGraphConfig = {
  interactive: false,
  viewport: { xMin: -0.5, xMax: 4.8, yMin: -0.5, yMax: 6 },
  axes: { showX: true, showY: true, showGrid: true, xLabel: 'x', yLabel: 'y' },
  objects: [
    {
      kind: 'function',
      expr: '0.333*x^2 + 0.5',
      label: 'y = f(x)',
      style: { color: 'brand', width: 2.5 },
    },
    {
      kind: 'verticalLine',
      x: 1,
      label: 'a',
      style: { color: 'muted-foreground', dash: 'dashed' },
    },
    {
      kind: 'verticalLine',
      x: 4,
      label: 'b',
      style: { color: 'muted-foreground', dash: 'dashed' },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* The note — modules → lessons → blocks.                                     */
/* -------------------------------------------------------------------------- */

const MODULES: DemoModule[] = [
  {
    id: 'm1',
    title: 'Пределы и непрерывность',
    description: 'Язык, на котором говорит весь анализ.',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Что такое предел',
        blocks: [
          {
            type: 'html',
            id: 'm1-l1-b1',
            position: 0,
            html: '<p>Предел — это значение, к которому функция <em>стремится</em>, когда аргумент подходит к некоторой точке, но не обязательно её достигает. Запись <code>lim f(x) = L</code> читается так: «чем ближе <code>x</code> к <code>a</code>, тем ближе <code>f(x)</code> к числу <code>L</code>».</p>',
          },
          {
            type: 'katex',
            id: 'm1-l1-b2',
            position: 1,
            source: '\\lim_{x \\to a} f(x) = L',
          },
          {
            type: 'html',
            id: 'm1-l1-b3',
            position: 2,
            html: '<p>Классический пример — отношение <code>sin(x)/x</code>. В самой точке <code>x = 0</code> оно не определено (получается <code>0/0</code>), но по обе стороны от нуля функция уверенно подбирается к единице.</p>',
          },
          {
            type: 'function_graph',
            id: 'm1-l1-b4',
            position: 3,
            config: SINC_GRAPH,
          },
          {
            type: 'html',
            id: 'm1-l1-b5',
            position: 4,
            html: '<blockquote>«Дырку» в графике глаз не замечает — а предел её и не требует. Важно только поведение функции <em>рядом</em> с точкой.</blockquote>',
          },
        ],
      },
      {
        id: 'm1-l2',
        title: 'Замечательные пределы',
        blocks: [
          {
            type: 'html',
            id: 'm1-l2-b1',
            position: 0,
            html: '<p>Два предела встречаются в задачах так часто, что их называют <strong>замечательными</strong> и просто запоминают. Первый связывает синус с его аргументом, второй задаёт число <code>e</code> — основание натурального логарифма.</p>',
          },
          {
            type: 'katex',
            id: 'm1-l2-b2',
            position: 1,
            source:
              '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1 \\qquad \\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^{x} = e',
          },
          {
            type: 'html',
            id: 'm1-l2-b3',
            position: 2,
            html: '<p>Из первого предела выводятся производные тригонометрических функций, из второго — производная экспоненты. Так что эти две формулы — фундамент следующего модуля.</p>',
          },
        ],
      },
      {
        id: 'm1-l3',
        title: 'Непрерывность функции',
        blocks: [
          {
            type: 'html',
            id: 'm1-l3-b1',
            position: 0,
            html: '<p>Функция <strong>непрерывна</strong> в точке, если её график можно нарисовать, не отрывая карандаша: предел в точке существует и совпадает со значением функции.</p>',
          },
          {
            type: 'katex',
            id: 'm1-l3-b2',
            position: 1,
            source: '\\lim_{x \\to a} f(x) = f(a)',
          },
        ],
      },
    ],
  },
  {
    id: 'm2',
    title: 'Производная функции',
    description: 'Скорость изменения — главное понятие анализа.',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Определение производной',
        blocks: [
          {
            type: 'html',
            id: 'm2-l1-b1',
            position: 0,
            html: '<p>Производная отвечает на вопрос «<strong>как быстро меняется функция</strong>». Берём приращение аргумента <code>Δx</code>, смотрим, насколько изменилось значение <code>Δf</code>, и устремляем шаг к нулю.</p>',
          },
          {
            type: 'katex',
            id: 'm2-l1-b2',
            position: 1,
            source:
              "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x}",
          },
          {
            type: 'html',
            id: 'm2-l1-b3',
            position: 2,
            html: '<p>Проверим на параболе <code>f(x) = x²</code>. Подставляем в определение и раскрываем квадрат:</p>',
          },
          {
            type: 'katex',
            id: 'm2-l1-b4',
            position: 3,
            source:
              "\\left(x^2\\right)' = \\lim_{\\Delta x \\to 0} \\frac{(x + \\Delta x)^2 - x^2}{\\Delta x} = \\lim_{\\Delta x \\to 0} (2x + \\Delta x) = 2x",
          },
          {
            type: 'html',
            id: 'm2-l1-b5',
            position: 4,
            html: '<p>Готово: производная функции <code>x²</code> равна <code>2x</code>. Тем же приёмом выводится вся таблица производных.</p>',
          },
        ],
      },
      {
        id: 'm2-l2',
        title: 'Геометрический смысл производной',
        blocks: [
          {
            type: 'html',
            id: 'm2-l2-b1',
            position: 0,
            html: '<p>Производная в точке — это не абстрактная формула, а наглядная величина: <strong>она равна угловому коэффициенту касательной</strong> к графику функции. Понять это один раз — и весь дифференциальный анализ становится интуитивным.</p>',
          },
          {
            type: 'katex',
            id: 'm2-l2-b2',
            position: 1,
            source:
              "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x} = \\tan\\alpha = k",
          },
          {
            type: 'html',
            id: 'm2-l2-b3',
            position: 2,
            html: '<p>Потяните ползунок <code>a</code> и проведите точку <strong>A</strong> вдоль параболы. Касательная поворачивается, а её наклон в каждой точке равен <code>f′(a) = ½a</code>.</p>',
          },
          {
            type: 'function_graph',
            id: 'm2-l2-b4',
            position: 3,
            config: TANGENT_GRAPH,
          },
          {
            type: 'html',
            id: 'm2-l2-b5',
            position: 4,
            html: '<h3>От секущей к касательной</h3><p>Возьмём на графике две точки и проведём через них <em>секущую</em>. Сближая точки, мы поворачиваем секущую — и в пределе она превращается в <em>касательную</em>, наклон которой и есть значение производной. На графике это видно сразу:</p><ul><li>график идёт <strong>вверх</strong> — касательная наклонена вправо, <code>f′ &gt; 0</code>;</li><li>в нижней точке параболы касательная <strong>горизонтальна</strong>, <code>f′ = 0</code>;</li><li>график идёт <strong>вниз</strong> — касательная наклонена влево, <code>f′ &lt; 0</code>.</li></ul><p>Знак производной задаёт направление, а её величина — крутизну подъёма. Тот же расчёт легко проверить численно и символьно:</p>',
          },
          {
            type: 'code',
            id: 'm2-l2-b6',
            position: 5,
            tabs: [
              {
                label: 'Численно',
                language: 'python',
                source:
                  'def derivative(f, x, h=1e-6):\n    """Производная по определению — центральная разность."""\n    return (f(x + h) - f(x - h)) / (2 * h)\n\n\nf = lambda x: 0.25 * x**2 + 1\nfor a in (-2, 0, 2, 4):\n    print(f"f\'({a:>2}) = {derivative(f, a): .2f}")\n\n# f\'(-2) = -1.00   f\'( 0) =  0.00\n# f\'( 2) =  1.00   f\'( 4) =  2.00   →  ровно ½·a',
              },
              {
                label: 'Символьно',
                language: 'python',
                source:
                  'import sympy as sp\n\nx = sp.symbols("x")\nf = sp.Rational(1, 4) * x**2 + 1\n\nf_prime = sp.diff(f, x)\nprint(f_prime)             # x/2\nprint(f_prime.subs(x, 4))  # 2  →  наклон касательной в точке x = 4',
              },
            ],
          },
          {
            type: 'html',
            id: 'm2-l2-b7',
            position: 6,
            html: '<p><strong>Проверьте себя.</strong> Чему равна производная функции <code>f(x) = ¼x² + 1</code> в точке <code>x = 4</code>?</p>',
          },
          {
            type: 'single_choice',
            id: 'm2-l2-b8',
            position: 7,
            options: [
              { oid: 'm2-l2-b8-o1', label: '0' },
              { oid: 'm2-l2-b8-o2', label: '2' },
              { oid: 'm2-l2-b8-o3', label: '4' },
              { oid: 'm2-l2-b8-o4', label: '8' },
            ],
          },
        ],
      },
      {
        id: 'm2-l3',
        title: 'Таблица производных',
        blocks: [
          {
            type: 'html',
            id: 'm2-l3-b1',
            position: 0,
            html: '<p>Каждую из этих формул можно вывести из определения, но в работе их просто держат под рукой. Восемь строк закрывают почти все школьные и вузовские задачи на дифференцирование.</p>',
          },
          {
            type: 'katex',
            id: 'm2-l3-b2',
            position: 1,
            source:
              "\\begin{array}{ll} (c)' = 0 & (\\sin x)' = \\cos x \\\\[4pt] \\left(x^n\\right)' = n\\,x^{n-1} & (\\cos x)' = -\\sin x \\\\[4pt] \\left(e^x\\right)' = e^x & (\\tan x)' = \\dfrac{1}{\\cos^2 x} \\\\[4pt] (\\ln x)' = \\dfrac{1}{x} & \\left(a^x\\right)' = a^x \\ln a \\end{array}",
          },
          {
            type: 'html',
            id: 'm2-l3-b3',
            position: 2,
            html: '<p>Слева — степенные и логарифмические функции, справа — тригонометрия и показательные. Вместе с правилами дифференцирования из следующего урока этого достаточно, чтобы взять производную почти от чего угодно.</p>',
          },
        ],
      },
      {
        id: 'm2-l4',
        title: 'Правила дифференцирования',
        blocks: [
          {
            type: 'html',
            id: 'm2-l4-b1',
            position: 0,
            html: '<p>Производная суммы, произведения и частного подчиняется трём правилам. Самое коварное — производная произведения: это <strong>не</strong> произведение производных.</p>',
          },
          {
            type: 'katex',
            id: 'm2-l4-b2',
            position: 1,
            source:
              "(u \\pm v)' = u' \\pm v' \\qquad (uv)' = u'v + uv' \\qquad \\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}",
          },
          {
            type: 'html',
            id: 'm2-l4-b3',
            position: 2,
            html: '<p>Эти правила удобно проверять символьными вычислениями — машина не ошибётся в знаке:</p>',
          },
          {
            type: 'code',
            id: 'm2-l4-b4',
            position: 3,
            tabs: [
              {
                label: 'sympy',
                language: 'python',
                source:
                  'import sympy as sp\n\nx = sp.symbols("x")\n\n# Правило произведения:  (x²·sin x)\'\nprint(sp.diff(x**2 * sp.sin(x), x))\n# x**2*cos(x) + 2*x*sin(x)\n\n# Правило частного:  (x² / cos x)\'\nprint(sp.diff(x**2 / sp.cos(x), x))',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'm3',
    title: 'Приложения производной',
    description: 'От формул к исследованию функций.',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Касательная и нормаль',
        blocks: [
          {
            type: 'html',
            id: 'm3-l1-b1',
            position: 0,
            html: '<p>Зная производную, можно мгновенно написать уравнение касательной в любой точке графика. Прямая, перпендикулярная касательной, называется <strong>нормалью</strong>.</p>',
          },
          {
            type: 'katex',
            id: 'm3-l1-b2',
            position: 1,
            source: "y = f(x_0) + f'(x_0)\\,(x - x_0)",
          },
          {
            type: 'html',
            id: 'm3-l1-b3',
            position: 2,
            html: '<p>Для <code>y = x²</code> в точке <code>M(1, 1)</code>: <code>f′(1) = 2</code>, поэтому касательная — <code>y = 2x − 1</code>, а нормаль с наклоном <code>−½</code> — <code>y = −½x + 3⁄2</code>.</p>',
          },
          {
            type: 'function_graph',
            id: 'm3-l1-b4',
            position: 3,
            config: TANGENT_NORMAL_GRAPH,
          },
        ],
      },
      {
        id: 'm3-l2',
        title: 'Возрастание и убывание',
        blocks: [
          {
            type: 'html',
            id: 'm3-l2-b1',
            position: 0,
            html: '<p>Знак производной полностью определяет, куда идёт функция: где <code>f′ &gt; 0</code> — функция растёт, где <code>f′ &lt; 0</code> — убывает.</p>',
          },
          {
            type: 'katex',
            id: 'm3-l2-b2',
            position: 1,
            source:
              "f'(x) > 0 \\;\\Rightarrow\\; f \\nearrow \\qquad f'(x) < 0 \\;\\Rightarrow\\; f \\searrow",
          },
        ],
      },
      {
        id: 'm3-l3',
        title: 'Экстремумы функции',
        blocks: [
          {
            type: 'html',
            id: 'm3-l3-b1',
            position: 0,
            html: '<p>В точках максимума и минимума касательная горизонтальна, то есть производная обращается в ноль. Но одного равенства мало — нужно, чтобы производная <strong>меняла знак</strong>.</p>',
          },
          {
            type: 'katex',
            id: 'm3-l3-b2',
            position: 1,
            source:
              "f'(x_0) = 0 \\;\\text{ и } f' \\text{ меняет знак при переходе через } x_0",
          },
        ],
      },
    ],
  },
  {
    id: 'm4',
    title: 'Интеграл',
    description: 'Обратная операция к дифференцированию.',
    lessons: [
      {
        id: 'm4-l1',
        title: 'Первообразная',
        blocks: [
          {
            type: 'html',
            id: 'm4-l1-b1',
            position: 0,
            html: '<p>Интегрирование — это дифференцирование наоборот. <strong>Первообразная</strong> <code>F(x)</code> — это функция, производная которой равна исходной <code>f(x)</code>. Постоянная <code>C</code> появляется потому, что производная константы равна нулю.</p>',
          },
          {
            type: 'katex',
            id: 'm4-l1-b2',
            position: 1,
            source: "\\int f(x)\\,dx = F(x) + C, \\qquad F'(x) = f(x)",
          },
        ],
      },
      {
        id: 'm4-l2',
        title: 'Определённый интеграл',
        blocks: [
          {
            type: 'html',
            id: 'm4-l2-b1',
            position: 0,
            html: '<p>Определённый интеграл — это <strong>площадь</strong> криволинейной трапеции под графиком на отрезке <code>[a, b]</code>. Считается он через первообразную по формуле Ньютона — Лейбница.</p>',
          },
          {
            type: 'katex',
            id: 'm4-l2-b2',
            position: 1,
            source: '\\int_a^b f(x)\\,dx = F(b) - F(a)',
          },
          {
            type: 'function_graph',
            id: 'm4-l2-b3',
            position: 2,
            config: INTEGRAL_GRAPH,
          },
        ],
      },
      {
        id: 'm4-l3',
        title: 'Площадь под графиком',
        blocks: [
          {
            type: 'html',
            id: 'm4-l3-b1',
            position: 0,
            html: '<p>Если функция на отрезке принимает отрицательные значения, интеграл считает площадь со знаком. Чтобы получить «геометрическую» площадь, область разбивают на части по точкам пересечения с осью и складывают модули.</p>',
          },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Derived structures consumed by the view.                                   */
/* -------------------------------------------------------------------------- */

/** Structure-only tree for the production `ProductReaderNav`. */
export const DEMO_SCHEME: PublicNoteScheme = {
  noteId: 'demo-note',
  releaseId: 'demo-release',
  modules: MODULES.map((module, mIndex) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    position: mIndex,
    lessons: module.lessons.map((lesson, lIndex) => ({
      id: lesson.id,
      title: lesson.title,
      position: lIndex,
      blockCount: lesson.blocks.length,
    })),
  })),
};

/** Lesson id → renderable blocks, looked up as the learner navigates. */
export const DEMO_LESSON_BLOCKS: Record<string, PublicLessonBlock[]> =
  Object.fromEntries(
    MODULES.flatMap((module) =>
      module.lessons.map((lesson) => [lesson.id, lesson.blocks] as const),
    ),
  );

/** Opening lesson — «Геометрический смысл производной», the screenshot hero. */
export const DEMO_INITIAL_LESSON_ID = 'm2-l2';

export const DEMO_PRODUCT: Product = {
  id: 'demo-note',
  type: 'note',
  status: 'published',
  visibility: 'public',
  title: 'Математический анализ с нуля',
  description:
    'От первого предела до определённого интеграла — наглядно, с интерактивными графиками и разбором каждой формулы.',
  durationHours: 24,
  priceAmount: null,
  author: {
    id: 'demo-author',
    fullName: 'Соколова Анна Дмитриевна',
    email: 'a*****a@learnic.ru',
  },
  cover: {
    oid: 'demo-cover',
    contentType: 'image/svg+xml',
    sizeBytes: 0,
    url: '/demo/calculus-cover.svg',
  },
  tags: [],
  publishedAt: '2026-02-01T09:00:00.000Z',
  createdAt: '2026-01-10T09:00:00.000Z',
  updatedAt: '2026-02-01T09:00:00.000Z',
};
