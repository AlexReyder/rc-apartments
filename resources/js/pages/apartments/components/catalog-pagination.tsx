import { Link } from '@inertiajs/react';

import { cn } from '@/lib/utils';

import type { CatalogPaginatorLink } from './catalog-types';

type CatalogPaginationProps = {
    links: CatalogPaginatorLink[];
};

export default function CatalogPagination({ links }: CatalogPaginationProps) {
    if (links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-center gap-2">
            {links.map((link, index) => {
                const isDisabled = link.url === null;

                return (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url ?? '#'}
                        preserveScroll
                        className={cn(
                            'inline-flex min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm transition',
                            link.active
                                ? 'border-white bg-white text-[#1b3048]'
                                : 'border-white/15 bg-[#1a2d44] text-white/80 hover:border-white/35 hover:text-white',
                            isDisabled && 'pointer-events-none opacity-40',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}
