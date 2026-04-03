import { CheckCircle2, EyeOff, Trash2 } from 'lucide-react';

type Props = {
    selectedCount: number;
};

export default function SelectedFlatsBar({ selectedCount }: Props) {
    if (selectedCount <= 0) {
        return null;
    }

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
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <EyeOff className="h-4 w-4" />
                    Скрыть
                </button>

                <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    Проданы
                </button>

                <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                </button>
            </div>
        </div>
    );
}