"use client";

import { Bell } from "lucide-react";
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

export function AdminTopbar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-4 shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <SidebarTrigger className="hover:bg-muted" />
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
                  <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{name}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {role === "OWNER" ? "Owner" : "Staff"}
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
