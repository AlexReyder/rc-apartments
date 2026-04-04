import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
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

    const lastSuccessRef = useRef<string | null>(null);
    const lastErrorRef = useRef<string | null>(null);

    useEffect(() => {
        if (success && success !== lastSuccessRef.current) {
            lastSuccessRef.current = success;
            toast.success(success);
        }
    }, [success]);

    useEffect(() => {
        if (error && error !== lastErrorRef.current) {
            lastErrorRef.current = error;
            toast.error(error);
        }
    }, [error]);

    return null;
}