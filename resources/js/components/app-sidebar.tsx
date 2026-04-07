import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Building2, LayoutGrid, PlugZap, Users } from 'lucide-react';
import AppLogo from './app-logo';
import { NavUser } from './nav-user';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const mainNavItems: NavItem[] = [
        {
            title: 'Панель',
            url: '/admin',
            icon: LayoutGrid,
        },
        {
            title: 'Пользователи',
            url: '/admin/users',
            icon: Users,
        },
        {
            title: 'Квартиры',
            url: '/admin/flats',
            icon: Building2,
        },
        ...(auth.user.role === 'superadmin'
            ? [
                  {
                      title: 'Интеграции',
                      url: '/admin/integration',
                      icon: PlugZap,
                  } satisfies NavItem,
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
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
