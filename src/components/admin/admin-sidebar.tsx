"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Inbox,
  Receipt,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Sections match the Phase 2 admin sitemap exactly:
// dashboard / applicants / agents / requests / invoices / settings.
// Each item's `accent` ties its icon to the same entity color used on that
// section's own page (applicants=info/blue, agents=purple, invoices=amber).
// Written as full literal className strings (not built from parts) so
// Tailwind's static scanner can find and generate them.
const NAV_ITEMS = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    accent: "group-hover/menu-button:text-primary",
    activeAccent: "[&_svg]:text-primary",
    activeBg: "data-active:bg-primary/10 data-active:before:bg-primary",
  },
  {
    href: "/admin/applicants",
    label: "Applicants",
    icon: Users,
    accent: "group-hover/menu-button:text-info",
    activeAccent: "[&_svg]:text-info",
    activeBg: "data-active:bg-info/10 data-active:before:bg-info",
  },
  {
    href: "/admin/agents",
    label: "Agents",
    icon: Building2,
    accent: "group-hover/menu-button:text-purple",
    activeAccent: "[&_svg]:text-purple",
    activeBg: "data-active:bg-purple/10 data-active:before:bg-purple",
  },
  {
    href: "/admin/requests",
    label: "Requests",
    icon: Inbox,
    accent: "group-hover/menu-button:text-warning-foreground",
    activeAccent: "[&_svg]:text-warning-foreground",
    activeBg: "data-active:bg-warning/15 data-active:before:bg-warning",
  },
  {
    href: "/admin/invoices",
    label: "Invoices",
    icon: Receipt,
    accent: "group-hover/menu-button:text-amber-foreground",
    activeAccent: "[&_svg]:text-amber-foreground",
    activeBg: "data-active:bg-amber/15 data-active:before:bg-amber",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    accent: "group-hover/menu-button:text-foreground",
    activeAccent: "[&_svg]:text-foreground",
    activeBg: "data-active:bg-sidebar-accent data-active:before:bg-foreground/40",
  },
] as const;

export function AdminSidebar({ pendingRequestCount = 0 }: { pendingRequestCount?: number }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-1.5">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-card to-muted shadow-sm ring-1 ring-foreground/10 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
            <Image
              src="/brand/topway-logo.png"
              alt="Topway"
              width={22}
              height={22}
              className="h-5.5 w-5.5 shrink-0 object-contain group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5"
            />
          </div>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Topway
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "relative overflow-visible transition-colors [&_svg]:transition-colors before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:scale-y-0 before:rounded-full before:transition-transform before:content-[''] data-active:font-semibold data-active:before:scale-y-100",
                        item.accent,
                        item.activeBg,
                        active && item.activeAccent
                      )}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                    {item.href === "/admin/requests" && pendingRequestCount > 0 && (
                      <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                        {pendingRequestCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
        Topway Private Limited
      </SidebarFooter>
    </Sidebar>
  );
}
