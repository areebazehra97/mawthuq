import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            M
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Mawthuq</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">ماوثوق · Vendor Pre-Qualification</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
