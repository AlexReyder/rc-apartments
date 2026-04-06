import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { FlatsImportResult } from '../types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type ImportFormData = {
    file: File | null;
    dry_run: '0' | '1';
};

type FlashProps = {
    flash?: {
        importResult?: FlatsImportResult | null;
    };
};

function SummaryCard({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="bg-muted/40 rounded-lg border p-3">
            <div className="text-muted-foreground text-xs tracking-wide uppercase">{label}</div>
            <div className="mt-1 text-sm font-medium">{value}</div>
        </div>
    );
}

export default function ImportFlatsDialog({ open, onOpenChange }: Props) {
    const page = usePage<FlashProps>();
    const flashImportResult = page.props.flash?.importResult ?? null;

    const [result, setResult] = useState<FlatsImportResult | null>(null);
    const [submitMode, setSubmitMode] = useState<'preview' | 'import' | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { data, setData, post, transform, processing, errors, reset, clearErrors } = useForm<ImportFormData>({
        file: null,
        dry_run: '1',
    });

    useEffect(() => {
        if (flashImportResult) {
            setResult(flashImportResult);
            onOpenChange(true);
        }
    }, [flashImportResult, onOpenChange]);

    const resetFormState = () => {
        reset();
        setResult(null);
        setSubmitMode(null);
        clearErrors();

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetFormState();
        }

        onOpenChange(nextOpen);
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0] ?? null;

        setData('file', nextFile);
        clearErrors('file');
    };

    const submit = (mode: 'preview' | 'import') => {
        setSubmitMode(mode);

        transform((currentData) => ({
            ...currentData,
            dry_run: mode === 'preview' ? '1' : '0',
        }));

        post(route('admin.flats.import'), {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                onOpenChange(true);
            },
        });
    };

    const actionLabel = result?.isDryRun ? 'Будет обновлено' : 'Обновлено';

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Импорт квартир из Excel</DialogTitle>
                    <DialogDescription>
                        Используйте файл, полученный через экспорт квартир. Импорт работает только по существующим ID и не создаёт новые записи.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="flats-import-file">Excel-файл</Label>
                        <input
                            ref={fileInputRef}
                            id="flats-import-file"
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="file:text-foreground text-muted-foreground block w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                        />
                        {errors.file ? <p className="text-xs text-red-600">{errors.file}</p> : null}
                        <p className="text-muted-foreground text-xs">Поддерживаются только XLSX/XLS в точном формате текущего экспорта.</p>
                    </div>

                    {result ? (
                        <div className="space-y-4 rounded-xl border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-medium">{result.isDryRun ? 'Результат проверки файла' : 'Результат импорта'}</div>
                                    <div className="text-muted-foreground mt-1 text-xs">Файл: {result.fileName}</div>
                                </div>

                                <div
                                    className={`rounded-md px-3 py-1 text-xs font-medium ${
                                        result.fatalError
                                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    }`}
                                >
                                    {result.fatalError ? 'Файл не прошёл проверку' : result.isDryRun ? 'Проверка выполнена' : 'Импорт выполнен'}
                                </div>
                            </div>

                            {result.fatalError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                                    {result.fatalError}
                                </div>
                            ) : null}

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <SummaryCard label="Обработано строк" value={result.processedRows} />
                                <SummaryCard label="Пустых строк" value={result.emptyRows} />
                                <SummaryCard label="Валидных строк" value={result.validRows} />
                                <SummaryCard label={actionLabel} value={result.updatedRows} />
                                <SummaryCard label="Без изменений" value={result.skippedRows} />
                                <SummaryCard label="Строк с ошибками" value={result.errorRows} />
                            </div>

                            {result.errors.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Ошибки импорта</div>

                                    <div className="overflow-hidden rounded-lg border">
                                        <div className="max-h-72 overflow-auto">
                                            <table className="w-full min-w-[720px] text-left text-sm">
                                                <thead className="bg-muted/60 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 font-medium">Строка</th>
                                                        <th className="px-3 py-2 font-medium">ID</th>
                                                        <th className="px-3 py-2 font-medium">Поле</th>
                                                        <th className="px-3 py-2 font-medium">Причина</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.errors.map((error, index) => (
                                                        <tr key={`${error.rowNumber}-${error.field}-${index}`} className="border-t">
                                                            <td className="px-3 py-2 align-top">{error.rowNumber}</td>
                                                            <td className="px-3 py-2 align-top">{error.flatId ?? '—'}</td>
                                                            <td className="px-3 py-2 align-top">{error.field}</td>
                                                            <td className="px-3 py-2 align-top">{error.message}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="gap-2">
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleClose(false)}
                        className="hover:bg-muted inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Закрыть
                    </button>

                    <button
                        type="button"
                        disabled={!data.file || processing}
                        onClick={() => submit('preview')}
                        className="hover:bg-muted inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing && submitMode === 'preview' ? 'Проверка...' : 'Проверить'}
                    </button>

                    <button
                        type="button"
                        disabled={!data.file || processing}
                        onClick={() => submit('import')}
                        className="bg-foreground text-background inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing && submitMode === 'import' ? 'Импорт...' : 'Импортировать'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
