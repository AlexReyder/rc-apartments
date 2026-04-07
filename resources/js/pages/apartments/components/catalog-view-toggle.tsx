import { cn } from '@/lib/utils';
import { LayoutGrid, Rows3 } from 'lucide-react';

import type { CatalogViewMode } from './catalog-types';

type CatalogViewToggleProps = {
    view: CatalogViewMode;
    onChange: (view: CatalogViewMode) => void;
};

export default function CatalogViewToggle({ view, onChange }: CatalogViewToggleProps) {
    return (
        <div className="flex items-center gap-4 text-[18px] text-[#8f909a]">
            <span>Вид отображения</span>

            <div className="inline-flex items-center gap-5">
                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-2 transition',
                        view === 'grid' ? 'text-[#1A2431]' : 'text-[#8f909a] hover:text-[#1A2431]',
                    )}
                    onClick={() => onChange('grid')}
                >
                    <LayoutGrid className={cn('size-4', view === 'grid' ? 'text-[#456bf3]' : 'text-[#8f909a]')} />
                    Карточки
                </button>

                <button
                    type="button"
                    className={cn(
                        'inline-flex items-center gap-2 transition',
                        view === 'list' ? 'text-[#1A2431]' : 'text-[#8f909a] hover:text-[#1A2431]',
                    )}
                    onClick={() => onChange('list')}
                >
                    <Rows3 className={cn('size-4', view === 'list' ? 'text-[#456bf3]' : 'text-[#8f909a]')} />
                    Список
                </button>
            </div>
        </div>
    );
}
