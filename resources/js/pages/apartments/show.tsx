type Props = {
    slug: string;
};

export default function ApartmentsShow({ slug }: Props) {
    return <div>Apartment: {slug}</div>;
}