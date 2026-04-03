import FlatActionsDropdown from '@/pages/Admin/Flats/components/flat-actions-dropdown';
import FlatPlanPreview from '@/pages/Admin/Flats/components/flat-plan-preview';
import type { Flat } from '@/pages/Admin/Flats/types';
import {
    getPricePerSquare,
    getRoomLabel,
    priceFormatter,
    squareFormatter,
} from '@/pages/Admin/Flats/utils';

type Props = {
    flats: Flat[];
};

function ListMetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </div>
            <div className="mt-1 truncate text-sm font-medium text-foreground">
                {value}
            </div>
        </div>
    );
}

export default function FlatsListView({ flats }: Props) {
    return (
        <div className="space-y-4">
            {flats.map((flat) => {
                const pricePerSquare = getPricePerSquare(flat.price, flat.square);

                return (
                    <div
                        key={flat.id}
                        className="grid gap-4 rounded-2xl border p-4 transition-colors hover:bg-muted/20 xl:grid-cols-[180px_minmax(240px,1.1fr)_minmax(320px,1fr)_180px_56px] xl:items-center"
                    >
                        <div className="w-full">
                            <FlatPlanPreview
                                src={flat.plan}
                                alt={`План квартиры ${flat.number}`}
                            />
                        </div>

                        <div className="min-w-0">
                            <a
                                href={route('apartments.show', flat.slug)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-lg font-semibold text-foreground transition-colors hover:text-primary"
                            >
                                {getRoomLabel(flat.rooms)},{' '}
                                {squareFormatter.format(flat.square)} м²
                            </a>

                            <div className="mt-2 text-sm text-muted-foreground">
                                {flat.finishing && flat.finishing.trim() !== ''
                                    ? flat.finishing
                                    : '—'}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            <ListMetaItem label="Корпус" value={String(flat.building)} />
                            <ListMetaItem
                                label="Подъезд"
                                value={
                                    flat.entrance !== null && flat.entrance !== ''
                                        ? String(flat.entrance)
                                        : '—'
                                }
                            />
                            <ListMetaItem label="Этаж" value={String(flat.floor)} />
                            <ListMetaItem label="Номер" value={String(flat.number)} />
                            <ListMetaItem
                                label="Цена за м²"
                                value={
                                    pricePerSquare !== null
                                        ? `${priceFormatter.format(pricePerSquare)} ₽/м²`
                                        : '—'
                                }
                            />
                        </div>

                        <div className="xl:text-right">
                            <div className="text-2xl font-semibold tracking-tight">
                                {priceFormatter.format(flat.price)} ₽
                            </div>

                            <div className="mt-2">
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs ${
                                        flat.sold
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                >
                                    {flat.sold ? 'Продана' : 'Доступна'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end xl:justify-center">
                            <FlatActionsDropdown flat={flat} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}