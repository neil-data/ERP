import React from "react";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded select-none focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent hover:bg-accent-hover text-white shadow-sm border border-accent",
    secondary: "bg-surface hover:bg-card text-primary-text border border-brand-border hover:border-accent/40",
    danger: "bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/60",
    ghost: "text-secondary-text hover:text-primary-text hover:bg-surface/60",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// --- INPUT COMPONENT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", id, ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-surface border ${error ? "border-red-500/60 focus:ring-red-500/40" : "border-brand-border focus:border-accent/60"} text-primary-text rounded px-3 py-2 text-sm transition-all outline-none focus:ring-1 focus:ring-accent/30 font-sans ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
    </div>
  );
};

// --- SELECT COMPONENT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = "", id, ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`w-full bg-surface border ${error ? "border-red-500/60 focus:ring-red-500/40" : "border-brand-border focus:border-accent/60"} text-primary-text rounded px-3 py-2 text-sm transition-all outline-none focus:ring-1 focus:ring-accent/30 appearance-none font-sans ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-primary-text">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-text">
          <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs text-red-400 font-mono">{error}</span>}
    </div>
  );
};

// --- BADGE COMPONENT ---
interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const norm = status.toLowerCase().replace(/_/g, " ");
  
  let styles = "bg-surface text-secondary-text border-brand-border";
  
  if (norm === "available" || norm === "active" || norm === "approved" || norm === "completed") {
    styles = "bg-green-950/30 text-green-400 border-green-900/40";
  } else if (norm === "on trip" || norm === "in transit" || norm === "in progress") {
    styles = "bg-orange-950/30 text-accent border-accent/30";
  } else if (norm === "on leave" || norm === "inactive" || norm === "rejected" || norm === "cancelled") {
    styles = "bg-red-950/30 text-red-400 border-red-900/40";
  } else if (norm === "scheduled" || norm === "pending") {
    styles = "bg-yellow-950/30 text-yellow-400 border-yellow-900/40";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border tracking-wide uppercase select-none ${styles}`}>
      {norm}
    </span>
  );
};

// --- METRIC / STAT CARD ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  id?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, subtitle, id }) => {
  return (
    <div id={id} className="bg-card border border-brand-border rounded p-5 relative overflow-hidden transition-all duration-300 hover:border-accent/40 group">
      {/* Decorative subtle ambient hover light */}
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all duration-300" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-secondary-text uppercase tracking-wider font-display">
            {title}
          </span>
          <span className="text-2xl font-bold text-primary-text tracking-tight font-display mt-1">
            {value}
          </span>
        </div>
        <div className="w-10 h-10 rounded bg-surface border border-brand-border flex items-center justify-center text-secondary-text group-hover:text-accent group-hover:border-accent/30 transition-all duration-300">
          {icon}
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="flex items-center gap-2 mt-4 text-xs font-mono border-t border-brand-border/60 pt-3">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 ${trend.positive ? "text-green-400" : "text-red-400"}`}>
              {trend.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-secondary-text truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

// --- MODAL COMPONENT ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, id }) => {
  if (!isOpen) return null;

  return (
    <div id={id} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Content Container */}
      <div className="bg-card border border-brand-border rounded-lg w-full max-w-lg shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h2 className="text-sm font-bold uppercase tracking-wider font-display text-primary-text">
            {title}
          </h2>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- SLIDING DRAWER COMPONENT ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  id?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, id }) => {
  return (
    <div id={id} className={`fixed inset-0 z-50 transition-all duration-300 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-brand-border shadow-2xl z-10 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h2 className="text-sm font-bold uppercase tracking-wider font-display text-primary-text">
            {title}
          </h2>
          <button onClick={onClose} className="text-secondary-text hover:text-primary-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- LOADING SKELETON COMPONENT ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-surface/60 border border-brand-border/40 rounded ${className}`} />
  );
};

// --- CUSTOM TOAST NOTIFICATION STACK MANAGER ---
export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
      {toasts.map((t) => {
        const colors = {
          success: "border-green-500/30 bg-green-950/20 text-green-400",
          error: "border-red-500/30 bg-red-950/20 text-red-400",
          warning: "border-yellow-500/30 bg-yellow-950/20 text-yellow-400",
          info: "border-accent/30 bg-accent/10 text-accent",
        };

        const icons = {
          success: <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-accent shrink-0" />,
        };

        return (
          <div
            key={t.id}
            className={`border rounded p-3.5 flex items-center justify-between gap-3 shadow-lg backdrop-blur-sm animate-fade-in-up font-mono text-xs ${colors[t.type]}`}
          >
            <div className="flex items-center gap-2.5">
              {icons[t.type]}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="opacity-70 hover:opacity-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
