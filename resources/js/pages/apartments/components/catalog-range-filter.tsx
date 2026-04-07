import { Slider } from '@/components/ui/slider';

type CatalogRangeFilterProps = {
    label: string;
    min: number;
    max: number;
    value: [number, number];
    step: number;
    formatValue: (value: number) => string;
    onValueChange: (value: [number, number]) => void;
};

export default function CatalogRangeFilter({ label, min, max, value, step, formatValue, onValueChange }: CatalogRangeFilterProps) {
    const isDisabled = min === max;

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <p className="text-[20px] font-normal text-[#8f909a]">{label}</p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#eceef3] bg-[#eceef4] px-6 py-4 text-[18px] font-medium text-[#1A2431]">
                        {formatValue(value[0])}
                    </div>
                    <div className="rounded-lg border border-[#eceef3] bg-[#eceef4] px-6 py-4 text-right text-[18px] font-medium text-[#1A2431]">
                        {formatValue(value[1])}
                    </div>
                </div>
            </div>

            <div className="px-2">
                <Slider
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    minStepsBetweenThumbs={1}
                    disabled={isDisabled}
                    onValueChange={(nextValue) => onValueChange(nextValue as [number, number])}
                />
            </div>
        </div>
    );
}
