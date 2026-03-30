type Props = {
    buildingSlug: string;
    floorSlug: string;
};

export default function PanoramaPlan({ buildingSlug, floorSlug }: Props) {
    return <div>Panorama plan: {buildingSlug} / {floorSlug}</div>;
}