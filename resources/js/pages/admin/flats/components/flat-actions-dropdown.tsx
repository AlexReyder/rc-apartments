import { router } from '@inertiajs/react';
import {
    CheckCircle2,
    EyeOff,
    LoaderCircle,
    MoreVertical,
    Pencil,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

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

type ActionType = 'hide' | 'sold' | 'delete' | null;

export default function FlatActionsDropdown({ flat }: Props) {
    const [processingAction, setProcessingAction] = useState<ActionType>(null);

    const isProcessing = processingAction !== null;
    const isHidden = flat.sold === 2;
    const isSold = flat.sold === 1;

    const handleHide = () => {
        if (isProcessing || isHidden) {
            return;
        }

        setProcessingAction('hide');

        router.patch(
            route('admin.flats.hide', flat.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingAction(null);
                },
            },
        );
    };

    const handleMarkSold = () => {
        if (isProcessing || isSold) {
            return;
        }

        setProcessingAction('sold');

        router.patch(
            route('admin.flats.markSold', flat.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingAction(null);
                },
            },
        );
    };

    const handleDelete = () => {
        if (isProcessing) {
            return;
        }

        setProcessingAction('delete');

        router.delete(route('admin.flats.destroy', flat.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessingAction(null);
            },
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={isProcessing}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Действия для квартиры ${flat.id}`}
                >
                    {isProcessing ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreVertical className="h-4 w-4" />
                    )}
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

                <DropdownMenuItem disabled className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Редактировать
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={isProcessing || isHidden}
                    onSelect={(event) => {
                        event.preventDefault();
                        handleHide();
                    }}
                    className="gap-2"
                >
                    <EyeOff className="h-4 w-4" />
                    {isHidden ? 'Уже скрыта' : 'Скрыть'}
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={isProcessing || isSold}
                    onSelect={(event) => {
                        event.preventDefault();
                        handleMarkSold();
                    }}
                    className="gap-2"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSold ? 'Уже продана' : 'Продана'}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    disabled={isProcessing}
                    onSelect={(event) => {
                        event.preventDefault();
                        handleDelete();
                    }}
                    className="gap-2 text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}