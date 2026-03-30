import { Head, Link } from '@inertiajs/react';

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
};

type Props = {
    filters: {
        search: string;
        perPage: number;
    };
    flats: {
        data: Flat[];
    };
};

export default function ApartmentsIndex({ flats }: Props) {
    return (
        <>
            <Head title="Квартиры" />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Квартиры</h1>

                <div className="space-y-3">
                    {flats.data.map((flat) => (
                        <Link
                            key={flat.id}
                            href={route('apartments.show', flat.slug)}
                            className="block rounded-xl border p-4"
                        >
                            <div>
                                Корпус {flat.building}, этаж {flat.floor}, квартира {flat.number}
                            </div>
                            <div>
                                {flat.rooms} комн. · {flat.square} м² · {flat.price} ₽
                            </div>
                            <div>{flat.sold ? 'Продана' : 'Доступна'}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}