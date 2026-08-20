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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Sections match the Phase 2 admin sitemap exactly:
// dashboard / applicants / agents / requests / invoices / settings.
// Every item shares the same brand-teal accent (see ACTIVE_CLASSES /
// HOVER_CLASSES below) — sections no longer get their own sidebar color,
// even though several still use a distinct accent on their own page
// (Applicants=info, Invoices=amber, Requests=warning). Keeping the sidebar
// to one accent avoids implying a per-section identity that isn't there.
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workspace",
    items: [
      { href: "/admin/applicants", label: "Applicants", icon: Users },
      { href: "/admin/agents", label: "Agents", icon: Building2 },
      { href: "/admin/requests", label: "Requests", icon: Inbox },
      // Gated below by canViewPayments — invoices carry bank details and
      // amounts, so staff without that permission shouldn't even see the
      // link (matches the redirect already enforced on the pages/actions
      // themselves; this just keeps the nav from advertising a section
      // they'd immediately be bounced out of).
      { href: "/admin/invoices", label: "Invoices", icon: Receipt, requiresPayments: true },
    ],
  },
  {
    label: "Configuration",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
] as const;

const HOVER_CLASSES = "group-hover/menu-button:text-primary";
const ACTIVE_ACCENT_CLASSES = "[&_svg]:text-primary";
const ACTIVE_BG_CLASSES =
  "data-active:bg-primary/30 data-active:ring-1 data-active:ring-primary/20 data-active:before:bg-primary";

export function AdminSidebar({
  pendingRequestCount = 0,
  canViewPayments = false,
}: {
  pendingRequestCount?: number;
  canViewPayments?: boolean;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-4 group-data-[collapsible=icon]:px-1.5">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2.5 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-white/10 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
            <Image
              src="/brand/topway-logo.png"
              alt="Topway"
              width={22}
              height={22}
              className="h-5.5 w-5.5 shrink-0 object-contain group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5"
            />
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Topway
            </span>
            <span className="text-[0.68rem] font-medium tracking-wide text-sidebar-foreground/50 uppercase">
              Recruitment Portal
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent className="py-1">
        {NAV_GROUPS.map((group, gi) => (
          <SidebarGroup key={group.label} className={cn(gi > 0 && "mt-1")}>
            <SidebarGroupLabel className="text-[0.65rem] font-semibold tracking-widest text-sidebar-foreground/45 uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items
                  .filter((item) => !("requiresPayments" in item && item.requiresPayments) || canViewPayments)
                  .map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative overflow-visible text-sidebar-foreground transition-colors [&_svg]:transition-colors before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:scale-y-0 before:rounded-full before:transition-transform before:content-[''] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:font-semibold data-active:shadow-sm data-active:before:scale-y-100",
                          HOVER_CLASSES,
                          ACTIVE_BG_CLASSES,
                          active && ACTIVE_ACCENT_CLASSES
                        )}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        }
                      />
                      {item.href === "/admin/requests" && pendingRequestCount > 0 && (
                        <SidebarMenuBadge className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground shadow-sm">
                          {pendingRequestCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter className="px-3 py-3 group-data-[collapsible=icon]:hidden">
        <p className="px-1 text-[0.7rem] text-sidebar-foreground/50">
          Topway Private Limited
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
