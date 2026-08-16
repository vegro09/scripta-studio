import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BookOpen, LayoutDashboard } from "lucide-react";
import { dirFor, t } from "@/lib/scripta/i18n";
import { useScripta } from "@/lib/scripta/store";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang } = useScripta();
  const dir = dirFor(lang);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [dir, lang]);

  const items = [
    { to: "/studio", label: t(lang, "studio"), icon: BookOpen },
    { to: "/dashboard", label: t(lang, "dashboard"), icon: LayoutDashboard },
  ];

  return (
    <div dir={dir} className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/studio" className="flex min-w-0 items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold tracking-tight">
              {t(lang, "brand")}
            </span>
            <span className="hidden truncate text-xs text-muted-foreground md:inline">
              {t(lang, "tagline")}
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {items.map((it) => {
              const active = pathname.startsWith(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={cn(
                    "transition-editorial border-b-2 pb-1 text-sm",
                    active
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>

      <nav
        aria-label={t(lang, "brand")}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background md:hidden"
      >
        {items.map((it) => {
          const active = pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "transition-editorial flex min-h-14 flex-col items-center justify-center gap-1 text-xs",
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {it.label}
              <span
                className={cn("h-0.5 w-8 rounded-full", active ? "bg-foreground" : "bg-transparent")}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
