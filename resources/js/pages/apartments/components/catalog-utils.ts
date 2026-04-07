export function formatPrice(value: number): string {
    return `${new Intl.NumberFormat('ru-RU').format(value).replace(/\u00A0/g, ' ')} ₽`;
}

export function formatArea(value: number): string {
    const hasFraction = Math.abs(value % 1) > 0.001;

    return `${new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: hasFraction ? 1 : 0,
        maximumFractionDigits: 1,
    })
        .format(value)
        .replace(/\u00A0/g, ' ')} м²`;
}

export function getRoomsLabel(rooms: number): string {
    if (rooms === 0) {
        return 'Студия';
    }

    return `${rooms}-комнатная`;
}

export function getRoomsChipLabel(rooms: number): string {
    if (rooms === 0) {
        return 'Ст.';
    }

    return String(rooms);
}
