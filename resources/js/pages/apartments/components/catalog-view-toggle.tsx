import { cn } from '@/lib/utils';
import { LayoutGrid, Rows3 } from 'lucide-react';

import type { CatalogViewMode } from './catalog-types';

type CatalogViewToggleProps = {
    view: CatalogViewMode;
    onChange: (view: CatalogViewMode) => void;
};

export default function CatalogViewToggle({ view, onChange }: CatalogViewToggleProps) {
    return (
        <div className="inline-flex rounded-full border border-white/20 bg-[#1a2d44] p-1">
            <button
                type="button"
                className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition',
                    view === 'list' ? 'bg-white text-[#1b3048]' : 'text-white/75 hover:text-white',
                )}
                onClick={() => onChange('list')}
            >
                <Rows3 className="size-4" />
                Списком
            </button>

            <button
                type="button"
                className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition',
                    view === 'grid' ? 'bg-white text-[#1b3048]' : 'text-white/75 hover:text-white',
                )}
                onClick={() => onChange('grid')}
            >
                <LayoutGrid className="size-4" />
                Плиткой
            </button>
        </div>
    );
}
