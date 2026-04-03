import { ImageOff } from 'lucide-react';
import { useState } from 'react';

type Props = {
    src: string | null;
    alt: string;
};

export default function FlatPlanPreview({ src, alt }: Props) {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
        return (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border bg-muted/30 text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-sm">
                    <ImageOff className="h-5 w-5" />
                    <span>Нет плана</span>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <img
                src={src}
                alt={alt}
                className="aspect-[4/3] h-full w-full object-contain"
                loading="lazy"
                onError={() => setHasError(true)}
            />
        </div>
    );
}