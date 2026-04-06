import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { MoreHorizontal, Plus, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: 'superadmin' | 'admin';
    created_at: string | null;
    can_delete: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type UsersPagination = {
    data: AdminUser[];
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    per_page: number;
    to: number | null;
    total: number;
};

type Props = {
    users: UsersPagination;
};

type CreateUserForm = {
    name: string;
    email: string;
    role: 'superadmin' | 'admin';
    password: string;
    password_confirmation: string;
};

type PageProps = SharedData & {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Админ-панель', href: '/admin' },
    { title: 'Пользователи', href: '/admin/users' },
];

const roleLabels: Record<'superadmin' | 'admin', string> = {
    superadmin: 'Superadmin',
    admin: 'Admin',
};

const roleBadgeClassNames: Record<'superadmin' | 'admin', string> = {
    superadmin: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
    admin: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
};

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

export default function AdminUsersIndex({ users }: Props) {
    const { auth, flash } = usePage<PageProps>().props;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const canCreateSuperadmin = auth.user.role === 'superadmin';

    const initialFormData = useMemo<CreateUserForm>(
        () => ({
            name: '',
            email: '',
            role: 'admin',
            password: '',
            password_confirmation: '',
        }),
        [],
    );

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<CreateUserForm>(initialFormData);

    const closeCreateDialog = () => {
        setIsCreateDialogOpen(false);
        clearErrors();
        reset();
        setData(initialFormData);
    };

    const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('admin.users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                closeCreateDialog();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!userToDelete) {
            return;
        }

        setIsDeleting(true);

        router.delete(route('admin.users.destroy', userToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setUserToDelete(null);
            },
        });
    };

    return (
        <>
            <Head title="Пользователи" />

            <AdminLayout title="Пользователи" description="Создание и удаление администраторов панели." breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    <div className="bg-background flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div></div>

                        <button
                            type="button"
                            onClick={() => setIsCreateDialogOpen(true)}
                            className="bg-foreground text-background inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                        >
                            <Plus className="h-4 w-4" />
                            Добавить пользователя
                        </button>
                    </div>

                    <div className="bg-background overflow-hidden rounded-xl border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Роль</TableHead>
                                    <TableHead>Дата создания</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="py-10 text-center">
                                            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                                                <div className="bg-muted/40 flex h-12 w-12 items-center justify-center rounded-full border">
                                                    <UserPlus className="text-muted-foreground h-5 w-5" />
                                                </div>
                                                <div className="text-base font-medium">Пользователи не найдены</div>
                                                <div className="text-muted-foreground text-sm">
                                                    Пока в списке нет пользователей, доступных для отображения.
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${roleBadgeClassNames[user.role]}`}
                                                >
                                                    {roleLabels[user.role]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="hover:bg-muted inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
                                                            aria-label="Открыть действия"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>

                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem
                                                            disabled={!user.can_delete}
                                                            onClick={() => setUserToDelete(user)}
                                                            className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Удалить пользователя
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {users.total > 0 ? (
                            <div className="flex flex-col gap-4 border-t px-4 py-4 md:flex-row md:items-center md:justify-between">
                                <div className="text-muted-foreground text-sm">
                                    Показано {users.from ?? 0}–{users.to ?? 0} из {users.total}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {users.links.map((link, index) =>
                                        link.url ? (
                                            <Link
                                                key={`${link.label}-${index}`}
                                                href={link.url}
                                                preserveScroll
                                                preserveState
                                                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                                    link.active ? 'bg-foreground text-background' : 'hover:bg-muted'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={`${link.label}-${index}`}
                                                className="text-muted-foreground rounded-md border px-3 py-1.5 text-sm opacity-60"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </AdminLayout>

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateDialog();
                        return;
                    }

                    setIsCreateDialogOpen(true);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Добавить пользователя</DialogTitle>
                        <DialogDescription>Создание нового администратора панели.</DialogDescription>
                    </DialogHeader>

                    <form className="space-y-4" onSubmit={handleCreateSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="user-name">Имя</Label>
                            <Input
                                id="user-name"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                placeholder="Введите имя"
                                autoComplete="name"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                placeholder="email@example.com"
                                autoComplete="email"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-role">Роль</Label>
                            <select
                                id="user-role"
                                value={data.role}
                                onChange={(event) => setData('role', event.target.value as 'superadmin' | 'admin')}
                                className="bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                            >
                                {canCreateSuperadmin ? <option value="superadmin">Superadmin</option> : null}
                                <option value="admin">Admin</option>
                            </select>
                            <InputError message={errors.role} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-password">Пароль</Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                placeholder="Минимум 8 символов"
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-password-confirmation">Подтверждение пароля</Label>
                            <Input
                                id="user-password-confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                placeholder="Повторите пароль"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                onClick={closeCreateDialog}
                                className="hover:bg-muted inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Отмена
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-foreground text-background inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Создание...' : 'Создать пользователя'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={userToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setUserToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {userToDelete
                                ? `Пользователь "${userToDelete.name}" будет удалён без возможности восстановления.`
                                : 'Пользователь будет удалён без возможности восстановления.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? 'Удаление...' : 'Удалить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
