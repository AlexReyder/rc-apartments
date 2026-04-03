export type Flat = {
    id: number;
    slug: string;
    building: number;
    entrance: number | string | null;
    floor: number;
    number: number;
    rooms: number;
    square: number;
    price: number;
    sold: boolean;
    plan: string | null;
    finishing: string | null;
};

export type SortableColumn =
    | 'id'
    | 'building'
    | 'floor'
    | 'number'
    | 'rooms_number'
    | 'square'
    | 'price'
    | 'sold';

export type ViewMode = 'table' | 'list';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type FlatsPagination = {
    data: Flat[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

export type Filters = {
    search: string;
    perPage: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    view: ViewMode;
    building: number[];
    floor: number[];
    rooms: number[];
};

export type FilterOptions = {
    building: number[];
    floor: number[];
    rooms: number[];
};

export type FlatsPageProps = {
    filters: Filters;
    filterOptions: FilterOptions;
    flats: FlatsPagination;
};

export type NavigateParams = Partial<Filters & { page: number }>;

export type DraftFilters = Pick<Filters, 'building' | 'floor' | 'rooms'>;