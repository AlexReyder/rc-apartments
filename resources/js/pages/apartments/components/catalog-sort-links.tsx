import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

import type { CatalogSortBy, CatalogSortDirection } from './catalog-types';

type CatalogSortLinksProps = {
    sortBy: CatalogSortBy;
    sortDirection: CatalogSortDirection;
    onChange: (sortBy: CatalogSortBy) => void;
};

const items: Array<{ key: CatalogSortBy; label: string }> = [
    { key: 'price', label: 'Стоимость' },
    { key: 'square', label: 'Площадь' },
    { key: 'floor', label: 'Этаж' },
];

export default function CatalogSortLinks({ sortBy, sortDirection, onChange }: CatalogSortLinksProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[18px] text-[#8f909a]">
            <span>Сортировать по</span>

            {items.map((item) => {
                const isActive = item.key === sortBy;

                return (
                    <button
                        key={item.key}
                        type="button"
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full transition',
                            isActive ? 'text-[#456bf3]' : 'text-[#7d7f8a] hover:text-[#1A2431]',
                        )}
                        onClick={() => onChange(item.key)}
                    >
                        <span>{item.label}</span>

                        {isActive ? sortDirection === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" /> : null}
                    </button>
                );
            })}
        </div>
    );
}
