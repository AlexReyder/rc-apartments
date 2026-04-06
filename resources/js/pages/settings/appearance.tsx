import AppearanceTabs from '@/components/appearance-tabs';
import AdminLayout from '@/layouts/admin-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Админ-панель', href: '/admin' },
    { title: 'Настройки', href: '/admin/settings/profile' },
    { title: 'Оформление', href: '/admin/settings/appearance' },
];

export default function Appearance() {
    return (
        <>
            <Head title="Оформление" />

            <AdminLayout title="Настройки оформления" description="Выберите режим отображения интерфейса." breadcrumbs={breadcrumbs}>
                <SettingsLayout>
                    <section className="bg-background rounded-xl border p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">Оформление</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Выберите светлую, тёмную или системную тему.</p>
                        </div>

                        <AppearanceTabs />
                    </section>
                </SettingsLayout>
            </AdminLayout>
        </>
    );
}
