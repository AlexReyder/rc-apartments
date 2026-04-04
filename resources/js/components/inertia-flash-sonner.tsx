import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export default function InertiaFlashSonner() {
    const page = usePage<FlashProps>();
    const success = page.props.flash?.success ?? null;
    const error = page.props.flash?.error ?? null;

    useEffect(() => {
        if (success) {
            toast.success(success);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    return null;
}