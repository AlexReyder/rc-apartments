import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';

import type { CatalogFlat } from './catalog-types';
import { formatArea, formatPrice, getRoomsLabel } from './catalog-utils';

type CatalogGridCardProps = {
    flat: CatalogFlat;
};

export default function CatalogGridCard({ flat }: CatalogGridCardProps) {
    return (
        <Link
            href={route('apartments.show', flat.slug)}
            className="group block rounded-[22px] border border-[#456bf3] bg-white p-5 shadow-[0_18px_44px_rgba(26,36,49,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(26,36,49,0.08)]"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="space-y-2">
                    <div className="inline-flex rounded-md bg-[#42c7be] px-4 py-2 text-[18px] leading-none font-medium text-white">
                        № {flat.number}
                    </div>
                    <p className="text-[18px] text-[#8a8d98]">
                        Корпус {flat.building}
                        {flat.entrance !== null ? `, Секция ${flat.entrance}` : ''}, Этаж {flat.floor}
                    </p>
                </div>

                <MoreHorizontal className="size-5 text-[#c0c3cc] transition group-hover:text-[#456bf3]" />
            </div>

            <div className="mb-5 flex h-[320px] items-center justify-center">
                {flat.plan ? (
                    <img src={flat.plan} alt={`План квартиры №${flat.number}`} className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="text-sm text-[#9ca1aa]">План отсутствует</div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <p className="text-[18px] font-normal text-[#1A2431]">{getRoomsLabel(flat.rooms)}</p>
                    <p className="text-[18px] font-normal text-[#1A2431]">{formatArea(flat.square)}</p>
                </div>

                <div className="border-t border-[#eceef3] pt-4">
                    <p className="text-[24px] font-normal text-[#1A2431]">{formatPrice(flat.price)}</p>
                </div>
            </div>
        </Link>
    );
}
