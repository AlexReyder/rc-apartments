export type CatalogSortBy = 'price' | 'square' | 'floor';
export type CatalogSortDirection = 'asc' | 'desc';
export type CatalogViewMode = 'list' | 'grid';

export type CatalogFlat = {
    id: number;
    slug: string;
    number: number;
    building: number;
    entrance: number | null;
    floor: number;
    rooms: number;
    square: number;
    price: number;
    pricePerMeter: number;
    finishing: string | null;
    plan: string | null;
};

export type CatalogFilters = {
    rooms: number[];
    building: number[];
    priceFrom: number | null;
    priceTo: number | null;
    areaFrom: number | null;
    areaTo: number | null;
    floorFrom: number | null;
    floorTo: number | null;
    sortBy: CatalogSortBy;
    sortDirection: CatalogSortDirection;
    view: CatalogViewMode;
};

export type CatalogFilterMeta = {
    minPrice: number;
    maxPrice: number;
    minArea: number;
    maxArea: number;
    minFloor: number;
    maxFloor: number;
    rooms: number[];
    buildings: number[];
};

export type CatalogPaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type CatalogPaginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: CatalogPaginatorLink[];
};
