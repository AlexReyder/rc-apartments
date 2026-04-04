import { router } from '@inertiajs/react';
import { CheckCircle2, EyeOff, LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
    selectedIds: number[];
    onActionComplete: () => void;
};

type ActionType = 'hide' | 'sold' | 'delete' | null;

export default function SelectedFlatsBar({
    selectedIds,
    onActionComplete,
}: Props) {
    const [processingAction, setProcessingAction] = useState<ActionType>(null);

    const selectedCount = selectedIds.length;

    if (selectedCount <= 0) {
        return null;
    }

    const isProcessing = processingAction !== null;

    const handleBulkHide = () => {
        if (isProcessing || selectedCount <= 0) {
            return;
        }

        setProcessingAction('hide');

        router.patch(
            route('admin.flats.bulkHide'),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onActionComplete();
                },
                onFinish: () => {
                    setProcessingAction(null);
                },
            },
        );
    };

    const handleBulkMarkSold = () => {
        if (isProcessing || selectedCount <= 0) {
            return;
        }

        setProcessingAction('sold');

        router.patch(
            route('admin.flats.bulkMarkSold'),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onActionComplete();
                },
                onFinish: () => {
                    setProcessingAction(null);
                },
            },
        );
    };

    const handleBulkDelete = () => {
        if (isProcessing || selectedCount <= 0) {
            return;
        }

        setProcessingAction('delete');

        router.delete(route('admin.flats.bulkDestroy'), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => {
                onActionComplete();
            },
            onFinish: () => {
                setProcessingAction(null);
            },
        });
    };

    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <span className="px-2 text-sm text-muted-foreground">
                    Выбрано:{' '}
                    <span className="font-medium text-foreground">
                        {selectedCount}
                    </span>
                </span>

                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleBulkHide}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingAction === 'hide' ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <EyeOff className="h-4 w-4" />
                    )}
                    Скрыть
                </button>

                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleBulkMarkSold}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingAction === 'sold' ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4" />
                    )}
                    Продана
                </button>

                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleBulkDelete}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                    {processingAction === 'delete' ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                    Удалить
                </button>
            </div>
        </div>
    );
}