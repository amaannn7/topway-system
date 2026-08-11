"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions";

const NAV_ITEMS = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/applicants", label: "My Applicants" },
  { href: "/agent/customers", label: "Customers" },
] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AgentTopbar({
  company,
  name,
  logoUrl,
  showBrowse,
}: {
  company: string;
  name: string;
  logoUrl?: string | null;
  showBrowse: boolean;
}) {
  const pathname = usePathname();
  const navItems = showBrowse
    ? [...NAV_ITEMS, { href: "/agent/browse", label: "Browse & Request" }]
    : NAV_ITEMS;

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b bg-background/95 px-4 shadow-sm backdrop-blur-sm sm:px-6 supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4">
        <Link href="/agent/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-card to-muted shadow-sm ring-1 ring-foreground/10">
            <Image
              src="/brand/topway-logo.png"
              alt="Topway"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
          </div>
          {logoUrl && (
            <>
              <div className="h-5 w-px bg-border" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element -- agent-uploaded logo, not an optimizable static asset */}
              <img src={logoUrl} alt={company} className="h-6 w-auto object-contain" />
            </>
          )}
          <span className="hidden text-sm font-medium sm:inline">{company}</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-purple/10 text-purple"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-2 rounded-full px-2 hover:bg-muted">
                <Avatar className="size-7 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-purple text-xs font-medium text-purple-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              render={
                <form action={signOutAction} className="w-full">
                  <button type="submit" className="w-full text-left">
                    Sign out
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
