import { Checkbox } from '@/components/ui/checkbox';
import FlatActionsDropdown from '@/pages/Admin/Flats/components/flat-actions-dropdown';
import type { Flat, SortableColumn } from '@/pages/Admin/Flats/types';
import { priceFormatter, squareFormatter } from '@/pages/Admin/Flats/utils';

type Props = {
    flats: Flat[];
    selectedIds: number[];
    allCurrentPageSelected: boolean;
    someCurrentPageSelected: boolean;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    onSelectAllCurrentPage: (checked: boolean | 'indeterminate') => void;
    onSelectRow: (flatId: number, checked: boolean | 'indeterminate') => void;
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
            return <span className="text-muted-foreground text-[10px]">↕</span>;
        }

        return <span className="text-foreground text-[10px]">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const renderStatus = (flat: Flat) => {
        if (flat.sold === 2) {
            return <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">Скрыта</span>;
        }

        if (flat.sold === 1) {
            return <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-red-600 dark:text-red-400">Продана</span>;
        }

        return <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">Доступна</span>;
    };

    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="bg-muted/20 border-b text-left">
                        <th className="w-12 px-3 py-3">
                            <Checkbox
                                checked={allCurrentPageSelected ? true : someCurrentPageSelected ? 'indeterminate' : false}
                                onCheckedChange={onSelectAllCurrentPage}
                                aria-label="Выбрать все строки на странице"
                            />
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('id')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                ID
                                {sortIcon('id')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('building')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Корпус
                                {sortIcon('building')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('floor')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Этаж
                                {sortIcon('floor')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('number')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Квартира
                                {sortIcon('number')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('rooms_number')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Комнат
                                {sortIcon('rooms_number')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('square')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Площадь
                                {sortIcon('square')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('price')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Цена
                                {sortIcon('price')}
                            </button>
                        </th>

                        <th className="px-3 py-3">
                            <button
                                type="button"
                                onClick={() => onSort('sold')}
                                className="text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 font-medium"
                            >
                                Статус
                                {sortIcon('sold')}
                            </button>
                        </th>

                        <th className="text-foreground/80 px-3 py-3 font-medium">Slug</th>
                        <th className="text-foreground/80 px-3 py-3 font-medium">Карточка</th>
                        <th className="w-14 px-3 py-3 text-right"></th>
                    </tr>
                </thead>

                <tbody>
                    {flats.map((flat) => {
                        const isSelected = selectedIds.includes(flat.id);

                        return (
                            <tr key={flat.id} className={`border-b last:border-b-0 ${isSelected ? 'bg-muted/20' : ''}`}>
                                <td className="px-3 py-3">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => onSelectRow(flat.id, checked)}
                                        aria-label={`Выбрать квартиру ${flat.id}`}
                                    />
                                </td>

                                <td className="px-3 py-3 whitespace-nowrap">{flat.id}</td>
                                <td className="px-3 py-3 whitespace-nowrap">{flat.building}</td>
                                <td className="px-3 py-3 whitespace-nowrap">{flat.floor}</td>
                                <td className="px-3 py-3 whitespace-nowrap">{flat.number}</td>
                                <td className="px-3 py-3 whitespace-nowrap">{flat.rooms}</td>
                                <td className="px-3 py-3 whitespace-nowrap">{squareFormatter.format(flat.square)} м²</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span>{priceFormatter.format(flat.display_price)} ₽</span>

                                        {flat.display_price_m2 !== null ? (
                                            <span
                                                className={
                                                    flat.action === 1 ? 'text-xs text-amber-600 dark:text-amber-400' : 'text-muted-foreground text-xs'
                                                }
                                            >
                                                {flat.action === 1 ? 'Аукцион · ' : ''}
                                                {priceFormatter.format(flat.display_price_m2)} ₽/м²
                                            </span>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">{renderStatus(flat)}</td>
                                <td className="text-muted-foreground px-3 py-3 font-mono text-xs whitespace-nowrap">{flat.slug}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <a
                                        href={route('apartments.show', flat.slug)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
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
