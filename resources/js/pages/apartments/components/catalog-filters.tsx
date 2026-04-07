import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CatalogRangeFilter from './catalog-range-filter';
import type { CatalogFilterMeta, CatalogFilters } from './catalog-types';
import { formatArea, formatPrice } from './catalog-utils';

type CatalogFiltersProps = {
    filters: CatalogFilters;
    filterMeta: CatalogFilterMeta;
    onFiltersChange: (updates: Partial<CatalogFilters>) => void;
    onReset: () => void;
};

const ROOM_OPTIONS = [0, 1, 2, 3, 4];

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
        <section className="space-y-8">
            <div className="grid gap-8 xl:grid-cols-4">
                <div className="space-y-4">
                    <p className="text-[20px] font-normal text-[#8f909a]">Комнатность</p>

                    <div className="flex flex-wrap gap-2">
                        {ROOM_OPTIONS.map((room) => {
                            const isActive = filters.rooms.includes(room);

                            return (
                                <button
                                    key={room}
                                    type="button"
                                    className={cn(
                                        'rounded-lg border px-6 py-4 text-[18px] font-normal transition',
                                        room === 0 ? 'min-w-[162px]' : 'min-w-16',
                                        isActive
                                            ? 'border-[#456bf3] bg-[#456bf3] text-white'
                                            : 'border-[#eaebef] bg-[#eceef4] text-[#5f6170] hover:border-[#d6dae4] hover:bg-[#e7e9f0]',
                                    )}
                                    onClick={() => toggleMultiFilter('rooms', room)}
                                >
                                    {room === 0 ? 'Студия' : String(room)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-3 pt-6">
                        <p className="text-[20px] font-normal text-[#8f909a]">Корпус</p>

                        <div className="flex flex-wrap gap-2">
                            {filterMeta.buildings.map((building) => {
                                const isActive = filters.building.includes(building);

                                return (
                                    <button
                                        key={building}
                                        type="button"
                                        className={cn(
                                            'min-w-16 rounded-lg border px-6 py-4 text-[18px] font-normal transition',
                                            isActive
                                                ? 'border-[#456bf3] bg-[#456bf3] text-white'
                                                : 'border-[#eaebef] bg-[#eceef4] text-[#5f6170] hover:border-[#d6dae4] hover:bg-[#e7e9f0]',
                                        )}
                                        onClick={() => toggleMultiFilter('building', building)}
                                    >
                                        {building}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <CatalogRangeFilter
                    label="Стоимость, руб"
                    min={filterMeta.minPrice}
                    max={filterMeta.maxPrice}
                    step={100000}
                    value={priceRange}
                    formatValue={(value) => formatPrice(Math.round(value)).replace(' ₽', '')}
                    onValueChange={setPriceRange}
                />

                <CatalogRangeFilter
                    label="Площадь, м2"
                    min={filterMeta.minArea}
                    max={filterMeta.maxArea}
                    step={0.1}
                    value={areaRange}
                    formatValue={(value) => formatArea(Number(value.toFixed(1))).replace(' м²', '')}
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

            <div className="flex justify-end">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 text-[18px] font-normal text-[#a0a2ad] transition hover:text-[#7a7c87]"
                    onClick={onReset}
                >
                    <RotateCcw className="size-4" />
                    Сбросить фильтры
                </button>
            </div>
        </section>
    );
}
