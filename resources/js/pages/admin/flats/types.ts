export type FlatImportRowError = {
    rowNumber: number;
    flatId: number | null;
    field: string;
    message: string;
};

export type FlatImportMode = 'update_existing' | 'replace_all_archive';

export type FlatsImportResult = {
    mode: FlatImportMode;
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
    matchedPlanFiles?: number;
    missingPlanFiles?: number;
    matchedFloorPositionFiles?: number;
    missingFloorPositionFiles?: number;
    unusedPlanFiles?: number;
    unusedFloorPositionFiles?: number;
};
