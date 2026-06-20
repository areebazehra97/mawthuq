import { useState, type ReactNode } from "react";
import { BarChart3, ClipboardList, Settings2 } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function PageShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Global top header ───────────────────────────────── */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-3 bg-primary px-4 sm:px-5">

        {/* Logo + brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-bold shadow-sm">
            M
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-primary-foreground tracking-tight">
              Mawthūq
              <span className="ml-1.5 font-normal text-primary-foreground/55">
                · Vendor Prequalification
              </span>
            </div>
            <div className="text-[11px] text-primary-foreground/45 hidden sm:block">
              by WhiteHelmet · a skill of ASIF
            </div>
          </div>
        </div>

        {/* Top nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {[
            { label: "Dashboard",     to: "/" },
            { label: "Projects",      to: "/projects" },
            { label: "Vendor Master", to: "/vendors" },
          ].map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-primary-foreground"
                    : "text-primary-foreground/65 hover:bg-white/10 hover:text-primary-foreground",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language toggle */}
        <div className="flex items-center overflow-hidden rounded border border-primary-foreground/20 text-xs">
          <button className="px-2.5 py-1 bg-accent text-accent-foreground font-medium">
            EN
          </button>
          <button
            className="px-2.5 py-1 text-primary-foreground/65 hover:bg-white/10 transition-colors"
            style={{ fontFamily: '"Noto Sans Arabic", sans-serif' }}
          >
            ع
          </button>
        </div>

        {/* Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-[11px] font-semibold shadow-sm ring-1 ring-white/15 transition-transform hover:scale-[1.03]"
          >
            FA
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 z-40 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="border-b border-border bg-muted/20 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Fatima Al-Harbi</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Procurement Director</p>
                </div>
                <div className="p-2">
                  <MenuLink
                    to="/analytics"
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Analytics"
                    detail="Portfolio charts and KPIs"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/activity-log"
                    icon={<ClipboardList className="h-4 w-4" />}
                    label="Activity Log"
                    detail="Recent events and audit trail"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    to="/account-settings"
                    icon={<Settings2 className="h-4 w-4" />}
                    label="Account Settings"
                    detail="Preferences and demo profile"
                    onClick={() => setMenuOpen(false)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content area */}
        <main className="flex-1 min-w-0 bg-background overflow-hidden">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="space-y-8 p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </ScrollArea>
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}

function MenuLink({
  to,
  icon,
  label,
  detail,
  onClick,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
    >
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{detail}</span>
      </span>
    </Link>
  );
}
