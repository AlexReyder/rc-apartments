import { Checkbox } from '@/components/ui/checkbox';
import FlatActionsDropdown from '@/pages/Admin/Flats/components/flat-actions-dropdown';
import type {
    Flat,
    SortableColumn,
} from '@/pages/Admin/Flats/types';
import {
    priceFormatter,
    squareFormatter,
} from '@/pages/Admin/Flats/utils';

type Props = {
    flats: Flat[];
    selectedIds: number[];
    allCurrentPageSelected: boolean;
    someCurrentPageSelected: boolean;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    onSelectAllCurrentPage: (checked: boolean | 'indeterminate') => void;
    onSelectRow: (
        flatId: number,
        checked: boolean | 'indeterminate',
    ) => void;
};

export default function FlatsTableView({
    flats,
    selectedIds,
    allCurrentPageSelected,
    someCurrentPageSelected,
    sortBy,
    sortDirection,
    onSort,
    onSelectAllCurrentPage,
    onSelectRow,
}: Props) {
    const sortIcon = (column: SortableColumn) => {
        if (sortBy !== column) {
            return <span className="text-[10px] text-muted-foreground">↕</span>;
        }

        return (
            <span className="text-[10px] text-foreground">
                {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const renderStatus = (flat: Flat) => {
        if (flat.sold === 2) {
            return (
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Скрыта
                </span>
            );
        }

        if (flat.sold === 1) {
            return (
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                    Продана
                </span>
            );
        }

        return (
            <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                Доступна
            </span>
        );
    };

    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/20 text-left">
                        <th className="w-12 px-3 py-3">
                            <Checkbox
                                checked={
                                    allCurrentPageSelected
                                        ? true
                                        : someCurrentPageSelected
                                          ? 'indeterminate'
                                          : false
                                }
                                onCheckedChange={onSelectAllCurrentPage}
                                aria-label="Выбрать все строки на странице"
                            />
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('id')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                ID
                                {sortIcon('id')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('building')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Корпус
                                {sortIcon('building')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('floor')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Этаж
                                {sortIcon('floor')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('number')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Квартира
                                {sortIcon('number')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('rooms_number')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Комнат
                                {sortIcon('rooms_number')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('square')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Площадь
                                {sortIcon('square')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('price')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Цена
                                {sortIcon('price')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('sold')}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground/80 hover:text-foreground"
                            >
                                Статус
                                {sortIcon('sold')}
                            </button>
                        </th>

                        <th className="px-3 py-3 font-medium text-foreground/80">
                            Slug
                        </th>
                        <th className="px-3 py-3 font-medium text-foreground/80">
                            Карточка
                        </th>
                        <th className="w-14 px-3 py-3 text-right"></th>
                    </tr>
                </thead>

                <tbody>
                    {flats.map((flat) => {
                        const isSelected = selectedIds.includes(flat.id);

                        return (
                            <tr
                                key={flat.id}
                                className={`border-b last:border-b-0 ${isSelected ? 'bg-muted/20' : ''}`}
                            >
                                <td className="px-3 py-3">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) =>
                                            onSelectRow(flat.id, checked)
                                        }
                                        aria-label={`Выбрать квартиру ${flat.id}`}
                                    />
                                </td>

                                <td className="whitespace-nowrap px-3 py-3">{flat.id}</td>
                                <td className="whitespace-nowrap px-3 py-3">{flat.building}</td>
                                <td className="whitespace-nowrap px-3 py-3">{flat.floor}</td>
                                <td className="whitespace-nowrap px-3 py-3">{flat.number}</td>
                                <td className="whitespace-nowrap px-3 py-3">{flat.rooms}</td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {squareFormatter.format(flat.square)} м²
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {priceFormatter.format(flat.price)} ₽
                                </td>
                                <td className="whitespace-nowrap px-3 py-3">
                                    {renderStatus(flat)}
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
                                    <FlatActionsDropdown flat={flat} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}