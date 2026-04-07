import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CatalogRangeFilter from './catalog-range-filter';
import type { CatalogFilterMeta, CatalogFilters } from './catalog-types';
import { formatArea, formatPrice, getRoomsChipLabel } from './catalog-utils';

type CatalogFiltersProps = {
    filters: CatalogFilters;
    filterMeta: CatalogFilterMeta;
    onFiltersChange: (updates: Partial<CatalogFilters>) => void;
    onReset: () => void;
};

function areNumbersClose(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.001;
}

export default function CatalogFilters({ filters, filterMeta, onFiltersChange, onReset }: CatalogFiltersProps) {
    const [priceRange, setPriceRange] = useState<[number, number]>([
        filters.priceFrom ?? filterMeta.minPrice,
        filters.priceTo ?? filterMeta.maxPrice,
    ]);

    const [areaRange, setAreaRange] = useState<[number, number]>([filters.areaFrom ?? filterMeta.minArea, filters.areaTo ?? filterMeta.maxArea]);

    const [floorRange, setFloorRange] = useState<[number, number]>([
        filters.floorFrom ?? filterMeta.minFloor,
        filters.floorTo ?? filterMeta.maxFloor,
    ]);

    useEffect(() => {
        setPriceRange([filters.priceFrom ?? filterMeta.minPrice, filters.priceTo ?? filterMeta.maxPrice]);
    }, [filters.priceFrom, filters.priceTo, filterMeta.minPrice, filterMeta.maxPrice]);

    useEffect(() => {
        setAreaRange([filters.areaFrom ?? filterMeta.minArea, filters.areaTo ?? filterMeta.maxArea]);
    }, [filters.areaFrom, filters.areaTo, filterMeta.minArea, filterMeta.maxArea]);

    useEffect(() => {
        setFloorRange([filters.floorFrom ?? filterMeta.minFloor, filters.floorTo ?? filterMeta.maxFloor]);
    }, [filters.floorFrom, filters.floorTo, filterMeta.minFloor, filterMeta.maxFloor]);

    const normalizedPriceRange = useMemo<[number | null, number | null]>(() => {
        const nextFrom = priceRange[0] <= filterMeta.minPrice ? null : Math.round(priceRange[0]);
        const nextTo = priceRange[1] >= filterMeta.maxPrice ? null : Math.round(priceRange[1]);

        return [nextFrom, nextTo];
    }, [filterMeta.maxPrice, filterMeta.minPrice, priceRange]);

    const normalizedAreaRange = useMemo<[number | null, number | null]>(() => {
        const nextFrom = areNumbersClose(areaRange[0], filterMeta.minArea) ? null : Number(areaRange[0].toFixed(1));
        const nextTo = areNumbersClose(areaRange[1], filterMeta.maxArea) ? null : Number(areaRange[1].toFixed(1));

        return [nextFrom, nextTo];
    }, [areaRange, filterMeta.maxArea, filterMeta.minArea]);

    const normalizedFloorRange = useMemo<[number | null, number | null]>(() => {
        const nextFrom = floorRange[0] <= filterMeta.minFloor ? null : Math.round(floorRange[0]);
        const nextTo = floorRange[1] >= filterMeta.maxFloor ? null : Math.round(floorRange[1]);

        return [nextFrom, nextTo];
    }, [filterMeta.maxFloor, filterMeta.minFloor, floorRange]);

    useEffect(() => {
        const isSameFrom = (filters.priceFrom ?? null) === normalizedPriceRange[0];
        const isSameTo = (filters.priceTo ?? null) === normalizedPriceRange[1];

        if (isSameFrom && isSameTo) {
            return;
        }

        const timeout = window.setTimeout(() => {
            onFiltersChange({
                priceFrom: normalizedPriceRange[0],
                priceTo: normalizedPriceRange[1],
            });
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [filters.priceFrom, filters.priceTo, normalizedPriceRange, onFiltersChange]);

    useEffect(() => {
        const isSameFrom =
            (filters.areaFrom ?? null) === normalizedAreaRange[0] ||
            (filters.areaFrom !== null && normalizedAreaRange[0] !== null && areNumbersClose(filters.areaFrom, normalizedAreaRange[0]));
        const isSameTo =
            (filters.areaTo ?? null) === normalizedAreaRange[1] ||
            (filters.areaTo !== null && normalizedAreaRange[1] !== null && areNumbersClose(filters.areaTo, normalizedAreaRange[1]));

        if (isSameFrom && isSameTo) {
            return;
        }

        const timeout = window.setTimeout(() => {
            onFiltersChange({
                areaFrom: normalizedAreaRange[0],
                areaTo: normalizedAreaRange[1],
            });
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [filters.areaFrom, filters.areaTo, normalizedAreaRange, onFiltersChange]);

    useEffect(() => {
        const isSameFrom = (filters.floorFrom ?? null) === normalizedFloorRange[0];
        const isSameTo = (filters.floorTo ?? null) === normalizedFloorRange[1];

        if (isSameFrom && isSameTo) {
            return;
        }

        const timeout = window.setTimeout(() => {
            onFiltersChange({
                floorFrom: normalizedFloorRange[0],
                floorTo: normalizedFloorRange[1],
            });
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [filters.floorFrom, filters.floorTo, normalizedFloorRange, onFiltersChange]);

    const toggleMultiFilter = (field: 'rooms' | 'building', value: number) => {
        const currentValues = filters[field];
        const nextValues = currentValues.includes(value)
            ? currentValues.filter((item) => item !== value)
            : [...currentValues, value].sort((a, b) => a - b);

        onFiltersChange({
            [field]: nextValues,
        });
    };

    return (
        <section className="rounded-[32px] border border-white/10 bg-[#20364f]/85 p-5 shadow-[0_24px_80px_rgba(5,16,30,0.25)] backdrop-blur sm:p-6 lg:p-8">
            <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr_1fr]">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-white/75">Кол-во комнат</p>

                        <div className="flex flex-wrap gap-3">
                            {filterMeta.rooms.map((room) => {
                                const isActive = filters.rooms.includes(room);

                                return (
                                    <button
                                        key={room}
                                        type="button"
                                        className={cn(
                                            'min-w-14 rounded-2xl border px-5 py-3 text-sm font-medium transition',
                                            isActive
                                                ? 'border-[#d6a07b] bg-[#d6a07b] text-[#1b3048]'
                                                : 'border-white/10 bg-[#16283d] text-white hover:border-white/25 hover:bg-[#1b3048]',
                                        )}
                                        onClick={() => toggleMultiFilter('rooms', room)}
                                    >
                                        {getRoomsChipLabel(room)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-white/75">Корпус</p>

                        <div className="flex flex-wrap gap-3">
                            {filterMeta.buildings.map((building) => {
                                const isActive = filters.building.includes(building);

                                return (
                                    <button
                                        key={building}
                                        type="button"
                                        className={cn(
                                            'min-w-14 rounded-2xl border px-5 py-3 text-sm font-medium transition',
                                            isActive
                                                ? 'border-[#d6a07b] bg-[#d6a07b] text-[#1b3048]'
                                                : 'border-white/10 bg-[#16283d] text-white hover:border-white/25 hover:bg-[#1b3048]',
                                        )}
                                        onClick={() => toggleMultiFilter('building', building)}
                                    >
                                        {building}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-white/25 bg-transparent px-6 text-white hover:bg-white hover:text-[#1b3048]"
                            onClick={onReset}
                        >
                            <RotateCcw className="size-4" />
                            Сбросить
                        </Button>
                    </div>
                </div>

                <CatalogRangeFilter
                    label="Стоимость"
                    min={filterMeta.minPrice}
                    max={filterMeta.maxPrice}
                    step={100000}
                    value={priceRange}
                    formatValue={(value) => formatPrice(Math.round(value))}
                    onValueChange={setPriceRange}
                />

                <div className="space-y-8">
                    <CatalogRangeFilter
                        label="Площадь"
                        min={filterMeta.minArea}
                        max={filterMeta.maxArea}
                        step={0.1}
                        value={areaRange}
                        formatValue={(value) => formatArea(Number(value.toFixed(1)))}
                        onValueChange={setAreaRange}
                    />

                    <CatalogRangeFilter
                        label="Этаж"
                        min={filterMeta.minFloor}
                        max={filterMeta.maxFloor}
                        step={1}
                        value={floorRange}
                        formatValue={(value) => String(Math.round(value))}
                        onValueChange={setFloorRange}
                    />
                </div>
            </div>
        </section>
    );
}
