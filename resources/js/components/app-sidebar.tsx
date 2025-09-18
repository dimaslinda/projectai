import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, MessageSquare, Users } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { props } = usePage<SharedData>();
    const user = props.auth?.user;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dasbor',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'AI Chat',
            href: '/chat',
            icon: MessageSquare,
        },
        ...(user?.role === 'superadmin'
            ? [
                  {
                      title: 'User Management',
                      href: '/users',
                      icon: Users,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
