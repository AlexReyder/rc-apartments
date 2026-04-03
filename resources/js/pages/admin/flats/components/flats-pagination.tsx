import { Link } from '@inertiajs/react';

import type { FlatsPagination } from '@/pages/Admin/Flats/types';

type Props = {
    flats: FlatsPagination;
};

export default function FlatsPagination({ flats }: Props) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
                {flats.from ?? 0}–{flats.to ?? 0} из {flats.total}
            </div>

            <div className="flex flex-wrap gap-2">
                {flats.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={`${link.label}-${index}`}
                            href={link.url}
                            preserveScroll
                            className={`inline-flex min-w-9 items-center justify-center rounded-md px-3 py-2 text-sm transition-colors ${
                                link.active
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Link>
                    ) : (
                        <span
                            key={`${link.label}-${index}`}
                            className="inline-flex min-w-9 items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50"
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}