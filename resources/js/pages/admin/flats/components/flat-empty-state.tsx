export default function FlatsEmptyState() {
    return (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
            <h2 className="text-base font-medium">Квартиры не найдены</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Попробуйте изменить параметры поиска.
            </p>
        </div>
    );
}