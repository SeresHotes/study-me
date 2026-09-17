import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

// Общие размеры и отступы графиков.
const H = 180;
const PAD = { l: 38, r: 12, t: 12, b: 22 };

/** Ширина контейнера через ResizeObserver — координаты считаем в пикселях 1:1. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

interface TipState {
  left: number;
  top: number;
  lines: string[];
}

function Tooltip({ tip, width }: { tip: TipState | null; width: number }) {
  if (!tip) return null;
  const clampedLeft = Math.min(Math.max(tip.left, 4), Math.max(4, width - 120));
  return (
    <div className="chart-tip" style={{ left: clampedLeft, top: tip.top }}>
      {tip.lines.map((l, i) => (
        <div key={i} className={i === 0 ? 'chart-tip-head' : ''}>
          {l}
        </div>
      ))}
    </div>
  );
}

function ticks(min: number, max: number): number[] {
  if (min === max) return [min];
  return [min, (min + max) / 2, max];
}

// ---- Линейный график (шкала / число) ----

export function LineChart({
  points,
  color,
  yMin,
  yMax,
  fmtV,
  fmtDate,
  fmtTip,
}: {
  points: { t: number; v: number }[];
  color: string;
  yMin: number;
  yMax: number;
  fmtV: (n: number) => string;
  fmtDate: (t: number) => string;
  fmtTip: (t: number) => string;
}) {
  const [ref, w] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(1, w - PAD.l - PAD.r);
  const innerH = H - PAD.t - PAD.b;
  const tMin = points.length ? points[0].t : 0;
  const tMax = points.length ? points[points.length - 1].t : 1;
  const span = tMax - tMin || 1;
  const range = yMax - yMin || 1;

  const xOf = (t: number) => PAD.l + (points.length <= 1 ? innerW / 2 : ((t - tMin) / span) * innerW);
  const yOf = (v: number) => PAD.t + (1 - (v - yMin) / range) * innerH;

  const coords = points.map((p) => ({ x: xOf(p.t), y: yOf(p.v), p }));
  const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const area =
    coords.length > 0
      ? `${line} L${coords[coords.length - 1].x.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L${coords[0].x.toFixed(1)} ${(PAD.t + innerH).toFixed(1)} Z`
      : '';

  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!coords.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0;
    for (let i = 1; i < coords.length; i++) {
      if (Math.abs(coords[i].x - mx) < Math.abs(coords[best].x - mx)) best = i;
    }
    setActive(best);
  }

  const tip: TipState | null =
    active !== null && coords[active]
      ? {
          left: coords[active].x - 50,
          top: Math.max(0, coords[active].y - 44),
          lines: [fmtV(coords[active].p.v), fmtTip(coords[active].p.t)],
        }
      : null;

  return (
    <div className="chart" ref={ref}>
      {w > 0 && (
        <svg
          width={w}
          height={H}
          onPointerMove={onMove}
          onPointerLeave={() => setActive(null)}
        >
          {ticks(yMin, yMax).map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={PAD.l} x2={w - PAD.r} y1={yOf(v)} y2={yOf(v)} />
              <text className="chart-axis" x={PAD.l - 6} y={yOf(v) + 3} textAnchor="end">
                {fmtV(v)}
              </text>
            </g>
          ))}
          {(tMax > tMin ? [tMin, (tMin + tMax) / 2, tMax] : [tMin]).map((t, i, arr) => (
            <text
              key={i}
              className="chart-axis"
              x={xOf(t)}
              y={H - 6}
              textAnchor={arr.length === 1 ? 'middle' : i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
            >
              {fmtDate(t)}
            </text>
          ))}

          {area && <path d={area} fill={color} fillOpacity={0.14} />}
          {line && (
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}

          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r={4}
              fill={color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          )}

          {active !== null && coords[active] && (
            <>
              <line
                className="chart-crosshair"
                x1={coords[active].x}
                x2={coords[active].x}
                y1={PAD.t}
                y2={PAD.t + innerH}
              />
              <circle cx={coords[active].x} cy={coords[active].y} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      <Tooltip tip={tip} width={w} />
    </div>
  );
}

// ---- Столбчатый график (частота bool по дням) ----

export function BarChart({
  bars,
  color,
  fmtV,
}: {
  bars: { label: string; value: number; full: string }[];
  color: string;
  fmtV: (n: number) => string;
}) {
  const [ref, w] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(1, w - PAD.l - PAD.r);
  const innerH = H - PAD.t - PAD.b;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const yTicks = ticks(0, max).map((v) => Math.round(v));

  const gap = bars.length > 40 ? 1 : 2;
  const slot = innerW / Math.max(1, bars.length);
  const barW = Math.max(1, slot - gap);
  const yOf = (v: number) => PAD.t + (1 - v / max) * innerH;
  const labelStep = Math.ceil(bars.length / 6);

  const tip: TipState | null =
    active !== null && bars[active]
      ? {
          left: PAD.l + active * slot - 40,
          top: Math.max(0, yOf(bars[active].value) - 44),
          lines: [`${fmtV(bars[active].value)}`, bars[active].full],
        }
      : null;

  return (
    <div className="chart" ref={ref}>
      {w > 0 && (
        <svg width={w} height={H} onPointerLeave={() => setActive(null)}>
          {yTicks.map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={PAD.l} x2={w - PAD.r} y1={yOf(v)} y2={yOf(v)} />
              <text className="chart-axis" x={PAD.l - 6} y={yOf(v) + 3} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const x = PAD.l + i * slot + (slot - barW) / 2;
            const y = yOf(b.value);
            const h = PAD.t + innerH - y;
            const r = Math.min(4, barW / 2);
            return (
              <g key={i} onPointerEnter={() => setActive(i)}>
                <rect
                  x={x}
                  y={b.value > 0 ? y : PAD.t + innerH - 1}
                  width={barW}
                  height={b.value > 0 ? h : 1}
                  rx={r}
                  fill={color}
                  fillOpacity={active === i ? 1 : 0.82}
                />
                {i % labelStep === 0 && (
                  <text className="chart-axis" x={x + barW / 2} y={H - 6} textAnchor="middle">
                    {b.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <Tooltip tip={tip} width={w} />
    </div>
  );
}

// ---- Точечный график (время суток по датам) ----

export function DotPlot({
  points,
  color,
  fmtDate,
  fmtTip,
}: {
  points: { t: number; min: number }[];
  color: string;
  fmtDate: (t: number) => string;
  fmtTip: (t: number) => string;
}) {
  const [ref, w] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(1, w - PAD.l - PAD.r);
  const innerH = H - PAD.t - PAD.b;
  const tMin = points.length ? Math.min(...points.map((p) => p.t)) : 0;
  const tMax = points.length ? Math.max(...points.map((p) => p.t)) : 1;
  const span = tMax - tMin || 1;

  const xOf = (t: number) => PAD.l + (points.length <= 1 ? innerW / 2 : ((t - tMin) / span) * innerW);
  const yOf = (m: number) => PAD.t + (1 - m / 1440) * innerH;
  const hLabel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:00`;

  const coords = points.map((p) => ({ x: xOf(p.t), y: yOf(p.min), p }));

  const tip: TipState | null =
    active !== null && coords[active]
      ? {
          left: coords[active].x - 50,
          top: Math.max(0, coords[active].y - 44),
          lines: [
            `${String(Math.floor(coords[active].p.min / 60)).padStart(2, '0')}:${String(coords[active].p.min % 60).padStart(2, '0')}`,
            fmtTip(coords[active].p.t),
          ],
        }
      : null;

  return (
    <div className="chart" ref={ref}>
      {w > 0 && (
        <svg width={w} height={H} onPointerLeave={() => setActive(null)}>
          {[0, 360, 720, 1080, 1440].map((m) => (
            <g key={m}>
              <line className="chart-grid" x1={PAD.l} x2={w - PAD.r} y1={yOf(m)} y2={yOf(m)} />
              <text className="chart-axis" x={PAD.l - 6} y={yOf(m) + 3} textAnchor="end">
                {hLabel(m)}
              </text>
            </g>
          ))}
          {(tMax > tMin ? [tMin, (tMin + tMax) / 2, tMax] : [tMin]).map((t, i, arr) => (
            <text
              key={i}
              className="chart-axis"
              x={xOf(t)}
              y={H - 6}
              textAnchor={arr.length === 1 ? 'middle' : i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
            >
              {fmtDate(t)}
            </text>
          ))}
          {coords.map((c, i) => (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={active === i ? 6 : 4}
              fill={color}
              fillOpacity={0.85}
              stroke="var(--surface)"
              strokeWidth={1.5}
              onPointerEnter={() => setActive(i)}
            />
          ))}
        </svg>
      )}
      <Tooltip tip={tip} width={w} />
    </div>
  );
}

// ---- Горизонтальное распределение (enum) ----

export function DistBars({
  items,
  color,
}: {
  items: { label: string; count: number; percent: number }[];
  color: string;
}) {
  return (
    <div className="dist">
      {items.map((d) => (
        <div className="dist-row" key={d.label}>
          <span className="dist-label" title={d.label}>
            {d.label}
          </span>
          <div className="dist-track">
            <div className="dist-bar" style={{ width: `${d.percent}%`, background: color }} />
          </div>
          <span className="dist-pct">
            {d.count} · {d.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
