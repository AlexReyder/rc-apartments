import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    processing: boolean;
};

export default function DeleteAllFlatsDialog({
    open,
    onOpenChange,
    onConfirm,
    processing,
}: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Удалить все квартиры?</DialogTitle>
                    <DialogDescription>
                        Это действие удалит все записи из таблицы квартир. Отменить его будет нельзя.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Отмена
                    </button>

                    <button
                        type="button"
                        disabled={processing}
                        onClick={onConfirm}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? 'Удаление...' : 'Подтвердить'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}