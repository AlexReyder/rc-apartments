<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class Flat extends Model
{
    protected $connection = 'mysql';
    protected $table = 'flats';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'id' => 'integer',
        'building' => 'integer',
        'floor' => 'integer',
        'number' => 'integer',
        'rooms_number' => 'integer',
        'square' => 'float',
        'living_square' => 'float',
        'ceiling_height' => 'float',
        'price' => 'integer',
        'price_m2' => 'integer',
        'sold' => 'integer',
        'entrance_number' => 'integer',
    ];

    public function getSlugAttribute(): string
    {
        return self::makeSlug(
            (int) $this->building,
            (int) $this->floor,
            (int) $this->number,
        );
    }

    public static function makeSlug(int $building, int $floor, int $number): string
    {
        return sprintf('b%d-f%d-a%d', $building, $floor, $number);
    }

    public static function parseSlug(string $slug): array
    {
        if (! preg_match('/^b(?P<building>\d+)-f(?P<floor>\d+)-a(?P<number>\d+)$/', $slug, $matches)) {
            throw new InvalidArgumentException('Invalid flat slug.');
        }

        return [
            'building' => (int) $matches['building'],
            'floor' => (int) $matches['floor'],
            'number' => (int) $matches['number'],
        ];
    }

    public function scopeApplySearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        if (ctype_digit($search) && strlen($search) >= 4) {
            $building = (int) substr($search, 0, 1);
            $floor = (int) substr($search, 1, -2);
            $number = (int) substr($search, -2);

            return $query
                ->where('building', $building)
                ->where('floor', $floor)
                ->where('number', $number);
        }

        return $query->where(function (Builder $subQuery) use ($search) {
            $subQuery
                ->where('title', 'like', '%'.$search.'%')
                ->orWhere('description', 'like', '%'.$search.'%')
                ->orWhere('finish_date', 'like', '%'.$search.'%')
                ->orWhere('finishing', 'like', '%'.$search.'%')
                ->orWhere('floor_position', 'like', '%'.$search.'%');

            if (ctype_digit($search)) {
                $numericSearch = (int) $search;

                $subQuery
                    ->orWhere('id', $numericSearch)
                    ->orWhere('building', $numericSearch)
                    ->orWhere('number', $numericSearch)
                    ->orWhere('floor', $numericSearch)
                    ->orWhere('rooms_number', $numericSearch)
                    ->orWhere('price', $numericSearch);
            }
        });
    }

    public function scopeApplyAttributeFilters(
        Builder $query,
        array $buildings = [],
        array $floors = [],
        array $rooms = [],
    ): Builder {
        if ($buildings !== []) {
            $query->whereIn('building', $buildings);
        }

        if ($floors !== []) {
            $query->whereIn('floor', $floors);
        }

        if ($rooms !== []) {
            $query->whereIn('rooms_number', $rooms);
        }

        return $query;
    }
}