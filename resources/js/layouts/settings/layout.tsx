import { Button } from '@/components/ui/button';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Профиль',
        url: '/admin/settings/profile',
        icon: null,
    },
    {
        title: 'Пароль',
        url: '/admin/settings/password',
        icon: null,
    },
    {
        title: 'Оформление',
        url: '/admin/settings/appearance',
        icon: null,
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-2">
                {sidebarNavItems.map((item) => (
                    <Button key={item.url} asChild variant={currentPath === item.url ? 'secondary' : 'ghost'} className="justify-start">
                        <Link href={item.url} prefetch>
                            {item.title}
                        </Link>
                    </Button>
                ))}
            </aside>

            <div>{children}</div>
        </div>
    );
}
