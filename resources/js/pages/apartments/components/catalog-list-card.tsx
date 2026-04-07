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
            className="group block rounded-[22px] border border-[#eceef3] bg-white px-6 py-6 shadow-[0_16px_38px_rgba(26,36,49,0.04)] transition hover:-translate-y-0.5 hover:border-[#d7be99] hover:shadow-[0_18px_45px_rgba(26,36,49,0.08)]"
        >
            <div className="grid gap-6 md:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(240px,1fr)_minmax(520px,1.35fr)_minmax(180px,220px)] xl:items-center">
                <div className="flex h-[160px] items-center justify-center md:h-[180px]">
                    {flat.plan ? (
                        <img src={flat.plan} alt={`План квартиры №${flat.number}`} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-sm text-[#9ca1aa]">План отсутствует</div>
                    )}
                </div>

                <div className="space-y-3 md:self-center">
                    <p className="text-[22px] font-semibold text-[#3e4658]">
                        {getRoomsLabel(flat.rooms)}, {formatArea(flat.square)}
                    </p>

                    <p className="text-[18px] text-[#1A2431]">{flat.finishing ?? '—'}</p>
                </div>

                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 md:col-span-2 lg:grid-cols-3 xl:col-span-1 xl:grid-cols-[repeat(4,minmax(72px,auto))_minmax(150px,auto)] xl:items-start">
                    <div className="space-y-1">
                        <p className="text-[16px] text-[#7f8594]">Корпус:</p>
                        <p className="text-[18px] text-[#1A2431]">{flat.building}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[16px] text-[#7f8594]">Подъезд:</p>
                        <p className="text-[18px] text-[#1A2431]">{flat.entrance ?? '—'}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[16px] text-[#7f8594]">Этаж:</p>
                        <p className="text-[18px] text-[#1A2431]">{flat.floor}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[16px] text-[#7f8594]">Номер:</p>
                        <p className="text-[18px] text-[#1A2431]">{flat.number}</p>
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                        <p className="text-[16px] whitespace-nowrap text-[#7f8594]">Цена за м²:</p>
                        <p className="text-[18px] whitespace-nowrap text-[#1A2431]">{formatPrice(flat.pricePerMeter).replace(' ₽', ' ₽/м²')}</p>
                    </div>
                </div>

                <div className="md:col-span-2 xl:col-span-1 xl:border-l xl:border-[#dfe3ee] xl:pl-8">
                    <p className="text-[24px] font-semibold text-[#0f2344]">{formatPrice(flat.price)}</p>
                </div>
            </div>
        </Link>
    );
}
