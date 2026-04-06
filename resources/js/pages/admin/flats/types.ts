export type Flat = {
    id: number;
    slug: string;
    building: number;
    entrance: number | string | null;
    floor: number;
    number: number;
    rooms: number;
    rooms_true: number | null;
    rooms_number_true?: number | null;
    square: number;
    price: number;
    price_m2: number | null;
    action: 0 | 1;
    action_price_m2: number | null;
    display_price: number;
    display_price_m2: number | null;
    sold: 0 | 1 | 2;
    plan: string | null;
    floor_plan: string | null;
    finishing: string | null;
    living_square: number | null;
    ceiling_height: number | null;
    finish_date: string | null;
};

export type SortableColumn = 'id' | 'building' | 'floor' | 'number' | 'rooms_number' | 'square' | 'price' | 'sold';

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

export type FlatImportRowError = {
    rowNumber: number;
    flatId: number | null;
    field: string;
    message: string;
};

export type FlatsImportResult = {
    mode: 'update_existing';
    isDryRun: boolean;
    fileName: string;
    fatalError: string | null;
    processedRows: number;
    emptyRows: number;
    validRows: number;
    updatedRows: number;
    skippedRows: number;
    errorRows: number;
    errors: FlatImportRowError[];
};

export type FlatsPageProps = {
    filters: Filters;
    filterOptions: FilterOptions;
    flats: FlatsPagination;
};

export type NavigateParams = Partial<Filters & { page: number }>;

export type DraftFilters = Pick<Filters, 'building' | 'floor' | 'rooms'>;
