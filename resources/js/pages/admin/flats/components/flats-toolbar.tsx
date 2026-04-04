import {
    Download,
    Filter,
    List,
    MoreVertical,
    Plus,
    Search,
    Settings2,
    Table2,
    Trash2,
    Upload,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

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
import CreateFlatDialog from '@/pages/Admin/Flats/components/create-flat-dialog';
import type {
    DraftFilters,
    FilterOptions,
    Filters,
    ViewMode,
} from '@/pages/Admin/Flats/types';
import { getRoomLabel, perPageOptions } from '@/pages/Admin/Flats/utils';

type Props = {
    searchValue: string;
    onSearchValueChange: (value: string) => void;
    onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
    filters: Filters;
    filterOptions: FilterOptions;
    activeFiltersCount: number;
    filtersOpen: boolean;
    onFiltersOpenChange: (open: boolean) => void;
    draftFilters: DraftFilters;
    onToggleDraftFilterValue: (
        group: keyof DraftFilters,
        value: number,
    ) => void;
    onApplyDraftFilters: () => void;
    onResetDraftFilters: () => void;
    onPerPageChange: (value: number) => void;
    onViewChange: (value: ViewMode) => void;
};

export default function FlatsToolbar({
    searchValue,
    onSearchValueChange,
    onSearchSubmit,
    filters,
    filterOptions,
    activeFiltersCount,
    filtersOpen,
    onFiltersOpenChange,
    draftFilters,
    onToggleDraftFilterValue,
    onApplyDraftFilters,
    onResetDraftFilters,
    onPerPageChange,
    onViewChange,
}: Props) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const currentViewIcon =
        filters.view === 'list' ? (
            <List className="h-4 w-4" />
        ) : (
            <Table2 className="h-4 w-4" />
        );

    return (
        <>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <form onSubmit={onSearchSubmit} className="flex flex-1 items-center gap-2">
                    <input
                        id="search"
                        value={searchValue}
                        onChange={(event) => onSearchValueChange(event.target.value)}
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
                                onValueChange={(value) => onPerPageChange(Number(value))}
                            >
                                {perPageOptions.map((option) => (
                                    <DropdownMenuRadioItem
                                        key={option}
                                        value={String(option)}
                                    >
                                        {option} / стр.
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu open={filtersOpen} onOpenChange={onFiltersOpenChange}>
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
                                                onCheckedChange={() =>
                                                    onToggleDraftFilterValue('building', value)
                                                }
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
                                                onCheckedChange={() =>
                                                    onToggleDraftFilterValue('floor', value)
                                                }
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
                                                onCheckedChange={() =>
                                                    onToggleDraftFilterValue('rooms', value)
                                                }
                                                onSelect={(event) => event.preventDefault()}
                                            >
                                                {getRoomLabel(value)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                </div>

                                <DropdownMenuSeparator />

                                <div className="flex items-center justify-between gap-2 px-1">
                                    <button
                                        type="button"
                                        onClick={onResetDraftFilters}
                                        className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        Сбросить
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onApplyDraftFilters}
                                        className="inline-flex h-9 items-center rounded-lg bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                                    >
                                        Применить
                                    </button>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Режим отображения"
                                title="Режим отображения"
                            >
                                {currentViewIcon}
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Режим просмотра</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup
                                value={filters.view}
                                onValueChange={(value) => onViewChange(value as ViewMode)}
                            >
                                <DropdownMenuRadioItem value="table">
                                    <div className="flex items-center gap-2">
                                        <Table2 className="h-4 w-4" />
                                        <span>Таблица</span>
                                    </div>
                                </DropdownMenuRadioItem>

                                <DropdownMenuRadioItem value="list">
                                    <div className="flex items-center gap-2">
                                        <List className="h-4 w-4" />
                                        <span>Список</span>
                                    </div>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
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
                            <DropdownMenuItem
                                className="gap-2"
                                onClick={() => setCreateDialogOpen(true)}
                            >
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

            <CreateFlatDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </>
    );
}