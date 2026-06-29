import { useEffect, useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
import { PERIOD_PRESETS, Range } from "../utils/period";

interface Props {
  range: Range;
  onChange: (r: Range) => void;
}

/** Selettore di periodo compatto: preset rapidi + popover per l'intervallo personalizzato. */
export function PeriodFilter({ range, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="dm-period" ref={ref}>
      <div className="dm-period-presets" role="group" aria-label="Periodo">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`dm-seg${range.preset === p.key ? " is-active" : ""}`}
            onClick={() => { onChange(p.build()); setOpen(false); }}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`dm-seg dm-seg-icon${range.preset === "custom" ? " is-active" : ""}`}
          aria-label="Periodo personalizzato"
          aria-expanded={open}
          title="Scegli un intervallo personalizzato"
          onClick={() => setOpen((v) => !v)}
        >
          <CalendarRange size={15} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="dm-period-pop" role="group" aria-label="Intervallo personalizzato">
          <label className="dm-period-field">
            <span>Da</span>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={range.from}
              max={range.to}
              onChange={(e) => onChange({ ...range, from: e.target.value, preset: "custom" })}
            />
          </label>
          <label className="dm-period-field">
            <span>A</span>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={range.to}
              min={range.from}
              onChange={(e) => onChange({ ...range, to: e.target.value, preset: "custom" })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
