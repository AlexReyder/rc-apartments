export const perPageOptions = [10, 20, 30, 50, 100] as const;

export const priceFormatter = new Intl.NumberFormat('ru-RU');

export const squareFormatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

export function getRoomLabel(value: number) {
    if (value === 0) {
        return 'Студия';
    }

    return `${value}-комнатная`;
}

export function getShortRoomLabel(value: number) {
    if (value === 0) {
        return 'Студия';
    }

    return `${value} комн.`;
}

export function getPricePerSquare(price: number, square: number) {
    if (square <= 0) {
        return null;
    }

    return Math.round(price / square);
}