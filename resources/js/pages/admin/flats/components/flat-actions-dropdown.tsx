import { EyeOff, MoreVertical, Pencil, Search, Trash2 } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Flat } from '@/pages/Admin/Flats/types';

type Props = {
    flat: Flat;
};

export default function FlatActionsDropdown({ flat }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Действия для квартиры ${flat.id}`}
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                    <a
                        href={route('apartments.show', flat.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Открыть карточку
                    </a>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Редактировать
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2">
                    <EyeOff className="h-4 w-4" />
                    Скрыть
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300">
                    <Trash2 className="h-4 w-4" />
                    Удалить
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}