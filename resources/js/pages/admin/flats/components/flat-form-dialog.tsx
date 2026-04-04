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
import FlatImageUploadField from '@/pages/Admin/Flats/components/flat-image-upload-field';
import type { Flat } from '@/pages/Admin/Flats/types';

type Props = {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flat?: Flat | null;
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

type FlatFormData = {
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
    remove_apartment_plan: '0' | '1';
    remove_floor_plan: '0' | '1';
};

type FormField =
    | 'building'
    | 'floor'
    | 'entrance_number'
    | 'number'
    | 'rooms_number'
    | 'square'
    | 'living_square'
    | 'ceiling_height'
    | 'price_m2'
    | 'price'
    | 'finishing'
    | 'finish_date'
    | 'status'
    | 'apartment_plan'
    | 'floor_plan';

type DataField = keyof FlatFormData;
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

const flatFormSchema = z.object(fieldSchemas);

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

function soldToStatus(sold?: Flat['sold'] | null): FlatFormData['status'] {
    if (sold === 1) {
        return 'sold';
    }

    if (sold === 2) {
        return 'hidden';
    }

    return 'available';
}

function toStringValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}

function toPublicUrl(path: string | null | undefined): string | null {
    if (!path) {
        return null;
    }

    return `/${path.replace(/^\/+/, '')}`;
}

function buildInitialData(flat?: Flat | null): FlatFormData {
    return {
        building: toStringValue(flat?.building),
        floor: toStringValue(flat?.floor),
        entrance_number: toStringValue(flat?.entrance),
        number: toStringValue(flat?.number),
        rooms_number: flat ? toStringValue(flat.rooms) : '1',
        square: toStringValue(flat?.square),
        living_square: toStringValue(flat?.living_square),
        ceiling_height: toStringValue(flat?.ceiling_height),
        price_m2: toStringValue(flat?.price_m2),
        price: toStringValue(flat?.price),
        finishing: flat?.finishing ?? '',
        finish_date: flat?.finish_date ? flat.finish_date.slice(0, 10) : '',
        status: soldToStatus(flat?.sold),
        apartment_plan: null,
        floor_plan: null,
        remove_apartment_plan: '0',
        remove_floor_plan: '0',
    };
}

function validateField(field: FormField, value: FlatFormData[FormField]) {
    const result = fieldSchemas[field].safeParse(value);

    if (result.success) {
        return undefined;
    }

    return result.error.issues[0]?.message;
}

function validateForm(data: FlatFormData): FormErrors {
    const result = flatFormSchema.safeParse(data);

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

export default function FlatFormDialog({
    mode,
    open,
    onOpenChange,
    flat = null,
}: Props) {
    const page = usePage<FlashProps>();
    const flashCreatedFlat = page.props.flash?.createdFlat ?? null;

    const [createdFlat, setCreatedFlat] = useState<CreatedFlat>(null);

    const apartmentPlanInputRef = useRef<HTMLInputElement | null>(null);
    const floorPlanInputRef = useRef<HTMLInputElement | null>(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors, setError } =
        useForm<FlatFormData>(buildInitialData(mode === 'edit' ? flat : null));

    const replaceFormData = (nextData: FlatFormData) => {
        (Object.keys(nextData) as DataField[]).forEach((field) => {
            setData(field, nextData[field]);
        });
    };

    useEffect(() => {
        if (mode === 'create' && flashCreatedFlat) {
            setCreatedFlat(flashCreatedFlat);
            onOpenChange(true);
        }
    }, [flashCreatedFlat, mode, onOpenChange]);

    useEffect(() => {
        if (mode === 'edit' && open) {
            clearErrors();
            setCreatedFlat(null);
            replaceFormData(buildInitialData(flat));
            resetFileInputs();
        }
    }, [mode, open, flat, clearErrors]);

    const dialogTitle = useMemo(() => {
        if (mode === 'create') {
            return createdFlat ? 'Квартира добавлена' : 'Добавить квартиру';
        }

        return 'Редактировать квартиру';
    }, [createdFlat, mode]);

    const dialogDescription = useMemo(() => {
        if (mode === 'create') {
            return 'Заполните поля квартиры и загрузите план квартиры и план этажа.';
        }

        return 'Измените данные квартиры, при необходимости замените или удалите изображения.';
    }, [mode]);

    const resetFileInputs = () => {
        if (apartmentPlanInputRef.current) {
            apartmentPlanInputRef.current.value = '';
        }

        if (floorPlanInputRef.current) {
            floorPlanInputRef.current.value = '';
        }
    };

    const syncFieldError = (field: FormField, nextData: FlatFormData) => {
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
        } as FlatFormData;

        setData(field, value);

        if (validateOnChange) {
            syncFieldError(field, nextData);
        }
    };

    const getRemoveField = (field: FileField) =>
        field === 'apartment_plan' ? 'remove_apartment_plan' : 'remove_floor_plan';

    const getExistingImagePath = (field: FileField) => {
        if (!flat) {
            return null;
        }

        return field === 'apartment_plan' ? flat.plan : flat.floor_plan;
    };

    const clearFileField = (field: FileField) => {
        const removeField = getRemoveField(field);
        const hasSelectedFile = Boolean(data[field]);
        const hasExistingImage = Boolean(getExistingImagePath(field));

        if (field === 'apartment_plan' && apartmentPlanInputRef.current) {
            apartmentPlanInputRef.current.value = '';
        }

        if (field === 'floor_plan' && floorPlanInputRef.current) {
            floorPlanInputRef.current.value = '';
        }

        setData(field, null);
        clearErrors(field);

        if (mode === 'edit') {
            if (hasSelectedFile) {
                setData(removeField, '0');
                return;
            }

            if (hasExistingImage) {
                setData(removeField, '1');
            }
        }
    };

    const handleFileChange = (field: FileField, file: File | null) => {
        const removeField = getRemoveField(field);

        const nextData = {
            ...data,
            [field]: file,
            [removeField]: '0',
        } as FlatFormData;

        const message = validateField(field, nextData[field]);

        if (message) {
            setData(field, null);
            setError(field, message);

            if (field === 'apartment_plan' && apartmentPlanInputRef.current) {
                apartmentPlanInputRef.current.value = '';
            }

            if (field === 'floor_plan' && floorPlanInputRef.current) {
                floorPlanInputRef.current.value = '';
            }

            return;
        }

        setData(field, file);
        setData(removeField, '0');
        clearErrors(field);
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setCreatedFlat(null);
            clearErrors();
            reset();
            replaceFormData(buildInitialData(mode === 'edit' ? flat : null));
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

        if (mode === 'create') {
            post(route('admin.flats.store'), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    clearErrors();
                    reset();
                    replaceFormData(buildInitialData());
                    resetFileInputs();
                },
                onError: () => {
                    onOpenChange(true);
                },
            });

            return;
        }

        if (!flat) {
            return;
        }

        patch(route('admin.flats.update', flat.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                resetFileInputs();
                onOpenChange(false);
            },
            onError: () => {
                onOpenChange(true);
            },
        });
    };

    const apartmentPlanPreviewUrl =
        data.remove_apartment_plan === '1'
            ? null
            : toPublicUrl(getExistingImagePath('apartment_plan'));

    const floorPlanPreviewUrl =
        data.remove_floor_plan === '1'
            ? null
            : toPublicUrl(getExistingImagePath('floor_plan'));

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{dialogDescription}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                            <Label htmlFor={`${mode}-building`}>Корпус</Label>
                            <Input
                                id={`${mode}-building`}
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
                            <Label htmlFor={`${mode}-floor`}>Этаж</Label>
                            <Input
                                id={`${mode}-floor`}
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
                            <Label htmlFor={`${mode}-entrance_number`}>Подъезд</Label>
                            <Input
                                id={`${mode}-entrance_number`}
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
                            <Label htmlFor={`${mode}-number`}>Номер квартиры</Label>
                            <Input
                                id={`${mode}-number`}
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
                            <Label htmlFor={`${mode}-square`}>Общая площадь</Label>
                            <Input
                                id={`${mode}-square`}
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
                            <Label htmlFor={`${mode}-living_square`}>Жилая площадь</Label>
                            <Input
                                id={`${mode}-living_square`}
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
                            <Label htmlFor={`${mode}-ceiling_height`}>Высота потолков</Label>
                            <Input
                                id={`${mode}-ceiling_height`}
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
                            <Label htmlFor={`${mode}-price_m2`}>Цена за кв.м.</Label>
                            <Input
                                id={`${mode}-price_m2`}
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
                            <Label htmlFor={`${mode}-price`}>Стоимость квартиры</Label>
                            <Input
                                id={`${mode}-price`}
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
                            <Label htmlFor={`${mode}-finishing`}>Отделка</Label>
                            <Input
                                id={`${mode}-finishing`}
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
                            <Label htmlFor={`${mode}-finish_date`}>
                                Дата окончания строительства
                            </Label>
                            <Input
                                id={`${mode}-finish_date`}
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
                                        value as FlatFormData['status'],
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
                        <FlatImageUploadField
                            id={`${mode}-apartment_plan`}
                            label="План квартиры"
                            file={data.apartment_plan}
                            error={errors.apartment_plan}
                            inputRef={apartmentPlanInputRef}
                            onFileChange={(file) => handleFileChange('apartment_plan', file)}
                            onClear={() => clearFileField('apartment_plan')}
                            previewUrl={apartmentPlanPreviewUrl}
                            previewAlt="Предпросмотр плана квартиры"
                            disabled={processing}
                        />

                        <FlatImageUploadField
                            id={`${mode}-floor_plan`}
                            label="План этажа"
                            file={data.floor_plan}
                            error={errors.floor_plan}
                            inputRef={floorPlanInputRef}
                            onFileChange={(file) => handleFileChange('floor_plan', file)}
                            onClear={() => clearFileField('floor_plan')}
                            previewUrl={floorPlanPreviewUrl}
                            previewAlt="Предпросмотр плана этажа"
                            disabled={processing}
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <button
                            type="button"
                            onClick={() => handleClose(false)}
                            className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {mode === 'create' && createdFlat ? 'Закрыть' : 'Отмена'}
                        </button>

                        {mode === 'create' && createdFlat ? (
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
                                {processing
                                    ? mode === 'create'
                                        ? 'Добавление...'
                                        : 'Сохранение...'
                                    : mode === 'create'
                                      ? 'Добавить'
                                      : 'Сохранить'}
                            </button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}