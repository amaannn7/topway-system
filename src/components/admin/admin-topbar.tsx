"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/actions";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  applicants: "Applicants",
  agents: "Agents",
  requests: "Requests",
  invoices: "Invoices",
  settings: "Settings",
};

function useSectionLabel() {
  const pathname = usePathname();
  const segment = pathname.split("/")[2];
  return segment ? SECTION_LABELS[segment] : undefined;
}

export function AdminTopbar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const section = useSectionLabel();

  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-[1680px] items-center gap-3">
        <SidebarTrigger className="hover:bg-muted" />
        <div className="h-5 w-px bg-border" aria-hidden />
        <div className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Admin</span>
          {section && (
            <>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
              <span className="truncate font-medium text-foreground">{section}</span>
            </>
          )}
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative rounded-full hover:bg-muted"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive ring-2 ring-background" />
        </Button>
        <div className="h-6 w-px bg-border" aria-hidden />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="gap-2 rounded-full px-2 hover:bg-muted">
                <Avatar className="size-7 ring-2 ring-background shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-xs font-medium text-primary-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {role === "OWNER" ? "Owner" : "Staff"}
                </span>
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
