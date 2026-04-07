import { Link } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';

import type { CatalogFlat } from './catalog-types';
import { formatArea, formatPrice, getRoomsLabel } from './catalog-utils';

type CatalogListCardProps = {
    flat: CatalogFlat;
};

export default function CatalogListCard({ flat }: CatalogListCardProps) {
    return (
        <Link
            href={route('apartments.show', flat.slug)}
            className="group block rounded-[22px] border border-[#eceef3] bg-white px-5 py-5 shadow-[0_16px_38px_rgba(26,36,49,0.04)] transition hover:-translate-y-0.5 hover:border-[#d7be99] hover:shadow-[0_18px_45px_rgba(26,36,49,0.08)] sm:px-6 sm:py-6"
        >
            <div className="grid gap-6 xl:grid-cols-[130px_1.1fr_1.4fr_260px_60px] xl:items-center">
                <div className="flex flex-col items-start gap-3">
                    <div className="rounded-md bg-[#42c7be] px-4 py-2 text-[18px] leading-none font-medium text-white">№ {flat.number}</div>

                    <div className="flex h-[102px] w-full items-center justify-center">
                        {flat.plan ? (
                            <img src={flat.plan} alt={`План квартиры №${flat.number}`} className="max-h-full max-w-full object-contain" />
                        ) : (
                            <div className="text-sm text-[#9ca1aa]">План отсутствует</div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[21px] font-normal text-[#1A2431]">{getRoomsLabel(flat.rooms)}</p>
                    {flat.entrance !== null ? <p className="text-[18px] text-[#8a8d98]">Секция {flat.entrance}</p> : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-4">
                    <div className="space-y-1">
                        <p className="text-[16px] text-[#9b9da7]">Площадь</p>
                        <p className="text-[20px] font-semibold text-[#1A2431]">{formatArea(flat.square)}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[16px] text-[#9b9da7]">Корпус</p>
                        <p className="text-[20px] font-semibold text-[#1A2431]">{flat.building}</p>
                    </div>

                    {flat.entrance !== null ? (
                        <div className="space-y-1">
                            <p className="text-[16px] text-[#9b9da7]">Секция</p>
                            <p className="text-[20px] font-semibold text-[#1A2431]">{flat.entrance}</p>
                        </div>
                    ) : null}

                    <div className="space-y-1">
                        <p className="text-[16px] text-[#9b9da7]">Этаж</p>
                        <p className="text-[20px] font-semibold text-[#1A2431]">{flat.floor}</p>
                    </div>
                </div>

                <div className="border-[#dfe3ee] xl:border-l xl:pl-8">
                    <p className="text-[16px] text-[#b7bac4] line-through">{formatPrice(Math.round(flat.price * 1.18))}</p>
                    <p className="mt-1 text-[24px] font-normal text-[#1A2431]">{formatPrice(flat.price)}</p>
                </div>

                <div className="flex justify-end text-[#b3b6c0]">
                    <MoreHorizontal className="size-6 transition group-hover:text-[#456bf3]" />
                </div>
            </div>
        </Link>
    );
}
