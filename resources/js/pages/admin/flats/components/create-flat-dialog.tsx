import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type CreatedFlat = {
    id: number;
    slug: string;
} | null;

type FlashProps = {
    flash?: {
        createdFlat?: CreatedFlat;
    };
};

type CreateFlatFormData = {
    building: string;
    floor: string;
    entrance_number: string;
    number: string;
    rooms_number: string;
    square: string;
    living_square: string;
    ceiling_height: string;
    price_m2: string;
    price: string;
    finishing: string;
    finish_date: string;
    status: 'available' | 'sold' | 'hidden';
    apartment_plan: File | null;
    floor_plan: File | null;
};

type FormField = keyof CreateFlatFormData;
type FileField = 'apartment_plan' | 'floor_plan';
type FormErrors = Partial<Record<FormField, string>>;

const ROOM_VALUES = ['0', '1', '2', '3', '4'] as const;
const STATUS_VALUES = ['available', 'sold', 'hidden'] as const;
const ALLOWED_FILE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const integerFieldSchema = (label: string, min = 1) =>
    z.string().superRefine((value, ctx) => {
        const normalized = value.trim();

        if (normalized === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Заполните поле «${label}».`,
            });
            return;
        }

        if (!/^\d+$/.test(normalized)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» должно быть целым числом.`,
            });
            return;
        }

        if (Number(normalized) < min) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» не может быть меньше ${min}.`,
            });
        }
    });

const numericFieldSchema = (label: string, min = 0) =>
    z.string().superRefine((value, ctx) => {
        const normalized = value.replace(',', '.').trim();

        if (normalized === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Заполните поле «${label}».`,
            });
            return;
        }

        if (!/^(\d+(\.\d+)?|\.\d+)$/.test(normalized)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» должно быть числом.`,
            });
            return;
        }

        if (Number(normalized) < min) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» не может быть меньше ${min}.`,
            });
        }
    });

const textFieldSchema = (label: string, max = 255) =>
    z.string().superRefine((value, ctx) => {
        const trimmed = value.trim();

        if (trimmed === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Заполните поле «${label}».`,
            });
            return;
        }

        if (trimmed.length > max) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» не должно быть длиннее ${max} символов.`,
            });
        }
    });

const dateFieldSchema = (label: string) =>
    z.string().superRefine((value, ctx) => {
        const trimmed = value.trim();

        if (trimmed === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Заполните поле «${label}».`,
            });
            return;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Укажите корректную дату в поле «${label}».`,
            });
        }
    });

const enumFieldSchema = <T extends readonly [string, ...string[]]>(
    values: T,
    label: string,
) =>
    z.string().superRefine((value, ctx) => {
        if (!values.includes(value)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Выберите корректное значение для поля «${label}».`,
            });
        }
    });

const fileFieldSchema = (label: string) =>
    z.unknown().nullable().superRefine((value, ctx) => {
        if (value === null || value === undefined) {
            return;
        }

        if (typeof File === 'undefined' || !(value instanceof File)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» должно быть файлом.`,
            });
            return;
        }

        const extension = value.name.split('.').pop()?.toLowerCase();

        if (!extension || !ALLOWED_FILE_EXTENSIONS.has(extension)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Поле «${label}» поддерживает только JPG, JPEG, PNG, WEBP и SVG.`,
            });
            return;
        }

        if (value.size > MAX_FILE_SIZE_BYTES) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Файл «${label}» не должен превышать 5 МБ.`,
            });
        }
    });

const fieldSchemas = {
    building: integerFieldSchema('Корпус', 1),
    floor: integerFieldSchema('Этаж', 1),
    entrance_number: integerFieldSchema('Подъезд', 1),
    number: integerFieldSchema('Номер квартиры', 1),
    rooms_number: enumFieldSchema(ROOM_VALUES, 'Количество комнат'),
    square: numericFieldSchema('Общая площадь', 0),
    living_square: numericFieldSchema('Жилая площадь', 0),
    ceiling_height: numericFieldSchema('Высота потолков', 0),
    price_m2: integerFieldSchema('Цена за кв.м.', 0),
    price: integerFieldSchema('Стоимость квартиры', 0),
    finishing: textFieldSchema('Отделка', 255),
    finish_date: dateFieldSchema('Дата окончания строительства'),
    status: enumFieldSchema(STATUS_VALUES, 'Статус'),
    apartment_plan: fileFieldSchema('План квартиры'),
    floor_plan: fileFieldSchema('План этажа'),
};

const createFlatFormSchema = z.object(fieldSchemas);

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

const initialData: CreateFlatFormData = {
    building: '',
    floor: '',
    entrance_number: '',
    number: '',
    rooms_number: '1',
    square: '',
    living_square: '',
    ceiling_height: '',
    price_m2: '',
    price: '',
    finishing: '',
    finish_date: '',
    status: 'available',
    apartment_plan: null,
    floor_plan: null,
};

function normalizeIntegerValue(value: string): string {
    return value.replace(/\D/g, '');
}

function normalizeDecimalValue(value: string): string {
    const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
    const firstDotIndex = normalized.indexOf('.');

    if (firstDotIndex === -1) {
        return normalized;
    }

    const integerPart = normalized.slice(0, firstDotIndex);
    const fractionPart = normalized.slice(firstDotIndex + 1).replace(/\./g, '');

    return `${integerPart}.${fractionPart}`;
}

function validateField(field: FormField, value: CreateFlatFormData[FormField]) {
    const result = fieldSchemas[field].safeParse(value);

    if (result.success) {
        return undefined;
    }

    return result.error.issues[0]?.message;
}

function validateForm(data: CreateFlatFormData): FormErrors {
    const result = createFlatFormSchema.safeParse(data);

    if (result.success) {
        return {};
    }

    return result.error.issues.reduce<FormErrors>((acc, issue) => {
        const field = issue.path[0] as FormField | undefined;

        if (field && !acc[field]) {
            acc[field] = issue.message;
        }

        return acc;
    }, {});
}

export default function CreateFlatDialog({ open, onOpenChange }: Props) {
    const page = usePage<FlashProps>();
    const flashCreatedFlat = page.props.flash?.createdFlat ?? null;

    const [createdFlat, setCreatedFlat] = useState<CreatedFlat>(null);

    const apartmentPlanInputRef = useRef<HTMLInputElement | null>(null);
    const floorPlanInputRef = useRef<HTMLInputElement | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors, setError } =
        useForm<CreateFlatFormData>(initialData);

    useEffect(() => {
        if (flashCreatedFlat) {
            setCreatedFlat(flashCreatedFlat);
            onOpenChange(true);
        }
    }, [flashCreatedFlat, onOpenChange]);

    const dialogTitle = useMemo(() => {
        return createdFlat ? 'Квартира добавлена' : 'Добавить квартиру';
    }, [createdFlat]);

    const resetFileInputs = () => {
        if (apartmentPlanInputRef.current) {
            apartmentPlanInputRef.current.value = '';
        }

        if (floorPlanInputRef.current) {
            floorPlanInputRef.current.value = '';
        }
    };

    const syncFieldError = (field: FormField, nextData: CreateFlatFormData) => {
        const message = validateField(field, nextData[field]);

        if (message) {
            setError(field, message);
            return;
        }

        clearErrors(field);
    };

    const applyClientErrors = (nextErrors: FormErrors) => {
        clearErrors();

        (Object.entries(nextErrors) as Array<[FormField, string]>).forEach(
            ([field, message]) => {
                setError(field, message);
            },
        );
    };

    const updateField = <TField extends FormField>(
        field: TField,
        value: any,
        validateOnChange = Boolean(errors[field]),
    ) => {
        const nextData = {
            ...data,
            [field]: value,
        } as CreateFlatFormData;

        setData(field, value);

        if (validateOnChange) {
            syncFieldError(field, nextData);
        }
    };

    const handleFileChange = (
        field: FileField,
        file: File | null,
        input: HTMLInputElement | null,
    ) => {
        const nextData = {
            ...data,
            [field]: file,
        } as CreateFlatFormData;

        const message = validateField(field, nextData[field]);

        if (message) {
            setData(field, null);
            setError(field, message);

            if (input) {
                input.value = '';
            }

            return;
        }

        setData(field, file);
        clearErrors(field);
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setCreatedFlat(null);
            clearErrors();
            reset();
            resetFileInputs();
        }

        onOpenChange(nextOpen);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const clientErrors = validateForm(data);

        if (Object.keys(clientErrors).length > 0) {
            applyClientErrors(clientErrors);
            onOpenChange(true);
            return;
        }

        post(route('admin.flats.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                reset();
                resetFileInputs();
            },
            onError: () => {
                onOpenChange(true);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        Заполните поля квартиры и загрузите план квартиры и план этажа.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <Label htmlFor="building">Корпус</Label>
                            <Input
                                id="building"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.building}
                                onChange={(event) =>
                                    updateField(
                                        'building',
                                        normalizeIntegerValue(event.target.value),
                                    )
                                }
                                aria-invalid={Boolean(errors.building)}
                                className={cn(
                                    errors.building && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.building} />
                        </div>

                        <div>
                            <Label htmlFor="floor">Этаж</Label>
                            <Input
                                id="floor"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.floor}
                                onChange={(event) =>
                                    updateField('floor', normalizeIntegerValue(event.target.value))
                                }
                                aria-invalid={Boolean(errors.floor)}
                                className={cn(
                                    errors.floor && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.floor} />
                        </div>

                        <div>
                            <Label htmlFor="entrance_number">Подъезд</Label>
                            <Input
                                id="entrance_number"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.entrance_number}
                                onChange={(event) =>
                                    updateField(
                                        'entrance_number',
                                        normalizeIntegerValue(event.target.value),
                                    )
                                }
                                aria-invalid={Boolean(errors.entrance_number)}
                                className={cn(
                                    errors.entrance_number &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.entrance_number} />
                        </div>

                        <div>
                            <Label htmlFor="number">Номер квартиры</Label>
                            <Input
                                id="number"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.number}
                                onChange={(event) =>
                                    updateField('number', normalizeIntegerValue(event.target.value))
                                }
                                aria-invalid={Boolean(errors.number)}
                                className={cn(
                                    errors.number && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.number} />
                        </div>

                        <div>
                            <Label>Количество комнат</Label>
                            <Select
                                value={data.rooms_number}
                                onValueChange={(value) => updateField('rooms_number', value, true)}
                            >
                                <SelectTrigger
                                    aria-invalid={Boolean(errors.rooms_number)}
                                    className={cn(
                                        errors.rooms_number && 'border-red-500 focus:ring-red-500',
                                    )}
                                >
                                    <SelectValue placeholder="Выберите количество комнат" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Студия</SelectItem>
                                    <SelectItem value="1">1-комнатная</SelectItem>
                                    <SelectItem value="2">2-комнатная</SelectItem>
                                    <SelectItem value="3">3-комнатная</SelectItem>
                                    <SelectItem value="4">4-комнатная</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.rooms_number} />
                        </div>

                        <div>
                            <Label htmlFor="square">Общая площадь</Label>
                            <Input
                                id="square"
                                type="text"
                                inputMode="decimal"
                                value={data.square}
                                onChange={(event) =>
                                    updateField('square', normalizeDecimalValue(event.target.value))
                                }
                                aria-invalid={Boolean(errors.square)}
                                className={cn(
                                    errors.square && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.square} />
                        </div>

                        <div>
                            <Label htmlFor="living_square">Жилая площадь</Label>
                            <Input
                                id="living_square"
                                type="text"
                                inputMode="decimal"
                                value={data.living_square}
                                onChange={(event) =>
                                    updateField(
                                        'living_square',
                                        normalizeDecimalValue(event.target.value),
                                    )
                                }
                                aria-invalid={Boolean(errors.living_square)}
                                className={cn(
                                    errors.living_square &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.living_square} />
                        </div>

                        <div>
                            <Label htmlFor="ceiling_height">Высота потолков</Label>
                            <Input
                                id="ceiling_height"
                                type="text"
                                inputMode="decimal"
                                value={data.ceiling_height}
                                onChange={(event) =>
                                    updateField(
                                        'ceiling_height',
                                        normalizeDecimalValue(event.target.value),
                                    )
                                }
                                aria-invalid={Boolean(errors.ceiling_height)}
                                className={cn(
                                    errors.ceiling_height &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.ceiling_height} />
                        </div>

                        <div>
                            <Label htmlFor="price_m2">Цена за кв.м.</Label>
                            <Input
                                id="price_m2"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.price_m2}
                                onChange={(event) =>
                                    updateField(
                                        'price_m2',
                                        normalizeIntegerValue(event.target.value),
                                    )
                                }
                                aria-invalid={Boolean(errors.price_m2)}
                                className={cn(
                                    errors.price_m2 && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.price_m2} />
                        </div>

                        <div>
                            <Label htmlFor="price">Стоимость квартиры</Label>
                            <Input
                                id="price"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={data.price}
                                onChange={(event) =>
                                    updateField('price', normalizeIntegerValue(event.target.value))
                                }
                                aria-invalid={Boolean(errors.price)}
                                className={cn(
                                    errors.price && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.price} />
                        </div>

                        <div>
                            <Label htmlFor="finishing">Отделка</Label>
                            <Input
                                id="finishing"
                                type="text"
                                value={data.finishing}
                                onChange={(event) => updateField('finishing', event.target.value)}
                                aria-invalid={Boolean(errors.finishing)}
                                className={cn(
                                    errors.finishing && 'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.finishing} />
                        </div>

                        <div>
                            <Label htmlFor="finish_date">Дата окончания строительства</Label>
                            <Input
                                id="finish_date"
                                type="date"
                                value={data.finish_date}
                                onChange={(event) => updateField('finish_date', event.target.value)}
                                aria-invalid={Boolean(errors.finish_date)}
                                className={cn(
                                    errors.finish_date &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.finish_date} />
                        </div>

                        <div>
                            <Label>Статус</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    updateField(
                                        'status',
                                        value as CreateFlatFormData['status'],
                                        true,
                                    )
                                }
                            >
                                <SelectTrigger
                                    aria-invalid={Boolean(errors.status)}
                                    className={cn(
                                        errors.status && 'border-red-500 focus:ring-red-500',
                                    )}
                                >
                                    <SelectValue placeholder="Выберите статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Доступна</SelectItem>
                                    <SelectItem value="sold">Продана</SelectItem>
                                    <SelectItem value="hidden">Скрыта</SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.status} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="apartment_plan">План квартиры</Label>
                            <Input
                                ref={apartmentPlanInputRef}
                                id="apartment_plan"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.svg"
                                onChange={(event) =>
                                    handleFileChange(
                                        'apartment_plan',
                                        event.target.files?.[0] ?? null,
                                        event.target,
                                    )
                                }
                                aria-invalid={Boolean(errors.apartment_plan)}
                                className={cn(
                                    errors.apartment_plan &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.apartment_plan} />
                        </div>

                        <div>
                            <Label htmlFor="floor_plan">План этажа</Label>
                            <Input
                                ref={floorPlanInputRef}
                                id="floor_plan"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.svg"
                                onChange={(event) =>
                                    handleFileChange(
                                        'floor_plan',
                                        event.target.files?.[0] ?? null,
                                        event.target,
                                    )
                                }
                                aria-invalid={Boolean(errors.floor_plan)}
                                className={cn(
                                    errors.floor_plan &&
                                        'border-red-500 focus-visible:ring-red-500',
                                )}
                            />
                            <FieldError message={errors.floor_plan} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <button
                            type="button"
                            onClick={() => handleClose(false)}
                            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {createdFlat ? 'Закрыть': 'Отмена'}
                        </button>

                        {createdFlat ? (
                            <a
                                href={route('apartments.show', createdFlat.slug)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
                            >
                                Открыть карточку
                            </a>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Добавление...' : 'Добавить'}
                            </button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}