import { TRACKABLE_COLORS } from '../lib/colors';

export default function ColorPalette({
  value,
  onPick,
}: {
  value: string;
  onPick: (color: string) => void;
}) {
  return (
    <div className="palette">
      {TRACKABLE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${value === c ? 'selected' : ''}`}
          style={{ background: c }}
          aria-label={`Цвет ${c}`}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}
