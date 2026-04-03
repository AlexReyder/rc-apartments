import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import FlatsActiveFilters from '@/pages/Admin/Flats/components/flats-active-filters';
import FlatsListView from '@/pages/Admin/Flats/components/flats-list-view';
import FlatsPagination from '@/pages/Admin/Flats/components/flats-pagination';
import FlatsTableView from '@/pages/Admin/Flats/components/flats-table-view';
import FlatsToolbar from '@/pages/Admin/Flats/components/flats-toolbar';
import SelectedFlatsBar from '@/pages/Admin/Flats/components/selected-flats-bar';
import type {
    DraftFilters,
    FlatsPageProps,
    NavigateParams,
    SortableColumn,
    ViewMode,
} from '@/pages/Admin/Flats/types';
import { type BreadcrumbItem } from '@/types';

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

export default function AdminFlatsIndex({
    filters,
    filterOptions,
    flats,
}: FlatsPageProps) {
    const [searchValue, setSearchValue] = useState(filters.search);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<DraftFilters>({
        building: filters.building,
        floor: filters.floor,
        rooms: filters.rooms,
    });

    useEffect(() => {
        setSearchValue(filters.search);
    }, [filters.search]);

    useEffect(() => {
        setSelectedIds([]);
    }, [flats.data, filters.view]);

    useEffect(() => {
        if (!filtersOpen) {
            setDraftFilters({
                building: filters.building,
                floor: filters.floor,
                rooms: filters.rooms,
            });
        }
    }, [filters, filtersOpen]);

    const currentPageIds = useMemo(
        () => flats.data.map((flat) => flat.id),
        [flats.data],
    );

    const allCurrentPageSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) => selectedIds.includes(id));

    const someCurrentPageSelected =
        currentPageIds.some((id) => selectedIds.includes(id)) &&
        !allCurrentPageSelected;

    const activeFiltersCount =
        filters.building.length + filters.floor.length + filters.rooms.length;

    const navigate = (overrides: NavigateParams = {}) => {
        router.get(
            route('admin.flats.index'),
            {
                search: overrides.search ?? filters.search,
                perPage: overrides.perPage ?? filters.perPage,
                sortBy: overrides.sortBy ?? filters.sortBy,
                sortDirection:
                    overrides.sortDirection ?? filters.sortDirection,
                view: overrides.view ?? filters.view,
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

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        navigate({
            search: searchValue.trim(),
            page: 1,
        });
    };

    const handleSort = (column: SortableColumn) => {
        const nextDirection: 'asc' | 'desc' =
            filters.sortBy === column && filters.sortDirection === 'asc'
                ? 'desc'
                : 'asc';

        navigate({
            sortBy: column,
            sortDirection: nextDirection,
            page: 1,
        });
    };

    const handleSelectAllCurrentPage = (
        checked: boolean | 'indeterminate',
    ) => {
        if (checked === true) {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
            return;
        }

        setSelectedIds((prev) =>
            prev.filter((id) => !currentPageIds.includes(id)),
        );
    };

    const handleSelectRow = (
        flatId: number,
        checked: boolean | 'indeterminate',
    ) => {
        if (checked === true) {
            setSelectedIds((prev) =>
                prev.includes(flatId) ? prev : [...prev, flatId],
            );
            return;
        }

        setSelectedIds((prev) => prev.filter((id) => id !== flatId));
    };

    const toggleDraftFilterValue = (
        group: keyof DraftFilters,
        value: number,
    ) => {
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

    const handlePerPageChange = (value: number) => {
        navigate({
            perPage: value,
            page: 1,
        });
    };

    const handleViewChange = (value: ViewMode) => {
        navigate({
            view: value,
            page: 1,
        });
    };

    return (
        <AdminLayout title="Квартиры" breadcrumbs={breadcrumbs}>
            <Head title="Квартиры" />

            <div className="space-y-4">
                <FlatsToolbar
                    searchValue={searchValue}
                    onSearchValueChange={setSearchValue}
                    onSearchSubmit={handleSearchSubmit}
                    filters={filters}
                    filterOptions={filterOptions}
                    activeFiltersCount={activeFiltersCount}
                    filtersOpen={filtersOpen}
                    onFiltersOpenChange={setFiltersOpen}
                    draftFilters={draftFilters}
                    onToggleDraftFilterValue={toggleDraftFilterValue}
                    onApplyDraftFilters={applyDraftFilters}
                    onResetDraftFilters={resetDraftFilters}
                    onPerPageChange={handlePerPageChange}
                    onViewChange={handleViewChange}
                />

                <FlatsActiveFilters
                    filters={filters}
                    onClear={clearAppliedFilters}
                />

                {flats.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                        <h2 className="text-base font-medium">
                            Квартиры не найдены
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Попробуйте изменить параметры поиска.
                        </p>
                    </div>
                ) : (
                    <>
                        {filters.view === 'table' ? (
                            <FlatsTableView
                                flats={flats.data}
                                selectedIds={selectedIds}
                                allCurrentPageSelected={allCurrentPageSelected}
                                someCurrentPageSelected={someCurrentPageSelected}
                                sortBy={filters.sortBy}
                                sortDirection={filters.sortDirection}
                                onSort={handleSort}
                                onSelectAllCurrentPage={handleSelectAllCurrentPage}
                                onSelectRow={handleSelectRow}
                            />
                        ) : (
                            <FlatsListView flats={flats.data} />
                        )}

                        <FlatsPagination flats={flats} />
                    </>
                )}

                {filters.view === 'table' ? (
                    <SelectedFlatsBar selectedCount={selectedIds.length} />
                ) : null}
            </div>
        </AdminLayout>
    );
}