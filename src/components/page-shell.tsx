import { Menu, ShieldCheck } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navigationItems } from "@/data/seed";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PageShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentItem =
    navigationItems.find((item) => item.path === location.pathname) ?? navigationItems[0];

  return (
    <div className="min-h-screen bg-grid bg-[size:36px_36px]">
      <div className="mx-auto flex min-h-screen max-w-[1680px] gap-6 p-4 sm:p-6">
        <aside className="panel-surface hidden w-[320px] shrink-0 lg:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="panel-surface flex items-center justify-between px-5 py-4 lg:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                Mawthuq
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">{currentItem.label}</h2>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 bg-black/55 p-4 lg:hidden">
              <div className="panel-surface flex h-full flex-col">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                      Mawthuq
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Vendor Prequalification Engine
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                    Close
                  </Button>
                </div>
                <Separator />
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          ) : null}

          <main className="panel-surface min-h-[calc(100vh-3rem)] overflow-hidden">
            <ScrollArea className="h-[calc(100vh-3rem)]">
              <div className="space-y-8 p-4 sm:p-6 lg:p-8">
                <Outlet />
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="px-6 pb-5 pt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary p-3 text-slate-950">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Mawthūq
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">موثوق</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Trusted vendor prequalification for Saudi construction procurement.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2 px-2">
          {navigationItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "block rounded-2xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-white"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white",
                )
              }
            >
              {({ isActive }) => (
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                        isActive ? "bg-primary text-slate-950" : "bg-white/10 text-slate-200",
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="font-medium">{item.label}</p>
                  </div>
                  <p className="pl-10 text-xs leading-5 text-slate-400">{item.description}</p>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="px-6 pb-6 pt-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Operating model
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            AI extracts evidence. Rules decide. Humans approve.
          </p>
        </div>
      </div>
    </div>
  );
}
