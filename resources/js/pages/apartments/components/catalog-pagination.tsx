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
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {links.map((link, index) => {
                const isDisabled = link.url === null;

                return (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url ?? '#'}
                        preserveScroll
                        className={cn(
                            'inline-flex min-w-11 items-center justify-center rounded-lg border px-4 py-2 text-sm transition',
                            link.active
                                ? 'border-[#456bf3] bg-[#456bf3] text-white'
                                : 'border-[#d9dde6] bg-white text-[#5f6170] hover:border-[#456bf3] hover:text-[#1A2431]',
                            isDisabled && 'pointer-events-none opacity-40',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}
