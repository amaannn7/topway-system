"use client";

import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="size-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {role === "OWNER" ? "Owner" : "Staff"}
          </DropdownMenuLabel>
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
    </header>
  );
}
