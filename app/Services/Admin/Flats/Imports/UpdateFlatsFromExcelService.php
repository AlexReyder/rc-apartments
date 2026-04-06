<?php

namespace App\Services\Admin\Flats\Imports;

use App\Exports\FlatsExport;
use App\Models\Flat;
use App\Services\Admin\Flats\FlatPayloadBuilder;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Throwable;

class UpdateFlatsFromExcelService
{
    private const COLUMN_ID = 0;
    private const COLUMN_STATUS = 1;
    private const COLUMN_ACTION = 2;
    private const COLUMN_BUILDING = 3;
    private const COLUMN_ENTRANCE = 4;
    private const COLUMN_FLOOR = 5;
    private const COLUMN_NUMBER = 6;
    private const COLUMN_ROOMS = 7;
    private const COLUMN_SQUARE = 8;
    private const COLUMN_LIVING_SQUARE = 9;
    private const COLUMN_CEILING_HEIGHT = 10;
    private const COLUMN_FINISHING = 11;
    private const COLUMN_FINISH_DATE = 12;
    private const COLUMN_PRICE_M2 = 13;
    private const COLUMN_PRICE = 14;
    private const COLUMN_ACTION_PRICE_M2 = 15;
    private const EXPECTED_COLUMN_COUNT = 20;

    public function __construct(
        private readonly FlatPayloadBuilder $payloadBuilder,
    ) {
    }

    public function handle(UploadedFile $file, bool $dryRun = false): array
    {
        try {
            $rows = $this->readRows($file);
        } catch (Throwable $e) {
            report($e);

            return $this->makeFatalResult(
                fileName: $file->getClientOriginalName(),
                dryRun: $dryRun,
                message: 'Не удалось прочитать Excel-файл. Проверьте, что вы загружаете корректный XLSX/XLS, полученный из экспорта.',
            );
        }

        if ($rows === []) {
            return $this->makeFatalResult(
                fileName: $file->getClientOriginalName(),
                dryRun: $dryRun,
                message: 'Excel-файл пустой. Загрузите файл, полученный из экспорта квартир.',
            );
        }

        $header = $this->normalizeHeaderRow($rows[0] ?? []);
        $expectedHeader = $this->normalizeHeaderRow(FlatsExport::exportHeadings());

        if ($header !== $expectedHeader) {
            return $this->makeFatalResult(
                fileName: $file->getClientOriginalName(),
                dryRun: $dryRun,
                message: 'Структура Excel не совпадает с шаблоном экспорта. Используйте файл, скачанный из раздела «Экспорт квартир».',
                errors: [[
                    'rowNumber' => 1,
                    'flatId' => null,
                    'field' => 'Заголовки',
                    'message' => 'Ожидается точный формат экспортируемого файла квартир.',
                ]],
            );
        }

        $processedRows = 0;
        $emptyRows = 0;
        $validRows = 0;
        $updatedRows = 0;
        $skippedRows = 0;
        $errors = [];
        $errorRowNumbers = [];

        foreach (array_slice($rows, 1) as $index => $row) {
            $rowNumber = $index + 2;
            $row = $this->normalizeRow($row);

            if ($this->rowIsEmpty($row)) {
                $emptyRows++;
                continue;
            }

            $processedRows++;

            $rowResult = $this->mapRow($row, $rowNumber);

            if ($rowResult['errors'] !== []) {
                $errors = [...$errors, ...$rowResult['errors']];
                $errorRowNumbers[$rowNumber] = true;
                continue;
            }

            /** @var int $flatId */
            $flatId = $rowResult['flatId'];
            /** @var array<string, mixed> $validated */
            $validated = $rowResult['validated'];

            $flat = Flat::query()->find($flatId);

            if (! $flat) {
                $errors[] = [
                    'rowNumber' => $rowNumber,
                    'flatId' => $flatId,
                    'field' => 'ID',
                    'message' => 'Квартира с таким ID не найдена. Импорт обновляет только существующие записи.',
                ];
                $errorRowNumbers[$rowNumber] = true;
                continue;
            }

            $payload = $this->payloadBuilder->build(
                validated: $validated,
                apartmentPlanPath: $flat->plan,
                floorPlanPath: $flat->floor_position,
                isUpdate: true,
            );

            $changes = $this->detectChanges($flat, $payload);

            $validRows++;

            if ($changes === []) {
                $skippedRows++;
                continue;
            }

            if (! $dryRun) {
                $flat->forceFill($payload)->save();
            }

            $updatedRows++;
        }

        return [
            'mode' => 'update_existing',
            'isDryRun' => $dryRun,
            'fileName' => $file->getClientOriginalName(),
            'fatalError' => null,
            'processedRows' => $processedRows,
            'emptyRows' => $emptyRows,
            'validRows' => $validRows,
            'updatedRows' => $updatedRows,
            'skippedRows' => $skippedRows,
            'errorRows' => count($errorRowNumbers),
            'errors' => $errors,
        ];
    }

    /**
     * @return array<int, array<int, mixed>>
     */
    private function readRows(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $worksheet = $spreadsheet->getSheet(0);
        $highestRow = max($worksheet->getHighestDataRow(), 1);

        /** @var array<int, array<int, mixed>> $rows */
        $rows = $worksheet->rangeToArray(
            'A1:T'.$highestRow,
            null,
            true,
            false,
            false,
        );

        return $rows;
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<int, string>
     */
    private function normalizeHeaderRow(array $row): array
    {
        $row = array_pad($row, self::EXPECTED_COLUMN_COUNT, null);

        return array_map(
            fn ($value) => preg_replace('/\s+/u', ' ', trim((string) ($value ?? ''))) ?? '',
            array_slice($row, 0, self::EXPECTED_COLUMN_COUNT),
        );
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<int, mixed>
     */
    private function normalizeRow(array $row): array
    {
        return array_pad(array_slice($row, 0, self::EXPECTED_COLUMN_COUNT), self::EXPECTED_COLUMN_COUNT, null);
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function rowIsEmpty(array $row): bool
    {
        foreach ($row as $value) {
            if (trim($this->stringValue($value)) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array{
     *     flatId: int|null,
     *     validated: array<string, mixed>,
     *     errors: array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>
     * }
     */
    private function mapRow(array $row, int $rowNumber): array
    {
        $errors = [];

        $flatId = $this->parseRequiredInteger($row[self::COLUMN_ID], 'ID', $rowNumber, $errors, min: 1);
        $status = $this->parseStatus($row[self::COLUMN_STATUS], $rowNumber, $flatId, $errors);
        $action = $this->parseAction($row[self::COLUMN_ACTION], $rowNumber, $flatId, $errors);

        $building = $this->parseRequiredInteger($row[self::COLUMN_BUILDING], 'Корпус', $rowNumber, $errors, $flatId, 1);
        $entrance = $this->parseRequiredInteger($row[self::COLUMN_ENTRANCE], 'Подъезд', $rowNumber, $errors, $flatId, 1);
        $floor = $this->parseRequiredInteger($row[self::COLUMN_FLOOR], 'Этаж', $rowNumber, $errors, $flatId, 1);
        $number = $this->parseRequiredInteger($row[self::COLUMN_NUMBER], 'Номер квартиры', $rowNumber, $errors, $flatId, 1);
        $rooms = $this->parseRooms($row[self::COLUMN_ROOMS], $rowNumber, $flatId, $errors);
        $square = $this->parseRequiredFloat($row[self::COLUMN_SQUARE], 'Общая площадь, м²', $rowNumber, $errors, $flatId, 0);
        $livingSquare = $this->parseRequiredFloat($row[self::COLUMN_LIVING_SQUARE], 'Жилая площадь, м²', $rowNumber, $errors, $flatId, 0);
        $ceilingHeight = $this->parseRequiredFloat($row[self::COLUMN_CEILING_HEIGHT], 'Высота потолков, м', $rowNumber, $errors, $flatId, 0);
        $finishing = $this->parseRequiredString($row[self::COLUMN_FINISHING], 'Отделка', $rowNumber, $errors, $flatId);
        $finishDate = $this->parseRequiredString($row[self::COLUMN_FINISH_DATE], 'Дата окончания строительства', $rowNumber, $errors, $flatId);
        $priceM2 = $this->parseRequiredInteger($row[self::COLUMN_PRICE_M2], 'Цена за кв.м., ₽', $rowNumber, $errors, $flatId, 0);
        $price = $this->parseRequiredInteger($row[self::COLUMN_PRICE], 'Стоимость квартиры, ₽', $rowNumber, $errors, $flatId, 0);

        $actionPriceM2 = 0;

        if ($action === true) {
            $actionPriceM2 = $this->parseRequiredInteger(
                $row[self::COLUMN_ACTION_PRICE_M2],
                'Аукционная цена за кв.м., ₽',
                $rowNumber,
                $errors,
                $flatId,
                0,
            );
        }

        if ($errors !== []) {
            return [
                'flatId' => $flatId,
                'validated' => [],
                'errors' => $errors,
            ];
        }

        return [
            'flatId' => $flatId,
            'validated' => [
                'building' => $building,
                'entrance_number' => $entrance,
                'floor' => $floor,
                'number' => $number,
                'rooms_number' => $rooms,
                'square' => $square,
                'living_square' => $livingSquare,
                'ceiling_height' => $ceilingHeight,
                'price_m2' => $priceM2,
                'price' => $price,
                'action' => $action,
                'action_price_m2' => $action === true ? $actionPriceM2 : 0,
                'finishing' => $finishing,
                'finish_date' => $finishDate,
                'status' => $status,
            ],
            'errors' => [],
        ];
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseRequiredInteger(
        mixed $value,
        string $field,
        int $rowNumber,
        array &$errors,
        ?int $flatId = null,
        int $min = 0,
    ): ?int {
        $normalized = $this->normalizeNumeric($value);

        if ($normalized === '') {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Поле обязательно для заполнения.');

            return null;
        }

        if (! is_numeric($normalized)) {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Ожидается целое число.');

            return null;
        }

        $number = (float) $normalized;

        if (floor($number) !== $number) {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Ожидается целое число.');

            return null;
        }

        if ($number < $min) {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, "Значение не может быть меньше {$min}.");

            return null;
        }

        return (int) $number;
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseRequiredFloat(
        mixed $value,
        string $field,
        int $rowNumber,
        array &$errors,
        ?int $flatId = null,
        float $min = 0,
    ): ?float {
        $normalized = $this->normalizeNumeric($value);

        if ($normalized === '') {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Поле обязательно для заполнения.');

            return null;
        }

        if (! is_numeric($normalized)) {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Ожидается число.');

            return null;
        }

        $number = (float) $normalized;

        if ($number < $min) {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, "Значение не может быть меньше {$min}.");

            return null;
        }

        return round($number, 2);
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseRequiredString(
        mixed $value,
        string $field,
        int $rowNumber,
        array &$errors,
        ?int $flatId = null,
        int $maxLength = 255,
    ): ?string {
        $normalized = trim($this->stringValue($value));

        if ($normalized === '') {
            $errors[] = $this->makeRowError($rowNumber, $flatId, $field, 'Поле обязательно для заполнения.');

            return null;
        }

        if (mb_strlen($normalized) > $maxLength) {
            $errors[] = $this->makeRowError(
                $rowNumber,
                $flatId,
                $field,
                "Значение не должно быть длиннее {$maxLength} символов.",
            );

            return null;
        }

        return $normalized;
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseRooms(
        mixed $value,
        int $rowNumber,
        ?int $flatId,
        array &$errors,
    ): ?int {
        $rooms = $this->parseRequiredInteger(
            $value,
            'Комнат',
            $rowNumber,
            $errors,
            $flatId,
            0,
        );

        if ($rooms === null) {
            return null;
        }

        if (! in_array($rooms, [0, 1, 2, 3, 4], true)) {
            $errors[] = $this->makeRowError(
                $rowNumber,
                $flatId,
                'Комнат',
                'Допустимые значения: 0, 1, 2, 3, 4.',
            );

            return null;
        }

        return $rooms;
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseStatus(
        mixed $value,
        int $rowNumber,
        ?int $flatId,
        array &$errors,
    ): ?string {
        $normalized = mb_strtolower(trim($this->stringValue($value)));

        return match ($normalized) {
            'доступна' => 'available',
            'продана' => 'sold',
            'скрыта' => 'hidden',
            '' => $this->pushAndReturnNull($errors, $this->makeRowError(
                $rowNumber,
                $flatId,
                'Статус',
                'Поле обязательно для заполнения.',
            )),
            default => $this->pushAndReturnNull($errors, $this->makeRowError(
                $rowNumber,
                $flatId,
                'Статус',
                'Допустимые значения: Доступна, Продана, Скрыта.',
            )),
        };
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     */
    private function parseAction(
        mixed $value,
        int $rowNumber,
        ?int $flatId,
        array &$errors,
    ): ?bool {
        $normalized = mb_strtolower(trim($this->stringValue($value)));

        return match ($normalized) {
            'да' => true,
            'нет' => false,
            '' => $this->pushAndReturnNull($errors, $this->makeRowError(
                $rowNumber,
                $flatId,
                'Аукцион',
                'Поле обязательно для заполнения.',
            )),
            default => $this->pushAndReturnNull($errors, $this->makeRowError(
                $rowNumber,
                $flatId,
                'Аукцион',
                'Допустимые значения: Да, Нет.',
            )),
        };
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     * @return null
     */
    private function pushAndReturnNull(array &$errors, array $error): null
    {
        $errors[] = $error;

        return null;
    }

    /**
     * @return array{rowNumber:int, flatId:int|null, field:string, message:string}
     */
    private function makeRowError(
        int $rowNumber,
        ?int $flatId,
        string $field,
        string $message,
    ): array {
        return [
            'rowNumber' => $rowNumber,
            'flatId' => $flatId,
            'field' => $field,
            'message' => $message,
        ];
    }

    private function normalizeNumeric(mixed $value): string
    {
        $string = $this->stringValue($value);
        $string = preg_replace('/[\h\x{00A0}]+/u', '', $string) ?? $string;
        $string = str_replace(',', '.', $string);

        return trim($string);
    }

    private function stringValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return trim((string) $value);
    }

    /**
     * @return array<string, array{from:mixed, to:mixed}>
     */
    private function detectChanges(Flat $flat, array $payload): array
    {
        $keys = [
            'rooms_number',
            'rooms_number_true',
            'floor',
            'square',
            'entrance_number',
            'living_square',
            'ceiling_height',
            'sold',
            'building',
            'number',
            'price',
            'price_m2',
            'action',
            'action_price_m2',
            'finish_date',
            'finishing',
            'title',
            'description',
            'plan',
            'floor_position',
        ];

        $changes = [];

        foreach ($keys as $key) {
            $current = $flat->getAttribute($key);
            $next = $payload[$key] ?? null;

            if ($this->valuesDiffer($current, $next)) {
                $changes[$key] = [
                    'from' => $current,
                    'to' => $next,
                ];
            }
        }

        return $changes;
    }

    private function valuesDiffer(mixed $current, mixed $next): bool
    {
        if ($current === null && $next === null) {
            return false;
        }

        if ($current === null || $next === null) {
            return trim((string) $current) !== trim((string) $next);
        }

        if (is_numeric($current) && is_numeric($next)) {
            return abs((float) $current - (float) $next) > 0.00001;
        }

        return trim((string) $current) !== trim((string) $next);
    }

    /**
     * @param  array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>  $errors
     * @return array{
     *     mode: string,
     *     isDryRun: bool,
     *     fileName: string,
     *     fatalError: string,
     *     processedRows: int,
     *     emptyRows: int,
     *     validRows: int,
     *     updatedRows: int,
     *     skippedRows: int,
     *     errorRows: int,
     *     errors: array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>
     * }
     */
    private function makeFatalResult(
        string $fileName,
        bool $dryRun,
        string $message,
        array $errors = [],
    ): array {
        return [
            'mode' => 'update_existing',
            'isDryRun' => $dryRun,
            'fileName' => $fileName,
            'fatalError' => $message,
            'processedRows' => 0,
            'emptyRows' => 0,
            'validRows' => 0,
            'updatedRows' => 0,
            'skippedRows' => 0,
            'errorRows' => $errors === [] ? 0 : count(array_unique(array_column($errors, 'rowNumber'))),
            'errors' => $errors,
        ];
    }
}