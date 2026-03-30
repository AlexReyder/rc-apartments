type Props = {
    buildingSlug: string;
};

export default function PanoramaFloors({ buildingSlug }: Props) {
    return <div>Panorama floors: {buildingSlug}</div>;
}