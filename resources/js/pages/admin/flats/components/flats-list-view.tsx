import FlatActionsDropdown from '@/pages/Admin/Flats/components/flat-actions-dropdown';
import FlatPlanPreview from '@/pages/Admin/Flats/components/flat-plan-preview';
import type { Flat } from '@/pages/Admin/Flats/types';
import { getRoomLabel, priceFormatter, squareFormatter } from '@/pages/Admin/Flats/utils';

type Props = {
    flats: Flat[];
};

function ListMetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">{label}</div>
            <div className="text-foreground mt-1 truncate text-sm font-medium">{value}</div>
        </div>
    );
}

export default function FlatsListView({ flats }: Props) {
    const renderStatus = (flat: Flat) => {
        if (flat.sold === 2) {
            return <span className="inline-flex rounded-full px-2 py-1 text-xs text-slate-500 dark:text-slate-400">Скрыта</span>;
        }

        if (flat.sold === 1) {
            return <span className="inline-flex rounded-full px-2 py-1 text-xs text-red-600 dark:text-red-400">Продана</span>;
        }

        return <span className="inline-flex rounded-full px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400">Доступна</span>;
    };

    return (
        <div className="space-y-4">
            {flats.map((flat) => {
                return (
                    <div
                        key={flat.id}
                        className="hover:bg-muted/20 grid gap-4 rounded-2xl border p-4 transition-colors xl:grid-cols-[180px_minmax(240px,1.1fr)_minmax(320px,1fr)_220px_56px] xl:items-center"
                    >
                        <div className="w-full">
                            <FlatPlanPreview src={flat.plan} alt={`План квартиры ${flat.number}`} />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <a
                                    href={route('apartments.show', flat.slug)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-foreground hover:text-primary inline-block text-lg font-semibold transition-colors"
                                >
                                    {getRoomLabel(flat.rooms)}, {squareFormatter.format(flat.square)} м²
                                </a>

                                {flat.action === 1 ? (
                                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">Аукцион</span>
                                ) : null}
                            </div>

                            <div className="text-muted-foreground mt-2 text-sm">
                                {flat.finishing && flat.finishing.trim() !== '' ? flat.finishing : '—'}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            <ListMetaItem label="Корпус" value={String(flat.building)} />
                            <ListMetaItem label="Подъезд" value={flat.entrance !== null && flat.entrance !== '' ? String(flat.entrance) : '—'} />
                            <ListMetaItem label="Этаж" value={String(flat.floor)} />
                            <ListMetaItem label="Номер" value={String(flat.number)} />
                            <ListMetaItem
                                label="Цена за м²"
                                value={flat.display_price_m2 !== null ? `${priceFormatter.format(flat.display_price_m2)} ₽/м²` : '—'}
                            />
                        </div>

                        <div className="xl:text-right">
                            <div className="text-2xl font-semibold tracking-tight">{priceFormatter.format(flat.display_price)} ₽</div>

                            <div className="text-muted-foreground mt-1 text-xs">
                                {flat.action === 1 ? 'Отображается аукционная цена' : 'Отображается обычная цена'}
                            </div>

                            <div className="mt-2">{renderStatus(flat)}</div>
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
