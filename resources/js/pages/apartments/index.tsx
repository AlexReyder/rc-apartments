import { Head, router } from '@inertiajs/react';
import { useCallback } from 'react';

import PublicLayout from '@/layouts/public-layout';

import CatalogFilters from './components/catalog-filters';
import CatalogGridCard from './components/catalog-grid-card';
import CatalogListCard from './components/catalog-list-card';
import CatalogPagination from './components/catalog-pagination';
import CatalogSortLinks from './components/catalog-sort-links';
import type {
    CatalogFilterMeta,
    CatalogFilters as CatalogFiltersType,
    CatalogFlat,
    CatalogPaginator,
    CatalogSortBy,
    CatalogViewMode,
} from './components/catalog-types';
import CatalogViewToggle from './components/catalog-view-toggle';

type Props = {
    filters: CatalogFiltersType;
    filterMeta: CatalogFilterMeta;
    flats: CatalogPaginator<CatalogFlat>;
};

function buildCatalogQuery(filters: CatalogFiltersType) {
    const query: Record<string, unknown> = {};

    if (filters.rooms.length > 0) {
        query.rooms = filters.rooms;
    }

    if (filters.building.length > 0) {
        query.building = filters.building;
    }

    if (filters.priceFrom !== null) {
        query.priceFrom = filters.priceFrom;
    }

    if (filters.priceTo !== null) {
        query.priceTo = filters.priceTo;
    }

    if (filters.areaFrom !== null) {
        query.areaFrom = filters.areaFrom;
    }

    if (filters.areaTo !== null) {
        query.areaTo = filters.areaTo;
    }

    if (filters.floorFrom !== null) {
        query.floorFrom = filters.floorFrom;
    }

    if (filters.floorTo !== null) {
        query.floorTo = filters.floorTo;
    }

    if (filters.sortBy !== 'price') {
        query.sortBy = filters.sortBy;
    }

    if (filters.sortDirection !== 'asc') {
        query.sortDirection = filters.sortDirection;
    }

    if (filters.view !== 'list') {
        query.view = filters.view;
    }

    return query;
}

export default function ApartmentsIndex({ filters, filterMeta, flats }: Props) {
    const updateFilters = useCallback(
        (updates: Partial<CatalogFiltersType>) => {
            const nextFilters: CatalogFiltersType = {
                ...filters,
                ...updates,
            };

            router.get(route('apartments.index'), buildCatalogQuery(nextFilters), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['filters', 'filterMeta', 'flats'],
            });
        },
        [filters],
    );

    const handleSortChange = useCallback(
        (nextSortBy: CatalogSortBy) => {
            const nextDirection = filters.sortBy === nextSortBy ? (filters.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';

            updateFilters({
                sortBy: nextSortBy,
                sortDirection: nextDirection,
            });
        },
        [filters.sortBy, filters.sortDirection, updateFilters],
    );

    const handleViewChange = useCallback(
        (view: CatalogViewMode) => {
            updateFilters({
                view,
            });
        },
        [updateFilters],
    );

    const handleReset = useCallback(() => {
        router.get(
            route('apartments.index'),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ['filters', 'filterMeta', 'flats'],
            },
        );
    }, []);

    return (
        <PublicLayout>
            <Head title="Выбор квартир" />

            <div className="space-y-10 lg:space-y-12">
                <section className="space-y-8">
                    <div className="space-y-3">
                        <h1 className="max-w-4xl text-4xl font-medium tracking-tight text-[#5e6070] sm:text-5xl xl:text-6xl">ВЫБОР КВАРТИР</h1>
                    </div>

                    <CatalogFilters filters={filters} filterMeta={filterMeta} onFiltersChange={updateFilters} onReset={handleReset} />
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <CatalogSortLinks sortBy={filters.sortBy} sortDirection={filters.sortDirection} onChange={handleSortChange} />

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                            <p className="text-sm text-[#8d8e98]">
                                Показаны {flats.data.length} из {flats.total}
                            </p>

                            <CatalogViewToggle view={filters.view} onChange={handleViewChange} />
                        </div>
                    </div>

                    {flats.data.length > 0 ? (
                        <>
                            {filters.view === 'list' ? (
                                <div className="space-y-5">
                                    {flats.data.map((flat) => (
                                        <CatalogListCard key={flat.id} flat={flat} />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                    {flats.data.map((flat) => (
                                        <CatalogGridCard key={flat.id} flat={flat} />
                                    ))}
                                </div>
                            )}

                            <CatalogPagination links={flats.links} />
                        </>
                    ) : (
                        <div className="rounded-[28px] border border-[#dddfe6] bg-white px-6 py-16 text-center shadow-[0_18px_45px_rgba(26,36,49,0.05)]">
                            <h2 className="text-2xl font-semibold text-[#1A2431]">Подходящие квартиры не найдены</h2>
                            <p className="mt-3 text-[#7c7d86]">Измени параметры фильтрации или сбрось фильтры.</p>
                        </div>
                    )}
                </section>
            </div>
        </PublicLayout>
    );
}
