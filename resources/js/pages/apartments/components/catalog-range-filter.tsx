import { Slider } from '@/components/ui/slider';
import { KeyboardEvent, useEffect, useMemo, useState } from 'react';

type CatalogRangeFilterProps = {
    label: string;
    min: number;
    max: number;
    value: [number, number];
    step: number;
    formatValue: (value: number) => string;
    onValueChange: (value: [number, number]) => void;
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export default function CatalogRangeFilter({ label, min, max, value, step, formatValue, onValueChange }: CatalogRangeFilterProps) {
    const isDisabled = min === max;

    const decimalPlaces = useMemo(() => {
        if (step >= 1) {
            return 0;
        }

        const stepString = String(step);
        const parts = stepString.split('.');

        return parts[1]?.length ?? 1;
    }, [step]);

    const normalizeNumber = (input: number): number => {
        if (decimalPlaces === 0) {
            return Math.round(input);
        }

        return Number(input.toFixed(decimalPlaces));
    };

    const parseInputValue = (raw: string): number | null => {
        const normalized = raw
            .replace(/\s+/g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');

        if (normalized === '' || normalized === '.' || normalized === '-' || normalized === '-.') {
            return null;
        }

        const parsed = Number(normalized);

        if (Number.isNaN(parsed)) {
            return null;
        }

        return normalizeNumber(parsed);
    };

    const [fromInputValue, setFromInputValue] = useState(formatValue(value[0]));
    const [toInputValue, setToInputValue] = useState(formatValue(value[1]));
    const [isEditingFrom, setIsEditingFrom] = useState(false);
    const [isEditingTo, setIsEditingTo] = useState(false);

    useEffect(() => {
        if (!isEditingFrom) {
            setFromInputValue(formatValue(value[0]));
        }
    }, [value[0], formatValue, isEditingFrom]);

    useEffect(() => {
        if (!isEditingTo) {
            setToInputValue(formatValue(value[1]));
        }
    }, [value[1], formatValue, isEditingTo]);

    const commitFromValue = () => {
        setIsEditingFrom(false);

        const parsed = parseInputValue(fromInputValue);

        if (parsed === null) {
            setFromInputValue(formatValue(value[0]));
            return;
        }

        const nextFromValue = clamp(parsed, min, Math.min(value[1], max));

        onValueChange([nextFromValue, value[1]]);
        setFromInputValue(formatValue(nextFromValue));
    };

    const commitToValue = () => {
        setIsEditingTo(false);

        const parsed = parseInputValue(toInputValue);

        if (parsed === null) {
            onValueChange([value[0], max]);
            setToInputValue(formatValue(max));
            return;
        }

        if (parsed < value[0] || parsed < min || parsed > max) {
            onValueChange([value[0], max]);
            setToInputValue(formatValue(max));
            return;
        }

        const nextToValue = clamp(parsed, min, max);

        onValueChange([value[0], nextToValue]);
        setToInputValue(formatValue(nextToValue));
    };

    const handleFromKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    const handleToKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur();
        }
    };

    return (
        <div className="space-y-5">
            <div className="space-y-3">
                <p className="text-[20px] font-normal text-[#8f909a]">{label}</p>

                <div className="rounded-lg border border-[#eceef3] bg-[#eceef4] px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <input
                            type="text"
                            inputMode={step < 1 ? 'decimal' : 'numeric'}
                            value={fromInputValue}
                            disabled={isDisabled}
                            className="min-w-0 flex-1 bg-transparent text-left text-[18px] font-medium text-[#1A2431] outline-hidden placeholder:text-[#9da3af] disabled:cursor-not-allowed"
                            onFocus={() => setIsEditingFrom(true)}
                            onChange={(event) => setFromInputValue(event.target.value)}
                            onBlur={commitFromValue}
                            onKeyDown={handleFromKeyDown}
                        />

                        <input
                            type="text"
                            inputMode={step < 1 ? 'decimal' : 'numeric'}
                            value={toInputValue}
                            disabled={isDisabled}
                            className="min-w-0 flex-1 bg-transparent text-right text-[18px] font-medium text-[#1A2431] outline-hidden placeholder:text-[#9da3af] disabled:cursor-not-allowed"
                            onFocus={() => setIsEditingTo(true)}
                            onChange={(event) => setToInputValue(event.target.value)}
                            onBlur={commitToValue}
                            onKeyDown={handleToKeyDown}
                        />
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
