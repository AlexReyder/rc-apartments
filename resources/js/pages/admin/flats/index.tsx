import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';

type Flat = {
    id: number;
    slug: string;
    building: number;
    floor: number;
    number: number;
    rooms: number;
    square: number;
    price: number;
    sold: boolean;
};

type SortableColumn = 'id' | 'building' | 'floor' | 'number' | 'rooms_number' | 'square' | 'price' | 'sold';

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type FlatsPagination = {
    data: Flat[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

type Props = {
    filters: {
        search: string;
        perPage: number;
        sortBy: string;
        sortDirection: 'asc' | 'desc';
    };
    flats: FlatsPagination;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Админ-панель',
        href: '/admin',
    },
    {
        title: 'Квартиры',
        href: '/admin/flats',
    },
];

const perPageOptions = [10, 20, 30, 50] as const;

export default function AdminFlatsIndex({ filters, flats }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search);

    useEffect(() => {
        setSearchValue(filters.search);
    }, [filters.search]);

    const navigate = (overrides: Partial<Props['filters'] & { page: number }> = {}) => {
        router.get(
            route('admin.flats.index'),
            {
                search: overrides.search ?? filters.search,
                perPage: overrides.perPage ?? filters.perPage,
                sortBy: overrides.sortBy ?? filters.sortBy,
                sortDirection: overrides.sortDirection ?? filters.sortDirection,
                page: overrides.page ?? 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        navigate({
            search: searchValue.trim(),
            page: 1,
        });
    };

    const handleSort = (column: SortableColumn) => {
        const nextDirection: 'asc' | 'desc' =
            filters.sortBy === column && filters.sortDirection === 'asc' ? 'desc' : 'asc';

        navigate({
            sortBy: column,
            sortDirection: nextDirection,
            page: 1,
        });
    };

    const sortIcon = (column: SortableColumn) => {
        if (filters.sortBy !== column) {
            return <span className="text-xs text-muted-foreground">↕</span>;
        }

        return (
            <span className="text-xs text-foreground">
                {filters.sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const priceFormatter = new Intl.NumberFormat('ru-RU');
    const squareFormatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return (
        <AdminLayout
            title="Квартиры"
            description="Список квартир из существующей таблицы flats с query params, сортировкой, пагинацией и поиском."
            breadcrumbs={breadcrumbs}
        >
            <Head title="Квартиры" />

            <div className="space-y-4">
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-end"
                >
                    <div className="flex-1">
                        <label htmlFor="search" className="mb-2 block text-sm font-medium">
                            Поиск
                        </label>
                        <input
                            id="search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Например: 1886 = корпус 1, этаж 8, квартира 86"
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                        />
                    </div>

                    <div className="w-full lg:w-40">
                        <label htmlFor="per-page" className="mb-2 block text-sm font-medium">
                            Показывать
                        </label>
                        <select
                            id="per-page"
                            value={String(filters.perPage)}
                            onChange={(event) =>
                                navigate({
                                    perPage: Number(event.target.value),
                                    page: 1,
                                })
                            }
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                        >
                            {perPageOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                    >
                        Найти
                    </button>
                </form>

                {flats.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center">
                        <div className="space-y-2">
                            <h2 className="text-lg font-medium">Квартиры не найдены</h2>
                            <p className="text-sm text-muted-foreground">
                                Проверьте параметры поиска. Формат <span className="font-medium">1886</span> ищет:
                                корпус 1, этаж 8, квартира 86.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-2xl border">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('id')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                ID
                                                {sortIcon('id')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('building')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Корпус
                                                {sortIcon('building')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('floor')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Этаж
                                                {sortIcon('floor')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('number')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Квартира
                                                {sortIcon('number')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('rooms_number')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Комнат
                                                {sortIcon('rooms_number')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('square')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Площадь
                                                {sortIcon('square')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('price')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Цена
                                                {sortIcon('price')}
                                            </button>
                                        </th>
                                        <th className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('sold')}
                                                className="inline-flex items-center gap-2 font-medium"
                                            >
                                                Статус
                                                {sortIcon('sold')}
                                            </button>
                                        </th>
                                        <th className="p-3 font-medium">Slug</th>
                                        <th className="p-3 font-medium">Публичная карточка</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flats.data.map((flat) => (
                                        <tr key={flat.id} className="border-b last:border-b-0">
                                            <td className="whitespace-nowrap p-3">{flat.id}</td>
                                            <td className="whitespace-nowrap p-3">{flat.building}</td>
                                            <td className="whitespace-nowrap p-3">{flat.floor}</td>
                                            <td className="whitespace-nowrap p-3">{flat.number}</td>
                                            <td className="whitespace-nowrap p-3">{flat.rooms}</td>
                                            <td className="whitespace-nowrap p-3">{squareFormatter.format(flat.square)} м²</td>
                                            <td className="whitespace-nowrap p-3">{priceFormatter.format(flat.price)} ₽</td>
                                            <td className="whitespace-nowrap p-3">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        flat.sold
                                                            ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400'
                                                            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    }`}
                                                >
                                                    {flat.sold ? 'Продана' : 'Доступна'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap p-3 font-mono text-xs">{flat.slug}</td>
                                            <td className="whitespace-nowrap p-3">
                                                <a
                                                    href={route('apartments.show', flat.slug)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                                                >
                                                    Открыть
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Показано {flats.from ?? 0}–{flats.to ?? 0} из {flats.total}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {flats.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                link.active ? 'border-foreground bg-foreground text-background' : 'hover:bg-muted'
                                            }`}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="inline-flex min-w-10 cursor-not-allowed items-center justify-center rounded-lg border px-3 py-2 text-sm text-muted-foreground opacity-60"
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}