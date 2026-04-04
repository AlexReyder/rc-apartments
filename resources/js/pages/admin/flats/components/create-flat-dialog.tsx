import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="mt-1 text-xs text-red-600">{message}</p>;
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

export default function CreateFlatDialog({ open, onOpenChange }: Props) {
    const page = usePage<FlashProps>();
    const flashCreatedFlat = page.props.flash?.createdFlat ?? null;

    const [createdFlat, setCreatedFlat] = useState<CreatedFlat>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
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

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setCreatedFlat(null);
            clearErrors();
            reset();
        }

        onOpenChange(nextOpen);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('admin.flats.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                reset();
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
                                value={data.building}
                                onChange={(event) => setData('building', event.target.value)}
                            />
                            <FieldError message={errors.building} />
                        </div>

                        <div>
                            <Label htmlFor="floor">Этаж</Label>
                            <Input
                                id="floor"
                                type="text"
                                value={data.floor}
                                onChange={(event) => setData('floor', event.target.value)}
                            />
                            <FieldError message={errors.floor} />
                        </div>

                        <div>
                            <Label htmlFor="entrance_number">Подъезд</Label>
                            <Input
                                id="entrance_number"
                                type="text"
                                value={data.entrance_number}
                                onChange={(event) =>
                                    setData('entrance_number', event.target.value)
                                }
                            />
                            <FieldError message={errors.entrance_number} />
                        </div>

                        <div>
                            <Label htmlFor="number">Номер квартиры</Label>
                            <Input
                                id="number"
                                type="text"
                                value={data.number}
                                onChange={(event) => setData('number', event.target.value)}
                            />
                            <FieldError message={errors.number} />
                        </div>

                        <div>
                            <Label>Количество комнат</Label>
                            <Select
                                value={data.rooms_number}
                                onValueChange={(value) => setData('rooms_number', value)}
                            >
                                <SelectTrigger>
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
                                type="number"
                                step="0.01"
                                value={data.square}
                                onChange={(event) => setData('square', event.target.value)}
                            />
                            <FieldError message={errors.square} />
                        </div>

                        <div>
                            <Label htmlFor="living_square">Жилая площадь</Label>
                            <Input
                                id="living_square"
                                type="number"
                                step="0.01"
                                value={data.living_square}
                                onChange={(event) =>
                                    setData('living_square', event.target.value)
                                }
                            />
                            <FieldError message={errors.living_square} />
                        </div>

                        <div>
                            <Label htmlFor="ceiling_height">Высота потолков</Label>
                            <Input
                                id="ceiling_height"
                                type="number"
                                step="0.01"
                                value={data.ceiling_height}
                                onChange={(event) =>
                                    setData('ceiling_height', event.target.value)
                                }
                            />
                            <FieldError message={errors.ceiling_height} />
                        </div>

                        <div>
                            <Label htmlFor="price_m2">Цена за кв.м.</Label>
                            <Input
                                id="price_m2"
                                type="number"
                                value={data.price_m2}
                                onChange={(event) => setData('price_m2', event.target.value)}
                            />
                            <FieldError message={errors.price_m2} />
                        </div>

                        <div>
                            <Label htmlFor="price">Стоимость квартиры</Label>
                            <Input
                                id="price"
                                type="number"
                                value={data.price}
                                onChange={(event) => setData('price', event.target.value)}
                            />
                            <FieldError message={errors.price} />
                        </div>

                        <div>
                            <Label htmlFor="finishing">Отделка</Label>
                            <Input
                                id="finishing"
                                type="text"
                                value={data.finishing}
                                onChange={(event) => setData('finishing', event.target.value)}
                            />
                            <FieldError message={errors.finishing} />
                        </div>

                        <div>
                            <Label htmlFor="finish_date">Дата окончания строительства</Label>
                            <Input
                                id="finish_date"
                                type="date"
                                value={data.finish_date}
                                onChange={(event) => setData('finish_date', event.target.value)}
                            />
                            <FieldError message={errors.finish_date} />
                        </div>

                        <div>
                            <Label>Статус</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData(
                                        'status',
                                        value as 'available' | 'sold' | 'hidden',
                                    )
                                }
                            >
                                <SelectTrigger>
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
                                id="apartment_plan"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.svg"
                                onChange={(event) =>
                                    setData(
                                        'apartment_plan',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            <FieldError message={errors.apartment_plan} />
                        </div>

                        <div>
                            <Label htmlFor="floor_plan">План этажа</Label>
                            <Input
                                id="floor_plan"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.svg"
                                onChange={(event) =>
                                    setData('floor_plan', event.target.files?.[0] ?? null)
                                }
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
                            Отмена
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