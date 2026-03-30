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
        sortBy: string;
        sortDirection: 'asc' | 'desc';
    };
    flats: {
        data: Flat[];
    };
};

export default function AdminFlatsIndex({ flats }: Props) {
    return (
        <>
            <Head title="Admin / Flats" />
            <div className="p-6">
                <h1 className="mb-6 text-2xl font-semibold">Управление квартирами</h1>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left">
                                <th className="p-3">Корпус</th>
                                <th className="p-3">Этаж</th>
                                <th className="p-3">№</th>
                                <th className="p-3">Комнат</th>
                                <th className="p-3">Площадь</th>
                                <th className="p-3">Цена</th>
                                <th className="p-3">Статус</th>
                                <th className="p-3">Slug</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flats.data.map((flat) => (
                                <tr key={flat.id} className="border-b">
                                    <td className="p-3">{flat.building}</td>
                                    <td className="p-3">{flat.floor}</td>
                                    <td className="p-3">{flat.number}</td>
                                    <td className="p-3">{flat.rooms}</td>
                                    <td className="p-3">{flat.square}</td>
                                    <td className="p-3">{flat.price}</td>
                                    <td className="p-3">{flat.sold ? 'Продана' : 'Доступна'}</td>
                                    <td className="p-3">
                                        <Link href={route('apartments.show', flat.slug)} className="underline">
                                            {flat.slug}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}