<?php

namespace App\Services\Admin\Flats\Imports;

use App\Models\Flat;
use App\Services\Admin\Flats\FlatPayloadBuilder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use Symfony\Component\Finder\SplFileInfo;
use Throwable;
use ZipArchive;

class ReplaceFlatsFromArchiveService
{
    private const MODE = 'replace_all_archive';
    private const PLAN_SUFFIX = '_plan';
    private const FLOOR_POSITION_SUFFIX = '_floor_position';

    private const REQUIRED_HEADINGS = [
        'Статус',
        'Аукцион',
        'Корпус',
        'Подъезд',
        'Этаж',
        'Номер квартиры',
        'Комнат',
        'Общая площадь, м²',
        'Жилая площадь, м²',
        'Высота потолков, м',
        'Отделка',
        'Дата окончания строительства',
        'Цена за кв.м., ₽',
        'Стоимость квартиры, ₽',
        'Аукционная цена за кв.м., ₽',
    ];

    private const OPTIONAL_ROOMS_TRUE_HEADING = 'Фактическая комнатность';

    public function __construct(
        private readonly FlatPayloadBuilder $payloadBuilder,
    ) {
    }

    public function handle(UploadedFile $file, bool $dryRun = false): array
    {
        $tempDir = storage_path('app/tmp/flats-import-'.bin2hex(random_bytes(10)));

        try {
            File::ensureDirectoryExists($tempDir);

            try {
                $this->extractArchive($file, $tempDir);
                $excelPath = $this->findSingleExcelFile($tempDir);
                $plansDirectory = $this->findSingleDirectoryByName($tempDir, 'plans');
                $floorPositionsDirectory = $this->findSingleDirectoryByName($tempDir, 'floor_positions');
                [$headerMap, $rows] = $this->readSpreadsheet($excelPath);
                $planFiles = $this->buildImageMap($plansDirectory, self::PLAN_SUFFIX, 'plans');
                $floorPositionFiles = $this->buildImageMap($floorPositionsDirectory, self::FLOOR_POSITION_SUFFIX, 'floor_positions');
            } catch (RuntimeException $e) {
                return $this->makeFatalResult(
                    fileName: $file->getClientOriginalName(),
                    dryRun: $dryRun,
                    message: $e->getMessage(),
                );
            } catch (Throwable $e) {
                report($e);

                return $this->makeFatalResult(
                    fileName: $file->getClientOriginalName(),
                    dryRun: $dryRun,
                    message: 'Не удалось обработать ZIP-архив. Проверьте структуру архива и попробуйте снова.',
                );
            }

            $processedRows = 0;
            $emptyRows = 0;
            $validRows = 0;
            $errors = [];
            $errorRowNumbers = [];
            $preparedRows = [];
            $seenSlugs = [];
            $usedPlanSlugs = [];
            $usedFloorPositionSlugs = [];
            $matchedPlanFiles = 0;
            $missingPlanFiles = 0;
            $matchedFloorPositionFiles = 0;
            $missingFloorPositionFiles = 0;

            foreach (array_slice($rows, 1) as $index => $row) {
                $rowNumber = $index + 2;

                if ($this->rowIsEmpty($row)) {
                    $emptyRows++;
                    continue;
                }

                $processedRows++;

                $rowResult = $this->mapRow($row, $headerMap, $rowNumber);

                if ($rowResult['errors'] !== []) {
                    $errors = [...$errors, ...$rowResult['errors']];
                    $errorRowNumbers[$rowNumber] = true;
                    continue;
                }

                $validated = $rowResult['validated'];
                $slug = Flat::makeSlug(
                    (int) $validated['building'],
                    (int) $validated['floor'],
                    (int) $validated['number'],
                );

                if (isset($seenSlugs[$slug])) {
                    $errors[] = $this->makeRowError(
                        $rowNumber,
                        'Slug',
                        "Дублирующийся slug {$slug} в Excel. Проверьте корпус, этаж и номер квартиры.",
                    );
                    $errorRowNumbers[$rowNumber] = true;
                    continue;
                }

                $seenSlugs[$slug] = true;

                $planSourcePath = $planFiles[$slug] ?? null;
                $floorPositionSourcePath = $floorPositionFiles[$slug] ?? null;

                if ($planSourcePath !== null) {
                    $matchedPlanFiles++;
                    $usedPlanSlugs[$slug] = true;
                } else {
                    $missingPlanFiles++;
                }

                if ($floorPositionSourcePath !== null) {
                    $matchedFloorPositionFiles++;
                    $usedFloorPositionSlugs[$slug] = true;
                } else {
                    $missingFloorPositionFiles++;
                }

                $preparedRows[] = [
                    'slug' => $slug,
                    'validated' => $validated,
                    'planSourcePath' => $planSourcePath,
                    'floorPositionSourcePath' => $floorPositionSourcePath,
                ];

                $validRows++;
            }

            $unusedPlanFiles = count(array_diff(array_keys($planFiles), array_keys($usedPlanSlugs)));
            $unusedFloorPositionFiles = count(array_diff(array_keys($floorPositionFiles), array_keys($usedFloorPositionSlugs)));
            $rowsToCreate = count($preparedRows);

            if ($dryRun) {
                return $this->makeResult(
                    fileName: $file->getClientOriginalName(),
                    dryRun: true,
                    fatalError: null,
                    processedRows: $processedRows,
                    emptyRows: $emptyRows,
                    validRows: $validRows,
                    updatedRows: $rowsToCreate,
                    errorRows: count($errorRowNumbers),
                    errors: $errors,
                    matchedPlanFiles: $matchedPlanFiles,
                    missingPlanFiles: $missingPlanFiles,
                    matchedFloorPositionFiles: $matchedFloorPositionFiles,
                    missingFloorPositionFiles: $missingFloorPositionFiles,
                    unusedPlanFiles: $unusedPlanFiles,
                    unusedFloorPositionFiles: $unusedFloorPositionFiles,
                );
            }

            if ($errors !== []) {
                return $this->makeResult(
                    fileName: $file->getClientOriginalName(),
                    dryRun: false,
                    fatalError: 'Полный импорт не выполнен: архив не прошёл проверку. Исправьте ошибки и повторите импорт.',
                    processedRows: $processedRows,
                    emptyRows: $emptyRows,
                    validRows: $validRows,
                    updatedRows: 0,
                    errorRows: count($errorRowNumbers),
                    errors: $errors,
                    matchedPlanFiles: $matchedPlanFiles,
                    missingPlanFiles: $missingPlanFiles,
                    matchedFloorPositionFiles: $matchedFloorPositionFiles,
                    missingFloorPositionFiles: $missingFloorPositionFiles,
                    unusedPlanFiles: $unusedPlanFiles,
                    unusedFloorPositionFiles: $unusedFloorPositionFiles,
                );
            }

            $batchId = now()->format('YmdHis').'-'.bin2hex(random_bytes(6));
            $oldFilesToDelete = Flat::query()
                ->select(['plan', 'floor_position'])
                ->get()
                ->flatMap(function (Flat $flat) {
                    return [
                        $this->normalizePublicStoragePath($flat->plan),
                        $this->normalizePublicStoragePath($flat->floor_position),
                    ];
                })
                ->filter()
                ->unique()
                ->values()
                ->all();

            $newFilesToDelete = [];
            $payloads = [];

            try {
                foreach ($preparedRows as $preparedRow) {
                    $slug = $preparedRow['slug'];
                    $planStoragePath = $preparedRow['planSourcePath']
                        ? $this->makePlanStoragePath($batchId, $slug, $preparedRow['planSourcePath'])
                        : null;
                    $floorPositionStoragePath = $preparedRow['floorPositionSourcePath']
                        ? $this->makeFloorPositionStoragePath($batchId, $slug, $preparedRow['floorPositionSourcePath'])
                        : null;

                    if ($planStoragePath !== null) {
                        $this->storePublicFile($preparedRow['planSourcePath'], $planStoragePath);
                        $newFilesToDelete[] = $planStoragePath;
                    }

                    if ($floorPositionStoragePath !== null) {
                        $this->storePublicFile($preparedRow['floorPositionSourcePath'], $floorPositionStoragePath);
                        $newFilesToDelete[] = $floorPositionStoragePath;
                    }

                    $payloads[] = $this->payloadBuilder->build(
                        validated: $preparedRow['validated'],
                        apartmentPlanPath: $planStoragePath ? 'storage/'.$planStoragePath : null,
                        floorPlanPath: $floorPositionStoragePath ? 'storage/'.$floorPositionStoragePath : null,
                        isUpdate: false,
                        currentRoomsNumberTrue: null,
                    );
                }

                DB::connection('mysql')->transaction(function () use ($payloads) {
                    Flat::query()->delete();

                    foreach ($payloads as $payload) {
                        Flat::query()->create($payload);
                    }
                });
            } catch (Throwable $e) {
                report($e);
                $this->deletePublicFiles($newFilesToDelete);

                return $this->makeResult(
                    fileName: $file->getClientOriginalName(),
                    dryRun: false,
                    fatalError: 'Не удалось выполнить полный импорт архива. Попробуйте снова.',
                    processedRows: $processedRows,
                    emptyRows: $emptyRows,
                    validRows: $validRows,
                    updatedRows: 0,
                    errorRows: count($errorRowNumbers),
                    errors: $errors,
                    matchedPlanFiles: $matchedPlanFiles,
                    missingPlanFiles: $missingPlanFiles,
                    matchedFloorPositionFiles: $matchedFloorPositionFiles,
                    missingFloorPositionFiles: $missingFloorPositionFiles,
                    unusedPlanFiles: $unusedPlanFiles,
                    unusedFloorPositionFiles: $unusedFloorPositionFiles,
                );
            }

            $this->deletePublicFiles($oldFilesToDelete);

            return $this->makeResult(
                fileName: $file->getClientOriginalName(),
                dryRun: false,
                fatalError: null,
                processedRows: $processedRows,
                emptyRows: $emptyRows,
                validRows: $validRows,
                updatedRows: $rowsToCreate,
                errorRows: 0,
                errors: [],
                matchedPlanFiles: $matchedPlanFiles,
                missingPlanFiles: $missingPlanFiles,
                matchedFloorPositionFiles: $matchedFloorPositionFiles,
                missingFloorPositionFiles: $missingFloorPositionFiles,
                unusedPlanFiles: $unusedPlanFiles,
                unusedFloorPositionFiles: $unusedFloorPositionFiles,
            );
        } finally {
            File::deleteDirectory($tempDir);
        }
    }

    private function extractArchive(UploadedFile $file, string $destination): void
    {
        if (! class_exists(ZipArchive::class)) {
            throw new RuntimeException('На сервере не установлено расширение PHP zip. Полный импорт архива недоступен.');
        }

        $zip = new ZipArchive();
        $opened = $zip->open($file->getRealPath());

        if ($opened !== true) {
            throw new RuntimeException('Не удалось открыть ZIP-архив. Проверьте файл и попробуйте снова.');
        }

        $extracted = $zip->extractTo($destination);
        $zip->close();

        if (! $extracted) {
            throw new RuntimeException('Не удалось распаковать ZIP-архив. Проверьте файл и попробуйте снова.');
        }
    }

    /**
     * @return array{0: array<string, int>, 1: array<int, array<int, mixed>>}
     */
    private function readSpreadsheet(string $excelPath): array
    {
        $spreadsheet = IOFactory::load($excelPath);
        $worksheet = $spreadsheet->getSheet(0);
        $highestRow = max($worksheet->getHighestDataRow(), 1);
        $highestColumn = $worksheet->getHighestDataColumn();

        $rows = $worksheet->rangeToArray(
            'A1:'.$highestColumn.$highestRow,
            null,
            true,
            false,
            false,
        );

        if ($rows === []) {
            throw new RuntimeException('Excel-файл внутри архива пустой.');
        }

        $headerMap = $this->buildHeaderMap($rows[0] ?? []);

        return [$headerMap, $rows];
    }

    /**
     * @param array<int, mixed> $headerRow
     * @return array<string, int>
     */
    private function buildHeaderMap(array $headerRow): array
    {
        $map = [];

        foreach ($headerRow as $index => $value) {
            $heading = $this->normalizeHeading($value);

            if ($heading === '') {
                continue;
            }

            $map[$heading] = $index;
        }

        $missingHeadings = [];

        foreach (self::REQUIRED_HEADINGS as $heading) {
            if (! array_key_exists($heading, $map)) {
                $missingHeadings[] = $heading;
            }
        }

        if ($missingHeadings !== []) {
            throw new RuntimeException(
                'В Excel отсутствуют обязательные колонки: '.implode(', ', $missingHeadings).'.'
            );
        }

        return $map;
    }

    /**
     * @param array<int, mixed> $row
     * @param array<string, int> $headerMap
     * @return array{
     *     validated: array<string, mixed>,
     *     errors: array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>
     * }
     */
    private function mapRow(array $row, array $headerMap, int $rowNumber): array
    {
        $errors = [];

        $status = $this->parseStatus($this->getCell($row, $headerMap, 'Статус'), $rowNumber, $errors);
        $action = $this->parseAction($this->getCell($row, $headerMap, 'Аукцион'), $rowNumber, $errors);
        $building = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Корпус'), 'Корпус', $rowNumber, $errors, 1);
        $entrance = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Подъезд'), 'Подъезд', $rowNumber, $errors, 1);
        $floor = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Этаж'), 'Этаж', $rowNumber, $errors, 1);
        $number = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Номер квартиры'), 'Номер квартиры', $rowNumber, $errors, 1);
        $rooms = $this->parseRequiredRooms($this->getCell($row, $headerMap, 'Комнат'), 'Комнат', $rowNumber, $errors);
        $square = $this->parseRequiredFloat($this->getCell($row, $headerMap, 'Общая площадь, м²'), 'Общая площадь, м²', $rowNumber, $errors, 0);
        $livingSquare = $this->parseRequiredFloat($this->getCell($row, $headerMap, 'Жилая площадь, м²'), 'Жилая площадь, м²', $rowNumber, $errors, 0);
        $ceilingHeight = $this->parseRequiredFloat($this->getCell($row, $headerMap, 'Высота потолков, м'), 'Высота потолков, м', $rowNumber, $errors, 0);
        $finishing = $this->parseRequiredString($this->getCell($row, $headerMap, 'Отделка'), 'Отделка', $rowNumber, $errors);
        $finishDate = $this->parseRequiredString($this->getCell($row, $headerMap, 'Дата окончания строительства'), 'Дата окончания строительства', $rowNumber, $errors);
        $priceM2 = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Цена за кв.м., ₽'), 'Цена за кв.м., ₽', $rowNumber, $errors, 0);
        $price = $this->parseRequiredInteger($this->getCell($row, $headerMap, 'Стоимость квартиры, ₽'), 'Стоимость квартиры, ₽', $rowNumber, $errors, 0);

        $actionPriceM2 = 0;

        if ($action === true) {
            $actionPriceM2 = $this->parseRequiredInteger(
                $this->getCell($row, $headerMap, 'Аукционная цена за кв.м., ₽'),
                'Аукционная цена за кв.м., ₽',
                $rowNumber,
                $errors,
                0,
            );
        }

        $roomsNumberTrue = null;

        if (array_key_exists(self::OPTIONAL_ROOMS_TRUE_HEADING, $headerMap)) {
            $roomsNumberTrue = $this->parseOptionalRooms(
                $this->getCell($row, $headerMap, self::OPTIONAL_ROOMS_TRUE_HEADING),
                self::OPTIONAL_ROOMS_TRUE_HEADING,
                $rowNumber,
                $errors,
            );
        }

        if ($errors !== []) {
            return [
                'validated' => [],
                'errors' => $errors,
            ];
        }

        $validated = [
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
        ];

        if ($roomsNumberTrue !== null) {
            $validated['rooms_number_true'] = $roomsNumberTrue;
        }

        return [
            'validated' => $validated,
            'errors' => [],
        ];
    }

    /**
     * @param array<int, mixed> $row
     * @param array<string, int> $headerMap
     */
    private function getCell(array $row, array $headerMap, string $heading): mixed
    {
        $index = $headerMap[$heading] ?? null;

        if ($index === null) {
            return null;
        }

        return $row[$index] ?? null;
    }

    private function findSingleExcelFile(string $rootPath): string
    {
        $files = collect(File::allFiles($rootPath))
            ->filter(function (SplFileInfo $file) {
                return in_array(strtolower($file->getExtension()), ['xlsx', 'xls'], true);
            })
            ->values();

        if ($files->count() === 0) {
            throw new RuntimeException('В архиве не найден Excel-файл.');
        }

        if ($files->count() > 1) {
            throw new RuntimeException('В архиве найдено несколько Excel-файлов. Оставьте только один.');
        }

        /** @var SplFileInfo $file */
        $file = $files->first();

        return $file->getPathname();
    }

    private function findSingleDirectoryByName(string $rootPath, string $directoryName): string
    {
        $found = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($rootPath, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $item) {
            if (! $item->isDir()) {
                continue;
            }

            if ($item->getFilename() === $directoryName) {
                $found[] = $item->getPathname();
            }
        }

        if ($found === []) {
            throw new RuntimeException("В архиве не найдена папка {$directoryName}.");
        }

        if (count($found) > 1) {
            throw new RuntimeException("В архиве найдено несколько папок {$directoryName}. Оставьте только одну.");
        }

        return $found[0];
    }

    /**
     * @return array<string, string>
     */
    private function buildImageMap(string $directory, string $suffix, string $folderLabel): array
    {
        $map = [];

        foreach (File::allFiles($directory) as $file) {
            $extension = strtolower($file->getExtension());

            if (! in_array($extension, ['svg', 'png'], true)) {
                continue;
            }

            $filenameWithoutExtension = $file->getFilenameWithoutExtension();

            if (! str_ends_with($filenameWithoutExtension, $suffix)) {
                throw new RuntimeException(
                    "Файл {$file->getFilename()} в папке {$folderLabel} имеет неверное имя. Ожидается формат slug{$suffix}.svg или slug{$suffix}.png."
                );
            }

            $slug = substr($filenameWithoutExtension, 0, -strlen($suffix));

            if ($slug === false || $slug === '') {
                throw new RuntimeException(
                    "Не удалось определить slug из файла {$file->getFilename()} в папке {$folderLabel}."
                );
            }

            if (isset($map[$slug])) {
                throw new RuntimeException(
                    "В папке {$folderLabel} найдено несколько файлов для slug {$slug}. Оставьте только один plan и один floor_position на квартиру."
                );
            }

            $map[$slug] = $file->getPathname();
        }

        ksort($map);

        return $map;
    }

    /**
     * @param array<int, mixed> $row
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
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseRequiredInteger(mixed $value, string $field, int $rowNumber, array &$errors, int $min = 0): ?int
    {
        $normalized = $this->normalizeNumeric($value);

        if ($normalized === '') {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Поле обязательно для заполнения.');
            return null;
        }

        if (! is_numeric($normalized)) {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Ожидается целое число.');
            return null;
        }

        $number = (float) $normalized;

        if (floor($number) !== $number) {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Ожидается целое число.');
            return null;
        }

        if ($number < $min) {
            $errors[] = $this->makeRowError($rowNumber, $field, "Значение не может быть меньше {$min}.");
            return null;
        }

        return (int) $number;
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseRequiredFloat(mixed $value, string $field, int $rowNumber, array &$errors, float $min = 0): ?float
    {
        $normalized = $this->normalizeNumeric($value);

        if ($normalized === '') {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Поле обязательно для заполнения.');
            return null;
        }

        if (! is_numeric($normalized)) {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Ожидается число.');
            return null;
        }

        $number = (float) $normalized;

        if ($number < $min) {
            $errors[] = $this->makeRowError($rowNumber, $field, "Значение не может быть меньше {$min}.");
            return null;
        }

        return $number;
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseRequiredString(mixed $value, string $field, int $rowNumber, array &$errors): ?string
    {
        $string = trim($this->stringValue($value));

        if ($string === '') {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Поле обязательно для заполнения.');
            return null;
        }

        return $string;
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseRequiredRooms(mixed $value, string $field, int $rowNumber, array &$errors): ?int
    {
        $rooms = $this->parseRequiredInteger($value, $field, $rowNumber, $errors, 0);

        if ($rooms === null) {
            return null;
        }

        if (! in_array($rooms, [0, 1, 2, 3, 4], true)) {
            $errors[] = $this->makeRowError($rowNumber, $field, 'Допустимые значения: 0, 1, 2, 3, 4.');
            return null;
        }

        return $rooms;
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseOptionalRooms(mixed $value, string $field, int $rowNumber, array &$errors): ?int
    {
        if (trim($this->stringValue($value)) === '') {
            return null;
        }

        return $this->parseRequiredRooms($value, $field, $rowNumber, $errors);
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseStatus(mixed $value, int $rowNumber, array &$errors): ?string
    {
        $normalized = mb_strtolower(trim($this->stringValue($value)));

        return match ($normalized) {
            'доступна' => 'available',
            'продана' => 'sold',
            'скрыта' => 'hidden',
            '' => $this->pushAndReturnNull($errors, $this->makeRowError($rowNumber, 'Статус', 'Поле обязательно для заполнения.')),
            default => $this->pushAndReturnNull($errors, $this->makeRowError($rowNumber, 'Статус', 'Допустимые значения: Доступна, Продана, Скрыта.')),
        };
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     */
    private function parseAction(mixed $value, int $rowNumber, array &$errors): ?bool
    {
        $normalized = mb_strtolower(trim($this->stringValue($value)));

        return match ($normalized) {
            'да' => true,
            'нет' => false,
            '' => $this->pushAndReturnNull($errors, $this->makeRowError($rowNumber, 'Аукцион', 'Поле обязательно для заполнения.')),
            default => $this->pushAndReturnNull($errors, $this->makeRowError($rowNumber, 'Аукцион', 'Допустимые значения: Да, Нет.')),
        };
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
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
    private function makeRowError(int $rowNumber, string $field, string $message): array
    {
        return [
            'rowNumber' => $rowNumber,
            'flatId' => null,
            'field' => $field,
            'message' => $message,
        ];
    }

    private function normalizeHeading(mixed $value): string
    {
        return preg_replace('/\s+/u', ' ', trim((string) ($value ?? ''))) ?? '';
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

    private function makePlanStoragePath(string $batchId, string $slug, string $sourcePath): string
    {
        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

        return "apartments/plans/{$batchId}/{$slug}_plan.{$extension}";
    }

    private function makeFloorPositionStoragePath(string $batchId, string $slug, string $sourcePath): string
    {
        $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION));

        return "apartments/floors/{$batchId}/{$slug}_floor_position.{$extension}";
    }

    private function storePublicFile(string $sourcePath, string $relativePath): void
    {
        $stream = fopen($sourcePath, 'rb');

        if ($stream === false) {
            throw new RuntimeException("Не удалось прочитать файл {$sourcePath}.");
        }

        try {
            $written = Storage::disk('public')->put($relativePath, $stream);
        } finally {
            fclose($stream);
        }

        if (! $written) {
            throw new RuntimeException("Не удалось сохранить файл {$relativePath} в public storage.");
        }
    }

    private function deletePublicFiles(array $paths): void
    {
        $paths = collect($paths)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($paths !== []) {
            Storage::disk('public')->delete($paths);
        }
    }

    private function normalizePublicStoragePath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        $normalized = ltrim($path, '/');

        if (str_starts_with($normalized, 'storage/')) {
            return substr($normalized, strlen('storage/'));
        }

        return $normalized;
    }

    private function makeFatalResult(string $fileName, bool $dryRun, string $message): array
    {
        return $this->makeResult(
            fileName: $fileName,
            dryRun: $dryRun,
            fatalError: $message,
            processedRows: 0,
            emptyRows: 0,
            validRows: 0,
            updatedRows: 0,
            errorRows: 1,
            errors: [$this->makeRowError(0, 'Архив', $message)],
            matchedPlanFiles: 0,
            missingPlanFiles: 0,
            matchedFloorPositionFiles: 0,
            missingFloorPositionFiles: 0,
            unusedPlanFiles: 0,
            unusedFloorPositionFiles: 0,
        );
    }

    /**
     * @param array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}> $errors
     * @return array{
     *     mode:string,
     *     isDryRun:bool,
     *     fileName:string,
     *     fatalError:string|null,
     *     processedRows:int,
     *     emptyRows:int,
     *     validRows:int,
     *     updatedRows:int,
     *     skippedRows:int,
     *     errorRows:int,
     *     errors:array<int, array{rowNumber:int, flatId:int|null, field:string, message:string}>,
     *     matchedPlanFiles:int,
     *     missingPlanFiles:int,
     *     matchedFloorPositionFiles:int,
     *     missingFloorPositionFiles:int,
     *     unusedPlanFiles:int,
     *     unusedFloorPositionFiles:int
     * }
     */
    private function makeResult(
        string $fileName,
        bool $dryRun,
        ?string $fatalError,
        int $processedRows,
        int $emptyRows,
        int $validRows,
        int $updatedRows,
        int $errorRows,
        array $errors,
        int $matchedPlanFiles,
        int $missingPlanFiles,
        int $matchedFloorPositionFiles,
        int $missingFloorPositionFiles,
        int $unusedPlanFiles,
        int $unusedFloorPositionFiles,
    ): array {
        return [
            'mode' => self::MODE,
            'isDryRun' => $dryRun,
            'fileName' => $fileName,
            'fatalError' => $fatalError,
            'processedRows' => $processedRows,
            'emptyRows' => $emptyRows,
            'validRows' => $validRows,
            'updatedRows' => $updatedRows,
            'skippedRows' => 0,
            'errorRows' => $errorRows,
            'errors' => $errors,
            'matchedPlanFiles' => $matchedPlanFiles,
            'missingPlanFiles' => $missingPlanFiles,
            'matchedFloorPositionFiles' => $matchedFloorPositionFiles,
            'missingFloorPositionFiles' => $missingFloorPositionFiles,
            'unusedPlanFiles' => $unusedPlanFiles,
            'unusedFloorPositionFiles' => $unusedFloorPositionFiles,
        ];
    }
}