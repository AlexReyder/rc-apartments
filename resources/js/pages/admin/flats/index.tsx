import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Download,
    EyeOff,
    Filter,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    Settings2,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

type Filters = {
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    building: number[];
    floor: number[];
    rooms: number[];
};

type FilterOptions = {
    building: number[];
    floor: number[];
    rooms: number[];
};

type Props = {
    filters: Filters;
    filterOptions: FilterOptions;
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

const perPageOptions = [10, 20, 30, 50, 100] as const;

export default function AdminFlatsIndex({ filters, filterOptions, flats }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<Pick<Filters, 'building' | 'floor' | 'rooms'>>({
        building: filters.building,
        floor: filters.floor,
        rooms: filters.rooms,
    });

    useEffect(() => {
        setSearchValue(filters.search);
    }, [filters.search]);

    useEffect(() => {
        setSelectedIds([]);
    }, [flats.data]);

    useEffect(() => {
        if (!filtersOpen) {
            setDraftFilters({
                building: filters.building,
                floor: filters.floor,
                rooms: filters.rooms,
            });
        }
    }, [filters, filtersOpen]);

    const currentPageIds = useMemo(() => flats.data.map((flat) => flat.id), [flats.data]);

    const allCurrentPageSelected =
        currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

    const someCurrentPageSelected =
        currentPageIds.some((id) => selectedIds.includes(id)) && !allCurrentPageSelected;

    const activeFiltersCount =
        filters.building.length + filters.floor.length + filters.rooms.length;

    const navigate = (overrides: Partial<Filters & { page: number }> = {}) => {
        router.get(
            route('admin.flats.index'),
            {
                search: overrides.search ?? filters.search,
                perPage: overrides.perPage ?? filters.perPage,
                sortBy: overrides.sortBy ?? filters.sortBy,
                sortDirection: overrides.sortDirection ?? filters.sortDirection,
                building: overrides.building ?? filters.building,
                floor: overrides.floor ?? filters.floor,
                rooms: overrides.rooms ?? filters.rooms,
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

    const handleSelectAllCurrentPage = (checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
            return;
        }

        setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    };

    const handleSelectRow = (flatId: number, checked: boolean | 'indeterminate') => {
        if (checked === true) {
            setSelectedIds((prev) => (prev.includes(flatId) ? prev : [...prev, flatId]));
            return;
        }

        setSelectedIds((prev) => prev.filter((id) => id !== flatId));
    };

    const toggleDraftFilterValue = (group: 'building' | 'floor' | 'rooms', value: number) => {
        setDraftFilters((prev) => {
            const exists = prev[group].includes(value);

            return {
                ...prev,
                [group]: exists
                    ? prev[group].filter((item) => item !== value)
                    : [...prev[group], value].sort((a, b) => a - b),
            };
        });
    };

    const applyDraftFilters = () => {
        navigate({
            building: draftFilters.building,
            floor: draftFilters.floor,
            rooms: draftFilters.rooms,
            page: 1,
        });

        setFiltersOpen(false);
    };

    const resetDraftFilters = () => {
        setDraftFilters({
            building: [],
            floor: [],
            rooms: [],
        });
    };

    const clearAppliedFilters = () => {
        navigate({
            building: [],
            floor: [],
            rooms: [],
            page: 1,
        });
    };

    const sortIcon = (column: SortableColumn) => {
        if (filters.sortBy !== column) {
            return <span className="text-[10px] text-muted-foreground">↕</span>;
        }

        return (
            <span className="text-[10px] text-foreground">
                {filters.sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const priceFormatter = new Intl.NumberFormat('ru-RU');
    const squareFormatter = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    const renderRoomLabel = (value: number) => {
        return value === 0 ? 'Студия' : `${value} комн.`;
    };

    return (
        <AdminLayout title="Квартиры" breadcrumbs={breadcrumbs}>
            <Head title="Квартиры" />

            <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
                        <input
                            id="search"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Поиск, например 1886"
                            className="h-10 w-full max-w-md rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary"
                        />

                        <button
                            type="submit"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Найти"
                            title="Найти"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    aria-label="Количество строк"
                                    title="Количество строк"
                                >
                                    <Settings2 className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuLabel>Строк на странице</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                    value={String(filters.perPage)}
                                    onValueChange={(value) =>
                                        navigate({
                                            perPage: Number(value),
                                            page: 1,
                                        })
                                    }
                                >
                                    {perPageOptions.map((option) => (
                                        <DropdownMenuRadioItem key={option} value={String(option)}>
                                            {option} / стр.
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu open={filtersOpen} onOpenChange={setFiltersOpen}>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    aria-label="Фильтры"
                                    title="Фильтры"
                                >
                                    <Filter className="h-4 w-4" />
                                    {activeFiltersCount > 0 ? (
                                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-foreground" />
                                    ) : null}
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="start" className="w-72">
                                <div className="space-y-4 p-1">
                                    <div>
                                        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Корпус
                                        </div>
                                        <div className="max-h-36 overflow-y-auto">
                                            {filterOptions.building.map((value) => (
                                                <DropdownMenuCheckboxItem
                                                    key={`building-${value}`}
                                                    checked={draftFilters.building.includes(value)}
                                                    onCheckedChange={() => toggleDraftFilterValue('building', value)}
                                                    onSelect={(event) => event.preventDefault()}
                                                >
                                                    Корпус {value}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Этаж
                                        </div>
                                        <div className="max-h-36 overflow-y-auto">
                                            {filterOptions.floor.map((value) => (
                                                <DropdownMenuCheckboxItem
                                                    key={`floor-${value}`}
                                                    checked={draftFilters.floor.includes(value)}
                                                    onCheckedChange={() => toggleDraftFilterValue('floor', value)}
                                                    onSelect={(event) => event.preventDefault()}
                                                >
                                                    Этаж {value}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Комнаты
                                        </div>
                                        <div className="max-h-36 overflow-y-auto">
                                            {filterOptions.rooms.map((value) => (
                                                <DropdownMenuCheckboxItem
                                                    key={`rooms-${value}`}
                                                    checked={draftFilters.rooms.includes(value)}
                                                    onCheckedChange={() => toggleDraftFilterValue('rooms', value)}
                                                    onSelect={(event) => event.preventDefault()}
                                                >
                                                    {renderRoomLabel(value)}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </div>
                                    </div>

                                    <DropdownMenuSeparator />

                                    <div className="flex items-center justify-between gap-2 px-1">
                                        <button
                                            type="button"
                                            onClick={resetDraftFilters}
                                            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            Сбросить
                                        </button>

                                        <button
                                            type="button"
                                            onClick={applyDraftFilters}
                                            className="inline-flex h-9 items-center rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                                        >
                                            Применить
                                        </button>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </form>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
                                >
                                    <span>Действия</span>
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Добавить квартиру
                                </DropdownMenuItem>

                                <DropdownMenuItem className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Экспорт квартир
                                </DropdownMenuItem>

                                <DropdownMenuItem className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Импорт квартир
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300">
                                    <Trash2 className="h-4 w-4" />
                                    Удалить все квартиры
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {activeFiltersCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.building.length > 0 ? (
                            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                Корпус: {filters.building.join(', ')}
                            </span>
                        ) : null}

                        {filters.floor.length > 0 ? (
                            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                Этаж: {filters.floor.join(', ')}
                            </span>
                        ) : null}

                        {filters.rooms.length > 0 ? (
                            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                                Комнаты: {filters.rooms.map((value) => renderRoomLabel(value)).join(', ')}
                            </span>
                        ) : null}

                        <button
                            type="button"
                            onClick={clearAppliedFilters}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-3 w-3" />
                            Сбросить фильтры
                        </button>
                    </div>
                ) : null}

                {flats.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                        <h2 className="text-base font-medium">Квартиры не найдены</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить параметры поиска.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/20 text-left">
                                        <th className="w-12 px-3 py-3">
                                            <Checkbox
                                                checked={allCurrentPageSelected ? true : someCurrentPageSelected ? 'indeterminate' : false}
                                                onCheckedChange={handleSelectAllCurrentPage}
                                                aria-label="Выбрать все строки на странице"
                                            />
                                        </th>

                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('id')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                ID
                                                {sortIcon('id')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('building')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Корпус
                                                {sortIcon('building')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('floor')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Этаж
                                                {sortIcon('floor')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('number')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Квартира
                                                {sortIcon('number')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('rooms_number')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Комнат
                                                {sortIcon('rooms_number')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('square')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Площадь
                                                {sortIcon('square')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('price')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Цена
                                                {sortIcon('price')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('sold')}
                                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                                            >
                                                Статус
                                                {sortIcon('sold')}
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 font-medium text-foreground/80">Slug</th>
                                        <th className="px-3 py-3 font-medium text-foreground/80">Карточка</th>
                                        <th className="w-14 px-3 py-3 text-right"></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {flats.data.map((flat) => {
                                        const isSelected = selectedIds.includes(flat.id);

                                        return (
                                            <tr key={flat.id} className={`border-b last:border-b-0 ${isSelected ? 'bg-muted/20' : ''}`}>
                                                <td className="px-3 py-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => handleSelectRow(flat.id, checked)}
                                                        aria-label={`Выбрать квартиру ${flat.id}`}
                                                    />
                                                </td>

                                                <td className="whitespace-nowrap px-3 py-3">{flat.id}</td>
                                                <td className="whitespace-nowrap px-3 py-3">{flat.building}</td>
                                                <td className="whitespace-nowrap px-3 py-3">{flat.floor}</td>
                                                <td className="whitespace-nowrap px-3 py-3">{flat.number}</td>
                                                <td className="whitespace-nowrap px-3 py-3">{flat.rooms}</td>
                                                <td className="whitespace-nowrap px-3 py-3">{squareFormatter.format(flat.square)} м²</td>
                                                <td className="whitespace-nowrap px-3 py-3">{priceFormatter.format(flat.price)} ₽</td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                                            flat.sold
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                    >
                                                        {flat.sold ? 'Продана' : 'Доступна'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">
                                                    {flat.slug}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <a
                                                        href={route('apartments.show', flat.slug)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                                                    >
                                                        Открыть
                                                    </a>
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                aria-label={`Действия для квартиры ${flat.id}`}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem className="gap-2">
                                                                <Pencil className="h-4 w-4" />
                                                                Редактировать
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem className="gap-2">
                                                                <EyeOff className="h-4 w-4" />
                                                                Скрыть
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300">
                                                                <Trash2 className="h-4 w-4" />
                                                                Удалить
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                {flats.from ?? 0}–{flats.to ?? 0} из {flats.total}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {flats.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={`${link.label}-${index}`}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex min-w-9 items-center justify-center rounded-md px-3 py-2 text-sm transition-colors ${
                                                link.active
                                                    ? 'bg-foreground text-background'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    ) : (
                                        <span
                                            key={`${link.label}-${index}`}
                                            className="inline-flex min-w-9 items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50"
                                        >
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                    </>
                )}

                {selectedIds.length > 0 ? (
                    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
                        <div className="flex items-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
                            <span className="px-2 text-sm text-muted-foreground">
                                Выбрано: <span className="font-medium text-foreground">{selectedIds.length}</span>
                            </span>

                            <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <EyeOff className="h-4 w-4" />
                                Скрыть
                            </button>

                            <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Проданы
                            </button>

                            <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                                <Trash2 className="h-4 w-4" />
                                Удалить
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
}