import type { Filters } from '@/pages/Admin/Flats/types';
import { getRoomLabel } from '@/pages/Admin/Flats/utils';
import { X } from 'lucide-react';

type Props = {
    filters: Filters;
    onClear: () => void;
};

export default function FlatsActiveFilters({ filters, onClear }: Props) {
    const hasFilters =
        filters.building.length > 0 ||
        filters.floor.length > 0 ||
        filters.rooms.length > 0;

    if (!hasFilters) {
        return null;
    }

    return (
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
                    Комнаты:{' '}
                    {filters.rooms.map((value) => getRoomLabel(value)).join(', ')}
                </span>
            ) : null}

            <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <X className="h-3 w-3" />
                Сбросить фильтры
            </button>
        </div>
    );
}