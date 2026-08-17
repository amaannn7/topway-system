"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LayoutDashboard, Users, Users2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/actions";

const NAV_ITEMS = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/applicants", label: "My Applicants", icon: Users },
  { href: "/agent/customers", label: "Customers", icon: Users2 },
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
    ? [...NAV_ITEMS, { href: "/agent/browse", label: "Browse & Request", icon: Search }]
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
        </Link>
        <div className="hidden h-5 w-px bg-border md:block" aria-hidden />

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative rounded-full hover:bg-muted"
        >
          <Bell className="size-4" />
        </Button>
        <div className="h-6 w-px bg-border" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-2 rounded-full px-2 py-1 hover:bg-muted">
                <Avatar className="size-7 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-xs font-medium text-primary-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden flex-col items-start leading-tight sm:flex">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-[0.68rem] text-muted-foreground">{company}</span>
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{name}</span>
                <span className="text-xs font-normal text-muted-foreground">{company}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
