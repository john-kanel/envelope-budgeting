import { formatCurrency } from "@/lib/money";

export type ExpenseCategorySlice = {
  categoryId: string;
  categoryName: string;
  amountCents: number;
  percent: number;
};

const SLICE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ca8a04",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#4f46e5",
  "#059669",
  "#be185d",
];

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

function slicePath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  sweepAngle: number,
) {
  if (sweepAngle >= 359.99) {
    return [
      `M ${cx} ${cy - outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy - outerRadius}`,
      `M ${cx} ${cy - innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy + innerRadius}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${cx} ${cy - innerRadius}`,
      "Z",
    ].join(" ");
  }

  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle + sweepAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle + sweepAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

type ExpenseCategoryPieChartProps = {
  slices: ExpenseCategorySlice[];
  totalCents: number;
};

export function ExpenseCategoryPieChart({
  slices,
  totalCents,
}: ExpenseCategoryPieChartProps) {
  if (totalCents <= 0 || slices.length === 0) {
    return (
      <p className="rounded-md bg-zinc-100 p-3 text-sm text-zinc-600">
        No expenses this month to chart yet.
      </p>
    );
  }

  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 90;
  const innerRadius = 58;

  const chartSlices = slices.reduce<
    Array<ExpenseCategorySlice & { path: string; color: string; endAngle: number }>
  >((acc, slice, index) => {
    const startAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sweepAngle = (slice.amountCents / totalCents) * 360;
    const endAngle = startAngle + sweepAngle;

    acc.push({
      ...slice,
      endAngle,
      path: slicePath(cx, cy, innerRadius, radius, startAngle, sweepAngle),
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    });

    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-48 w-48"
          role="img"
          aria-label="Expense breakdown by category"
        >
          {chartSlices.map((slice) => (
              <path
                key={slice.categoryId}
                d={slice.path}
                fill={slice.color}
              />
            ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCurrency(totalCents)}
          </p>
        </div>
      </div>

      <ul className="w-full space-y-2 text-sm">
        {slices.map((slice, index) => (
          <li
            key={slice.categoryId}
            className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 px-2 py-1.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              />
              <span className="truncate text-zinc-800">{slice.categoryName}</span>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-medium text-zinc-900">
                {formatCurrency(slice.amountCents)}
              </p>
              <p className="text-xs text-zinc-500">{slice.percent.toFixed(1)}%</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function buildExpenseCategorySlices(
  expenses: Array<{ categoryId: string; category: { name: string }; amountCents: number }>,
): { slices: ExpenseCategorySlice[]; totalCents: number } {
  const totalsByCategory = new Map<
    string,
    { categoryName: string; amountCents: number }
  >();

  for (const expense of expenses) {
    const existing = totalsByCategory.get(expense.categoryId);
    if (existing) {
      existing.amountCents += expense.amountCents;
    } else {
      totalsByCategory.set(expense.categoryId, {
        categoryName: expense.category.name,
        amountCents: expense.amountCents,
      });
    }
  }

  const totalCents = expenses.reduce((sum, item) => sum + item.amountCents, 0);

  const slices = [...totalsByCategory.entries()]
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.categoryName,
      amountCents: data.amountCents,
      percent: totalCents > 0 ? (data.amountCents / totalCents) * 100 : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return { slices, totalCents };
}
