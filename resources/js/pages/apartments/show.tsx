import { Head } from '@inertiajs/react';

type Flat = {
    id: number;
    slug: string;
    building: number;
    floor: number;
    number: number;
    rooms: number;
    square: number;
    price: number;
    sold: boolean;
    title?: string | null;
    description?: string | null;
    finishDate?: string | null;
    finishing?: string | null;
    floorPosition?: string | null;
};

type Props = {
    flat: Flat;
};

export default function ApartmentsShow({ flat }: Props) {
    return (
        <>
            <Head title={flat.slug} />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-semibold">
                    Корпус {flat.building}, этаж {flat.floor}, квартира {flat.number}
                </h1>

                <div className="space-y-2">
                    <div>Slug: {flat.slug}</div>
                    <div>Комнат: {flat.rooms}</div>
                    <div>Площадь: {flat.square} м²</div>
                    <div>Цена: {flat.price} ₽</div>
                    <div>Статус: {flat.sold ? 'Продана' : 'Доступна'}</div>
                    <div>Title: {flat.title ?? '—'}</div>
                    <div>Описание: {flat.description ?? '—'}</div>
                </div>
            </div>
        </>
    );
}