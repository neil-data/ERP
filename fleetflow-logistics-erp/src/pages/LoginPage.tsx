import React, { useState } from "react";
import { Truck, Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import { Button, Input } from "../components/UI";
import { UserRole } from "../types";
import { api } from "../services/api";

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("fleet_manager");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await api.auth.register({ name, email, password, role });
        showToast("Registration successful! Please sign in.", "success");
        setIsRegister(false);
        setPassword("");
      } else {
        const user = await api.auth.login({ email, password });
        showToast("Welcome to FleetFlow ERP", "success");
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      showToast(err.message || "Authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Left Pane - Authentication Form */}
      <div className="w-full md:w-[45%] p-8 lg:p-14 flex flex-col justify-between bg-surface border-r border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_12px_rgba(229,122,58,0.2)]">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base uppercase tracking-wider text-primary-text">
              Fleet<span className="text-accent font-display">Flow</span>
            </span>
            <span className="text-[10px] text-secondary-text tracking-widest font-mono uppercase">
              Enterprise ERP System
            </span>
          </div>
        </div>

        <div className="my-auto py-10 max-w-sm w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary-text font-display">
              {isRegister ? "REGISTER CONSOLE USER" : "ERP TERMINAL ACCESS"}
            </h1>
            <p className="text-xs text-secondary-text mt-1.5 leading-relaxed font-sans">
              {isRegister
                ? "Provision a new authenticated session within the logistics environment."
                : "Enter credentials to authorize secure logistics dashboard synchronization."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="border border-red-500/30 bg-red-950/20 rounded p-3.5 flex items-start gap-2.5 text-xs text-red-400 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <Input
                label="Full Name"
                placeholder="E.g. Rajesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display flex items-center justify-between">
                <span>Enterprise Email</span>
                <Mail className="w-3.5 h-3.5 text-secondary-text/50" />
              </label>
              <input
                type="email"
                placeholder="E.g. admin@fleetflow.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-brand-border focus:border-accent/60 text-primary-text rounded px-3 py-2 text-sm transition-all outline-none focus:ring-1 focus:ring-accent/30 font-sans"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display flex items-center justify-between">
                <span>Security Password</span>
                <Lock className="w-3.5 h-3.5 text-secondary-text/50" />
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-brand-border focus:border-accent/60 text-primary-text rounded px-3 py-2 text-sm transition-all outline-none focus:ring-1 focus:ring-accent/30 font-mono"
                required
              />
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">
                  System Role Access
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-background border border-brand-border text-primary-text rounded px-3 py-2 text-sm outline-none focus:border-accent/60"
                >
                  <option value="fleet_manager">Fleet Manager (All Rights)</option>
                  <option value="dispatcher">Dispatcher (Route Logs & Maintenance)</option>
                  <option value="safety_officer">Safety Officer (Performance Metrics)</option>
                  <option value="financial_analyst">Financial Analyst (Expenses & Cost Charts)</option>
                </select>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full text-xs font-semibold py-2.5 uppercase tracking-wider font-display flex items-center gap-2 mt-2"
              loading={loading}
              type="submit"
            >
              <span>{isRegister ? "Provision Account" : "Authenticate Access"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-brand-border/40 pt-4">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-accent hover:text-accent-hover font-mono hover:underline"
            >
              {isRegister
                ? "Already have authorization? Back to Sign In"
                : "Create a custom operator profile?"}
            </button>
          </div>
        </div>

        <div className="text-[10px] font-mono text-secondary-text leading-normal max-w-sm mx-auto text-center md:text-left">
          <span>SECURE ERP CONSOLE PORTAL • INDIAN LOGISTICS COMPLIANCE</span>
          <br />
          <span>GSTIN & FASTAG SYSTEMS SYNCHRONIZED</span>
        </div>
      </div>

      {/* Right Pane - Brand presentation */}
      <div className="hidden md:flex flex-1 bg-background relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-hero-glow z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
            OPERATING PLATFORM SPECIFICATIONS
          </span>
          <h2 className="text-3xl font-bold font-display tracking-tight text-primary-text">
            Precision Engineering for Fleet Operations
          </h2>
          <p className="text-xs text-secondary-text max-w-lg leading-relaxed font-sans mt-1">
            Form follows engineering. FleetFlow is optimized for zero distraction, massive information density, and clean visual layouts suited for enterprise telemetry.
          </p>
        </div>

        <div className="relative z-10 my-auto py-10 max-w-xl w-full mx-auto">
          <div className="bg-card border border-brand-border rounded-lg p-6 shadow-2xl relative">
            <div className="absolute -top-3.5 left-6 bg-accent text-white font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded border border-accent/20 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>ROLE-BASED ACCESS CONTROL</span>
            </div>

            <p className="text-xs text-secondary-text font-sans mb-5 leading-normal mt-2">
              FleetFlow supports four distinct operator roles, each scoped to exactly the modules their function needs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col text-left p-4 bg-surface border border-brand-border rounded">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Fleet Manager</span>
                <span className="text-[9px] text-accent/80 font-mono mt-2 bg-accent/5 py-0.5 px-1.5 border border-accent/10 rounded self-start uppercase">
                  All Rights Console
                </span>
              </div>
              <div className="flex flex-col text-left p-4 bg-surface border border-brand-border rounded">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Dispatcher</span>
                <span className="text-[9px] text-yellow-400 bg-yellow-950/20 py-0.5 px-1.5 border border-yellow-900/30 rounded self-start uppercase mt-2">
                  Logistics & Trips
                </span>
              </div>
              <div className="flex flex-col text-left p-4 bg-surface border border-brand-border rounded">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Safety Officer</span>
                <span className="text-[9px] text-green-400 bg-green-950/20 py-0.5 px-1.5 border border-green-900/30 rounded self-start uppercase mt-2">
                  Safety & Audits
                </span>
              </div>
              <div className="flex flex-col text-left p-4 bg-surface border border-brand-border rounded">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Finance Analyst</span>
                <span className="text-[9px] text-blue-400 bg-blue-950/20 py-0.5 px-1.5 border border-blue-900/30 rounded self-start uppercase mt-2">
                  Expenses & Analytics
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-secondary-text/80 border-t border-brand-border/40 pt-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping shrink-0" />
            <span>NODE INFRASTRUCTURE: ONLINE</span>
          </div>
          <span>SECURE SYSTEM END-TO-END JWT HANDSHAKE</span>
        </div>
      </div>
    </div>
  );
};