import { Link } from '@inertiajs/react';

import type { CatalogFlat } from './catalog-types';
import { formatArea, formatPrice, getRoomsLabel } from './catalog-utils';

type CatalogGridCardProps = {
    flat: CatalogFlat;
};

export default function CatalogGridCard({ flat }: CatalogGridCardProps) {
    return (
        <Link
            href={route('apartments.show', flat.slug)}
            className="group block rounded-[28px] border border-white/10 bg-[#354d6c] p-5 transition hover:-translate-y-0.5 hover:border-[#d6a07b]/60 hover:bg-[#3b5679]"
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-white">Квартира №{flat.number}</h3>
                <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-[#1b3048]">Корпус {flat.building}</span>
            </div>

            <div className="mb-5 flex h-[280px] items-center justify-center rounded-[22px] bg-white/95 p-5">
                {flat.plan ? (
                    <img src={flat.plan} alt={`План квартиры №${flat.number}`} className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="text-sm text-slate-500">План отсутствует</div>
                )}
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-3xl font-semibold text-white">{formatPrice(flat.price)}</p>
                    <p className="text-base text-white/80">
                        {getRoomsLabel(flat.rooms)} · Этаж {flat.floor} · {formatArea(flat.square)}
                    </p>
                </div>

                {flat.entrance !== null ? <p className="text-sm text-white/55">Подъезд {flat.entrance}</p> : null}
            </div>
        </Link>
    );
}
