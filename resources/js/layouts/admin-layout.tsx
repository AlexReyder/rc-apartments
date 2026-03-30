import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({
    children,
    title,
    description,
    breadcrumbs = [],
}: AdminLayoutProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
                </div>

                {children}
            </div>
        </AppLayout>
    );
}