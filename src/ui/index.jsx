// src/ui/index.jsx
// Componentes base del diseño FixItNow. Todas las páginas los usan para que
// botones, tarjetas, campos y estados se vean igual en toda la app.
import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  X,
  Star,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { cx, initials, avatarTone } from "./cx";
import { specialtyVisual } from "./specialty";

/* ------------------------------------------------------------------ */
/*  Botón                                                              */
/* ------------------------------------------------------------------ */
const BUTTON_VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-hover disabled:bg-line disabled:text-subtle",
  secondary: "bg-white text-ink border border-line hover:bg-canvas disabled:text-subtle",
  soft: "bg-brand-soft text-brand-ink hover:bg-[#E2DFFD]",
  ghost: "bg-transparent text-muted hover:bg-canvas hover:text-ink",
  danger: "bg-white text-bad border border-line hover:bg-bad-soft",
  success: "bg-ok-soft text-ok hover:bg-[#d3efdc]",
  dark: "bg-ink text-white hover:bg-black",
};
const BUTTON_SIZES = {
  sm: "h-9 px-3 text-[13px] rounded-[10px] gap-1.5",
  md: "h-11 px-4 text-sm rounded-[12px] gap-2",
  lg: "h-12 px-5 text-[15px] rounded-[12px] gap-2",
  icon: "h-10 w-10 rounded-full justify-center",
};

export function Button({
  variant = "primary",
  size = "md",
  to,
  href,
  className,
  children,
  loading = false,
  disabled,
  type = "button",
  ...rest
}) {
  const cls = cx(
    "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed whitespace-nowrap",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
  const content = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Tarjeta                                                            */
/* ------------------------------------------------------------------ */
export function Card({ as: Tag = "section", className, children, ...rest }) {
  return (
    <Tag className={cx("rounded-2xl border border-line bg-white", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardTitle({ children, className, action }) {
  return (
    <div className={cx("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Etiquetas de estado                                                */
/* ------------------------------------------------------------------ */
const BADGE_TONES = {
  neutral: "bg-[#F4F4F5] text-muted",
  brand: "bg-brand-soft text-brand-ink",
  solid: "bg-brand text-white",
  success: "bg-ok-soft text-ok",
  warning: "bg-warn-soft text-warn",
  danger: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
};

export function Badge({ tone = "neutral", children, className, dot = false }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        BADGE_TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Campos de formulario                                               */
/* ------------------------------------------------------------------ */
const FIELD_BASE =
  "w-full rounded-[10px] border border-field bg-white px-3 text-sm text-ink placeholder:text-subtle " +
  "focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand-soft disabled:bg-canvas disabled:text-muted";

export function Field({ label, hint, error, children, className, optional, id }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const child = typeof children === "function" ? children(fieldId) : children;
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={fieldId} className="text-[13px] font-medium text-ink">
          {label} {optional && <span className="font-normal text-subtle">(opcional)</span>}
        </label>
      )}
      {child}
      {error ? (
        <p className="text-xs text-bad" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }) {
  return <input className={cx(FIELD_BASE, "h-11", className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cx(FIELD_BASE, "h-11 pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, rows = 3, ...rest }) {
  return <textarea rows={rows} className={cx(FIELD_BASE, "py-2.5 resize-y", className)} {...rest} />;
}

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */
export function Avatar({ name, src, size = 40, className }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.34)) };
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={style}
        className={cx("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        avatarTone(name),
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Calificación                                                       */
/* ------------------------------------------------------------------ */
export function Rating({ value, count, className }) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return <span className={cx("text-xs text-subtle", className)}>Sin reseñas</span>;
  }
  return (
    <span className={cx("inline-flex items-center gap-1 text-xs font-semibold", className)}>
      <Star className="h-3.5 w-3.5 fill-star text-star" aria-hidden="true" />
      {n.toFixed(1)}
      {count != null && <span className="font-normal text-subtle">({count})</span>}
    </span>
  );
}

export function Verified({ className }) {
  return (
    <BadgeCheck
      className={cx("h-4 w-4 fill-brand text-white", className)}
      role="img"
      aria-label="Verificado"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Encabezado de página, estados vacíos y de carga                    */
/* ------------------------------------------------------------------ */
export function PageHeader({ title, subtitle, actions, className, badge }) {
  return (
    <div className={cx("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-semibold">
          {title} {badge}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-subtle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={cx("flex flex-col items-center rounded-2xl border border-dashed border-field bg-white px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-base font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loader({ label = "Cargando…", className }) {
  return (
    <div role="status" className={cx("flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-muted", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden="true" />
      {label}
    </div>
  );
}

export function Alert({ tone = "info", children, className, onClose }) {
  const tones = {
    info: "bg-info-soft text-info",
    success: "bg-ok-soft text-ok",
    warning: "bg-warn-soft text-warn",
    danger: "bg-bad-soft text-bad",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("flex items-start gap-3 rounded-xl px-4 py-3 text-sm", tones[tone], className)}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pestañas tipo "segmented control"                                  */
/* ------------------------------------------------------------------ */
export function Segmented({ items, value, onChange, label, className }) {
  return (
    <div role="tablist" aria-label={label} className={cx("inline-flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cx(
              "h-9 rounded-[9px] px-3.5 text-[13px] transition-colors",
              active ? "bg-brand font-medium text-white" : "text-muted hover:bg-canvas hover:text-ink"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export function UnderlineTabs({ items, value, onChange, label, className }) {
  return (
    <div role="tablist" aria-label={label} className={cx("flex flex-wrap gap-6 border-b border-line text-sm", className)}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cx(
              "-mb-px border-b-2 pb-3 transition-colors",
              active ? "border-brand font-medium text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Imagen de especialidad (cuando el técnico no tiene foto)           */
/* ------------------------------------------------------------------ */
export function SpecialtyCover({ specialty, src, className, iconSize = 44, children }) {
  const v = specialtyVisual(specialty);
  const Icon = v.icon;
  return (
    <div className={cx("relative flex items-center justify-center overflow-hidden rounded-[10px]", !src && v.cls, className)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Icon style={{ width: iconSize, height: iconSize }} strokeWidth={1.4} aria-hidden="true" />
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal accesible                                                    */
/* ------------------------------------------------------------------ */
export function Modal({ open, onClose, title, children, size = "md", footer }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement;
    panelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl",
          widths[size]
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* Marca: logo cuadrado + nombre */
export function Logo({ to = "/", className, compact = false }) {
  return (
    <Link to={to} className={cx("inline-flex items-center gap-2.5 text-[19px] font-bold tracking-tight text-ink", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-brand">
        <Wrench className="h-[17px] w-[17px] text-white" strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact && "FixItNow"}
    </Link>
  );
}
