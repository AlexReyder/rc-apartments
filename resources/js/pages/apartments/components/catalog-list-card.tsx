import { Link } from '@inertiajs/react';

import type { CatalogFlat } from './catalog-types';
import { formatArea, formatPrice, getRoomsLabel } from './catalog-utils';

type CatalogListCardProps = {
    flat: CatalogFlat;
};

export default function CatalogListCard({ flat }: CatalogListCardProps) {
    return (
        <Link
            href={route('apartments.show', flat.slug)}
            className="group block rounded-[28px] border border-white/10 bg-[#354d6c] p-5 transition hover:-translate-y-0.5 hover:border-[#d6a07b]/60 hover:bg-[#3b5679] sm:p-6"
        >
            <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)_240px] lg:items-center">
                <div className="flex h-[180px] items-center justify-center rounded-[22px] bg-white/95 p-4">
                    {flat.plan ? (
                        <img src={flat.plan} alt={`План квартиры №${flat.number}`} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-sm text-slate-500">План отсутствует</div>
                    )}
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-1">
                        <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Квартира</p>
                        <p className="text-2xl font-semibold text-white">№{flat.number}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Тип</p>
                        <p className="text-base text-white">{getRoomsLabel(flat.rooms)}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Корпус</p>
                        <p className="text-base text-white">{flat.building}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Этаж</p>
                        <p className="text-base text-white">{flat.floor}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Площадь</p>
                        <p className="text-base text-white">{formatArea(flat.square)}</p>
                    </div>

                    {flat.entrance !== null ? (
                        <div className="space-y-1">
                            <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Подъезд</p>
                            <p className="text-base text-white">{flat.entrance}</p>
                        </div>
                    ) : null}
                </div>

                <div className="border-white/10 lg:border-l lg:pl-8">
                    <p className="text-xs tracking-[0.2em] text-white/45 uppercase">Стоимость</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{formatPrice(flat.price)}</p>
                </div>
            </div>
        </Link>
    );
}
