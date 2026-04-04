import FlatFormDialog from '@/pages/Admin/Flats/components/flat-form-dialog';
import type { Flat } from '@/pages/Admin/Flats/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flat: Flat;
};

export default function EditFlatDialog({ open, onOpenChange, flat }: Props) {
    return (
        <FlatFormDialog
            mode="edit"
            open={open}
            onOpenChange={onOpenChange}
            flat={flat}
        />
    );
}