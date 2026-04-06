<?php

namespace App\Services\Admin\Flats;

class FlatPayloadBuilder
{
    public function build(
        array $validated,
        ?string $apartmentPlanPath,
        ?string $floorPlanPath,
        bool $isUpdate = false,
    ): array {
        $building = (int) $validated['building'];
        $floor = (int) $validated['floor'];
        $entrance = (int) $validated['entrance_number'];
        $number = (int) $validated['number'];
        $rooms = (int) $validated['rooms_number'];
        $square = round((float) $validated['square'], 2);
        $livingSquare = round((float) $validated['living_square'], 2);
        $ceilingHeight = round((float) $validated['ceiling_height'], 2);
        $priceM2 = (int) $validated['price_m2'];
        $price = (int) $validated['price'];
        $actionEnabled = filter_var($validated['action'], FILTER_VALIDATE_BOOLEAN) === true;
        $actionPriceM2 = $actionEnabled ? (int) $validated['action_price_m2'] : 0;
        $finishDate = (string) $validated['finish_date'];
        $finishing = trim((string) $validated['finishing']);

        $soldStatus = match ((string) $validated['status']) {
            'available' => 0,
            'sold' => 1,
            'hidden' => 2,
            default => 0,
        };

        $payload = [
            'rooms_number' => $rooms,
            'rooms_number_true' => $rooms,
            'floor' => $floor,
            'square' => $square,
            'updated_at' => now(),
            'entrance_number' => $entrance,
            'living_square' => $livingSquare,
            'ceiling_height' => $ceilingHeight,
            'plan' => $apartmentPlanPath,
            'sold' => $soldStatus,
            'building' => $building,
            'number' => $number,
            'price' => $price,
            'price_m2' => $priceM2,
            'action' => $actionEnabled ? 1 : 0,
            'action_price_m2' => $actionPriceM2,
            'floor_position' => $floorPlanPath,
            'finish_date' => $finishDate,
            'finishing' => $finishing,
            'title' => $this->makeTitle($building, $number),
            'description' => $this->makeDescription(
                $building,
                $number,
                $entrance,
                $floor,
                $rooms,
                $square,
            ),
        ];

        if (! $isUpdate) {
            $payload['created_at'] = now();
        }

        return $payload;
    }

    private function makeTitle(int $building, int $number): string
    {
        return sprintf(
            'Квартира в ЖК «Орловский Бульвар», Гатчина. Корпус: %d. Номер: %d',
            $building,
            $number,
        );
    }

    private function makeDescription(
        int $building,
        int $number,
        int $entrance,
        int $floor,
        int $rooms,
        float $square,
    ): string {
        return sprintf(
            'Квартира в ЖК «Орловский Бульвар», Гатчина. Корпус: %d. Номер: %d. Подъезд: %d. Этаж: %d. Количество комнат: %d. Площадь: %.2f. Подробности на сайте',
            $building,
            $number,
            $entrance,
            $floor,
            $rooms,
            $square,
        );
    }
}