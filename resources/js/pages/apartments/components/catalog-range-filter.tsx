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
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm font-medium text-white/75">{label}</p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-[#16283d] px-4 py-3 text-sm font-medium text-white">
                        от {formatValue(value[0])}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#16283d] px-4 py-3 text-right text-sm font-medium text-white">
                        до {formatValue(value[1])}
                    </div>
                </div>
            </div>

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
    );
}
