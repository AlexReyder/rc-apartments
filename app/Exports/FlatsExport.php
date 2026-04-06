<?php

namespace App\Exports;

use App\Models\Flat;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FlatsExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    WithEvents,
    WithColumnFormatting,
    WithColumnWidths,
    ShouldAutoSize
{
    public function collection()
    {
        return Flat::query()
            ->orderBy('building')
            ->orderBy('entrance_number')
            ->orderBy('floor')
            ->orderBy('number')
            ->orderBy('id')
            ->get();
    }

    public function headings(): array
    {
        return self::exportHeadings();
    }

    public static function exportHeadings(): array
    {
        return [
            'ID',
            'Статус',
            'Аукцион',
            'Корпус',
            'Подъезд',
            'Этаж',
            'Номер квартиры',
            'Комнат',
            'Фактическая комнатность',
            'Общая площадь, м²',
            'Жилая площадь, м²',
            'Высота потолков, м',
            'Отделка',
            'Дата окончания строительства',
            'Цена за кв.м., ₽',
            'Стоимость квартиры, ₽',
            'Аукционная цена за кв.м., ₽',
            'Отображаемая цена за кв.м., ₽',
            'Отображаемая стоимость квартиры, ₽',
            'План квартиры',
            'План этажа',
        ];
    }

    public function map($flat): array
    {
        $action = (int) ($flat->action ?? 0);
        $priceM2 = $flat->price_m2 !== null ? (int) $flat->price_m2 : null;
        $actionPriceM2 = $flat->action_price_m2 !== null ? (int) $flat->action_price_m2 : null;
        $square = (float) $flat->square;

        $displayPriceM2 = $action === 1
            ? $actionPriceM2
            : $priceM2;

        $displayPrice = $action === 1
            ? (int) round(($actionPriceM2 ?? 0) * $square)
            : (int) $flat->price;

        return [
            (int) $flat->id,
            $this->resolveStatusLabel((int) $flat->sold),
            $action === 1 ? 'Да' : 'Нет',
            (int) $flat->building,
            $flat->entrance_number !== null ? (int) $flat->entrance_number : null,
            (int) $flat->floor,
            (int) $flat->number,
            (string) ((int) $flat->rooms_number),
             (string) ((int)($flat->rooms_number_true ?? $flat->rooms_number)),
            round((float) $flat->square, 2),
            $flat->living_square !== null ? round((float) $flat->living_square, 2) : null,
            $flat->ceiling_height !== null ? round((float) $flat->ceiling_height, 2) : null,
            $flat->finishing,
            $flat->finish_date ? (string) $flat->finish_date : null,
            $priceM2,
            (int) $flat->price,
            $actionPriceM2,
            $displayPriceM2,
            $displayPrice,
            $flat->plan,
            $flat->floor_position,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => [
                        'rgb' => 'EDEDED',
                    ],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'wrapText' => true,
                ],
            ],
        ];
    }

  public function columnFormats(): array
{
    return [
        'A' => NumberFormat::FORMAT_NUMBER,
        'D' => NumberFormat::FORMAT_NUMBER,
        'E' => NumberFormat::FORMAT_NUMBER,
        'F' => NumberFormat::FORMAT_NUMBER,
        'G' => NumberFormat::FORMAT_NUMBER,
        'H' => NumberFormat::FORMAT_NUMBER,
        'I' => NumberFormat::FORMAT_NUMBER,      // фактическая комнатность
        'J' => NumberFormat::FORMAT_NUMBER_00,   // общая площадь
        'K' => NumberFormat::FORMAT_NUMBER_00,   // жилая площадь
        'L' => NumberFormat::FORMAT_NUMBER_00,   // высота потолков
        'O' => '#,##0',                          // цена за кв.м.
        'P' => '#,##0',                          // стоимость квартиры
        'Q' => '#,##0',                          // аукционная цена за кв.м.
        'R' => '#,##0',                          // отображаемая цена за кв.м.
        'S' => '#,##0',                          // отображаемая стоимость квартиры
    ];
}

    public function columnWidths(): array
    {
        return [
            'A' => 10,
            'B' => 16,
            'C' => 12,
            'D' => 10,
            'E' => 10,
            'F' => 10,
            'G' => 16,
            'H' => 10,
            'I' => 16,
            'J' => 16,
            'K' => 16,
            'L' => 20,
            'M' => 18,
            'N' => 18,
            'O' => 18,
            'P' => 22,
            'Q' => 22,
            'R' => 24,
            'S' => 28,
            'T' => 28,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();

                $sheet->freezePane('A2');
                $sheet->setAutoFilter('A1:T1');
                $sheet->getRowDimension(1)->setRowHeight(28);

                $sheet->getStyle('A:T')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                $sheet->getStyle('A1:T1')->getAlignment()->setWrapText(true);
                $sheet->getStyle('N:R')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle('I:K')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                if ($highestRow >= 2) {
                    $statusValidation = new DataValidation();
                    $statusValidation->setType(DataValidation::TYPE_LIST);
                    $statusValidation->setErrorStyle(DataValidation::STYLE_STOP);
                    $statusValidation->setAllowBlank(true);
                    $statusValidation->setShowInputMessage(true);
                    $statusValidation->setShowErrorMessage(true);
                    $statusValidation->setShowDropDown(true);
                    $statusValidation->setFormula1('"Доступна,Продана,Скрыта"');
                    $statusValidation->setPromptTitle('Статус');
                    $statusValidation->setPrompt('Выберите статус квартиры.');
                    $statusValidation->setErrorTitle('Некорректный статус');
                    $statusValidation->setError('Допустимые значения: Доступна, Продана, Скрыта.');

                    $auctionValidation = new DataValidation();
                    $auctionValidation->setType(DataValidation::TYPE_LIST);
                    $auctionValidation->setErrorStyle(DataValidation::STYLE_STOP);
                    $auctionValidation->setAllowBlank(true);
                    $auctionValidation->setShowInputMessage(true);
                    $auctionValidation->setShowErrorMessage(true);
                    $auctionValidation->setShowDropDown(true);
                    $auctionValidation->setFormula1('"Да,Нет"');
                    $auctionValidation->setPromptTitle('Аукцион');
                    $auctionValidation->setPrompt('Выберите Да или Нет.');
                    $auctionValidation->setErrorTitle('Некорректное значение');
                    $auctionValidation->setError('Допустимые значения: Да, Нет.');

                    for ($row = 2; $row <= $highestRow; $row++) {
                        $sheet->getCell("B{$row}")->setDataValidation(clone $statusValidation);
                        $sheet->getCell("C{$row}")->setDataValidation(clone $auctionValidation);
                    }
                }
            },
        ];
    }

    private function resolveStatusLabel(int $sold): string
    {
        return match ($sold) {
            1 => 'Продана',
            2 => 'Скрыта',
            default => 'Доступна',
        };
    }
}