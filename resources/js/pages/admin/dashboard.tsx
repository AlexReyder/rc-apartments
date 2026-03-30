import { Head, Link } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Админ-панель',
        href: '/admin',
    },
];

export default function Dashboard() {
    return (
        <AdminLayout
            title="Админ-панель"
            description="Базовая административная зона для управления модулем квартир."
            breadcrumbs={breadcrumbs}
        >
            <Head title="Админ-панель" />

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-5">
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium">Модуль квартир</h2>
                        <p className="text-sm text-muted-foreground">
                            Таблица квартир с поиском, сортировкой, пагинацией и переходом в публичную карточку.
                        </p>
                    </div>

                    <div className="mt-4">
                        <Link
                            href="/admin/flats"
                            className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                        >
                            Открыть список квартир
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl border p-5">
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium">Публичный каталог</h2>
                        <p className="text-sm text-muted-foreground">
                            Быстрый переход к публичной части `/apartments` для проверки карточек квартир.
                        </p>
                    </div>

                    <div className="mt-4">
                        <a
                            href="/apartments"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            Открыть каталог
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}