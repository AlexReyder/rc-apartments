import { ImagePlus, Trash2, Upload } from 'lucide-react';
import {
    type ChangeEvent,
    type RefObject,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

type Props = {
    id: string;
    label: string;
    file: File | null;
    error?: string;
    inputRef: RefObject<HTMLInputElement | null>;
    onFileChange: (file: File | null) => void;
    onClear: () => void;
    accept?: string;
    disabled?: boolean;
    previewUrl?: string | null;
    previewAlt?: string;
    hint?: string;
};

function formatFileSize(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} Б`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} КБ`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p role="alert" className="mt-1 text-xs text-red-600">
            {message}
        </p>
    );
}

export default function FlatImageUploadField({
    id,
    label,
    file,
    error,
    inputRef,
    onFileChange,
    onClear,
    accept = '.jpg,.jpeg,.png,.webp,.svg',
    disabled = false,
    previewUrl = null,
    previewAlt,
    hint = 'Поддерживаются JPG, JPEG, PNG, WEBP и SVG до 5 МБ',
}: Props) {
    const [objectPreviewUrl, setObjectPreviewUrl] = useState<string | null>(null);
    const [hasPreviewError, setHasPreviewError] = useState(false);

    useEffect(() => {
        if (!file) {
            setObjectPreviewUrl(null);
            return;
        }

        const nextUrl = URL.createObjectURL(file);
        setObjectPreviewUrl(nextUrl);
        setHasPreviewError(false);

        return () => {
            URL.revokeObjectURL(nextUrl);
        };
    }, [file]);

    const resolvedPreviewUrl = useMemo(() => {
        if (objectPreviewUrl) {
            return objectPreviewUrl;
        }

        return previewUrl;
    }, [objectPreviewUrl, previewUrl]);

    const fileMeta = useMemo(() => {
        if (!file) {
            return null;
        }

        return `${file.name} · ${formatFileSize(file.size)}`;
    }, [file]);

    const handleTriggerClick = () => {
        if (disabled) {
            return;
        }

        inputRef.current?.click();
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onFileChange(event.target.files?.[0] ?? null);
    };

    const handleClear = () => {
        if (disabled) {
            return;
        }

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        setHasPreviewError(false);
        onClear();
    };

    const hasPreview = Boolean(resolvedPreviewUrl) && !hasPreviewError;

    return (
        <div>
            <Label htmlFor={id}>{label}</Label>

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="sr-only"
                disabled={disabled}
            />

            <div
                className={cn(
                    'mt-2 rounded-2xl border p-3 transition-colors',
                    error
                        ? 'border-red-500 bg-red-50/30 dark:bg-red-950/10'
                        : 'border-border bg-muted/20',
                )}
            >
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="overflow-hidden rounded-xl border bg-background">
                        {hasPreview ? (
                            <img
                                src={resolvedPreviewUrl ?? undefined}
                                alt={previewAlt ?? label}
                                className="aspect-[4/3] h-full w-full object-contain"
                                onError={() => setHasPreviewError(true)}
                            />
                        ) : (
                            <div className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                                <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
                                    <ImagePlus className="h-6 w-6" />
                                    <span>Изображение не выбрано</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground">
                                {label}
                            </div>

                            <p className="text-sm text-muted-foreground">{hint}</p>

                            <div className="rounded-xl border border-dashed bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                                {fileMeta ?? 'Файл пока не выбран'}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={handleTriggerClick}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Upload className="h-4 w-4" />
                                {hasPreview || file ? 'Заменить' : 'Выбрать файл'}
                            </button>

                            {(file || previewUrl) && (
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={handleClear}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Удалить
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <FieldError message={error} />
        </div>
    );
}