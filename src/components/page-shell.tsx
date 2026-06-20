import { useState } from "react";
import { PanelLeft, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import { navigationItems } from "@/data/seed";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function PageShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Global top header ───────────────────────────────── */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-3 bg-primary px-4 sm:px-5">

        {/* Sidebar toggle */}
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen((v) => !v);
            } else {
              setSidebarOpen((v) => !v);
            }
          }}
          aria-label="Toggle navigation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-primary-foreground/70 transition-colors hover:bg-white/10 hover:text-primary-foreground"
        >
          <PanelLeft className="h-[18px] w-[18px]" />
        </button>

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
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-[11px] font-semibold shadow-sm">
          FA
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Desktop collapsible sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-sidebar shrink-0 overflow-hidden",
            "transition-[width] duration-200 ease-in-out",
            "shadow-[1px_0_0_hsl(var(--sidebar-border))]",
            sidebarOpen ? "w-[272px]" : "w-0",
          )}
        >
          <SidebarContent />
        </aside>

        {/* Mobile overlay sidebar */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/55 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="flex h-full w-[280px] flex-col bg-sidebar shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
                <span className="text-sm font-semibold text-sidebar-foreground">Navigation</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

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

/* ── Sidebar content ─────────────────────────────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Scrollable nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-0.5">
          {navigationItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2.5 transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )
              }
            >
              {({ isActive }) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "bg-sidebar-accent text-sidebar-foreground/70",
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="min-w-0 text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="pl-7 text-[11px] leading-4 text-sidebar-foreground/45">
                    {item.description}
                  </p>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

    </div>
  );
}
