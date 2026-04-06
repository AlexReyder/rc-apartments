import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import type { FlatImportMode, FlatsImportResult } from '../types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SubmitMode = 'preview' | 'import';

type ImportResponse = {
    message?: string;
    result?: FlatsImportResult;
    errors?: {
        file?: string[];
        mode?: string[];
    };
};

const MODE_OPTIONS: Record<
    FlatImportMode,
    {
        title: string;
        description: string;
        accept: string;
        fileLabel: string;
        hint: string;
    }
> = {
    update_existing: {
        title: 'Обновление по Excel',
        description: 'Используйте экспортированный XLSX/XLS. Этот режим обновляет только существующие квартиры по ID.',
        accept: '.xlsx,.xls',
        fileLabel: 'Excel-файл',
        hint: 'Поддерживаются только XLSX/XLS в точном формате текущего экспорта.',
    },
    replace_all_archive: {
        title: 'Полное обновление из ZIP',
        description: 'ZIP должен содержать 1 Excel-файл и папки plans / floor_positions. Все текущие квартиры будут удалены и созданы заново.',
        accept: '.zip',
        fileLabel: 'ZIP-архив',
        hint: 'Имена файлов должны быть вида b1-f1-a2_plan.svg|png и b1-f1-a2_floor_position.svg|png.',
    },
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
    const [mode, setMode] = useState<FlatImportMode>('update_existing');
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [result, setResult] = useState<FlatsImportResult | null>(null);
    const [processingMode, setProcessingMode] = useState<SubmitMode | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isProcessing = processingMode !== null;
    const canImport = !!file && !isProcessing && !!result && result.isDryRun && !result.fatalError && result.errorRows === 0;

    const clearFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const resetFormState = () => {
        setMode('update_existing');
        setFile(null);
        setFileError(null);
        setResult(null);
        setProcessingMode(null);
        clearFileInput();
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            resetFormState();
        }

        onOpenChange(nextOpen);
    };

    const handleModeChange = (nextMode: FlatImportMode) => {
        setMode(nextMode);
        setFile(null);
        setFileError(null);
        setResult(null);
        clearFileInput();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0] ?? null;
        setFile(nextFile);
        setFileError(null);
        setResult(null);
    };

    const getCsrfToken = (): string => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        return token ?? '';
    };

    const submit = async (submitMode: SubmitMode) => {
        if (!file) {
            setFileError(mode === 'replace_all_archive' ? 'Выберите ZIP-архив для импорта.' : 'Выберите Excel-файл для импорта.');
            return;
        }

        setProcessingMode(submitMode);
        setFileError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('dry_run', submitMode === 'preview' ? '1' : '0');

        try {
            const response = await fetch(route('admin.flats.import'), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });

            const payload = (await response.json()) as ImportResponse;

            if (!response.ok) {
                const validationMessage = payload.errors?.file?.[0] ?? payload.errors?.mode?.[0] ?? payload.message;

                if (validationMessage) {
                    setFileError(validationMessage);
                }

                if (payload.result) {
                    setResult(payload.result);
                }

                toast.error(
                    payload.message ??
                        (mode === 'replace_all_archive' ? 'Не удалось выполнить полный импорт архива.' : 'Не удалось выполнить импорт квартир.'),
                );

                return;
            }

            if (payload.result) {
                setResult(payload.result);
            }

            toast.success(
                payload.message ??
                    (submitMode === 'preview'
                        ? 'Проверка завершена.'
                        : mode === 'replace_all_archive'
                          ? 'Полный импорт завершён.'
                          : 'Импорт завершён.'),
            );
        } catch {
            toast.error(
                mode === 'replace_all_archive'
                    ? 'Не удалось выполнить полный импорт архива. Попробуйте снова.'
                    : 'Не удалось выполнить импорт квартир. Попробуйте снова.',
            );
        } finally {
            setProcessingMode(null);
        }
    };

    const currentMode = result?.mode ?? mode;
    const currentModeConfig = MODE_OPTIONS[mode];

    const actionLabel =
        currentMode === 'replace_all_archive' ? (result?.isDryRun ? 'Будет создано' : 'Создано') : result?.isDryRun ? 'Будет обновлено' : 'Обновлено';

    const statusTone = result?.fatalError
        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
        : (result?.errorRows ?? 0) > 0
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';

    const statusLabel = result?.fatalError
        ? 'Файл не прошёл проверку'
        : result?.isDryRun
          ? 'Проверка выполнена'
          : currentMode === 'replace_all_archive'
            ? 'Полный импорт выполнен'
            : 'Импорт выполнен';

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'replace_all_archive' ? 'Полный импорт квартир из ZIP' : 'Импорт квартир из Excel'}</DialogTitle>

                    <DialogDescription>{currentModeConfig.description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="text-sm font-medium">Режим импорта</div>

                        <div className="grid gap-2 md:grid-cols-2">
                            {(['update_existing', 'replace_all_archive'] as const).map((value) => {
                                const option = MODE_OPTIONS[value];
                                const active = mode === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => handleModeChange(value)}
                                        className={`rounded-lg border p-3 text-left transition-colors ${
                                            active ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                                        }`}
                                    >
                                        <div className="text-sm font-medium">{option.title}</div>
                                        <div className="text-muted-foreground mt-1 text-xs leading-5">{option.description}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="flats-import-file">{currentModeConfig.fileLabel}</Label>

                        <input
                            ref={fileInputRef}
                            id="flats-import-file"
                            type="file"
                            accept={currentModeConfig.accept}
                            onChange={handleFileChange}
                            className="text-muted-foreground file:text-foreground block w-full rounded-lg border px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium"
                        />

                        {fileError ? <p className="text-xs text-red-600">{fileError}</p> : null}

                        <p className="text-muted-foreground text-xs">{currentModeConfig.hint}</p>
                    </div>

                    {result ? (
                        <div className="space-y-4 rounded-xl border p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-sm font-medium">{result.fileName}</div>
                                    <div className="text-muted-foreground text-xs">
                                        {currentMode === 'replace_all_archive'
                                            ? 'Режим: полное обновление из архива'
                                            : 'Режим: обновление существующих квартир'}
                                    </div>
                                </div>

                                <div className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{statusLabel}</div>
                            </div>

                            {result.fatalError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950/60 dark:bg-red-950/20 dark:text-red-300">
                                    {result.fatalError}
                                </div>
                            ) : null}

                            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                                <SummaryCard label="Обработано строк" value={result.processedRows} />
                                <SummaryCard label="Пустых строк" value={result.emptyRows} />
                                <SummaryCard label="Валидных строк" value={result.validRows} />
                                <SummaryCard label={actionLabel} value={result.updatedRows} />
                                <SummaryCard label="Без изменений" value={result.skippedRows} />
                                <SummaryCard label="Строк с ошибками" value={result.errorRows} />
                            </div>

                            {result.mode === 'replace_all_archive' ? (
                                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                                    <SummaryCard label="Найдено plan" value={result.matchedPlanFiles ?? 0} />
                                    <SummaryCard label="Без plan" value={result.missingPlanFiles ?? 0} />
                                    <SummaryCard label="Лишних plan" value={result.unusedPlanFiles ?? 0} />
                                    <SummaryCard label="Найдено floor_position" value={result.matchedFloorPositionFiles ?? 0} />
                                    <SummaryCard label="Без floor_position" value={result.missingFloorPositionFiles ?? 0} />
                                    <SummaryCard label="Лишних floor_position" value={result.unusedFloorPositionFiles ?? 0} />
                                </div>
                            ) : null}

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
                                                            <td className="px-3 py-2 align-top">{error.rowNumber === 0 ? '—' : error.rowNumber}</td>
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
                        onClick={() => handleClose(false)}
                        className="hover:bg-muted inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors"
                    >
                        Закрыть
                    </button>

                    <button
                        type="button"
                        onClick={() => void submit('preview')}
                        disabled={isProcessing}
                        className="hover:bg-muted inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingMode === 'preview' ? 'Проверка...' : 'Проверить'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void submit('import')}
                        disabled={!canImport}
                        className="bg-foreground text-background inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingMode === 'import' ? 'Импорт...' : mode === 'replace_all_archive' ? 'Запустить полный импорт' : 'Импортировать'}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
