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

// Sections match the Phase 2 admin sitemap exactly:
// dashboard / applicants / agents / requests / invoices / settings.
const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applicants", label: "Applicants", icon: Users },
  { href: "/admin/agents", label: "Agents", icon: Building2 },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar({ pendingRequestCount = 0 }: { pendingRequestCount?: number }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <Link href="/admin/dashboard" className="flex items-center gap-2 px-1">
          <Image
            src="/brand/topway-logo.png"
            alt="Topway"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
          />
          <span className="text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Topway
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                    {item.href === "/admin/requests" && pendingRequestCount > 0 && (
                      <SidebarMenuBadge>{pendingRequestCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
        Topway Private Limited
      </SidebarFooter>
    </Sidebar>
  );
}
