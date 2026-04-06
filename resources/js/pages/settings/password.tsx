import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { type FormEventHandler, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Админ-панель', href: '/admin' },
    { title: 'Настройки', href: '/admin/settings/profile' },
    { title: 'Пароль', href: '/admin/settings/password' },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement | null>(null);
    const currentPasswordInput = useRef<HTMLInputElement | null>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('admin.settings.password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <>
            <Head title="Пароль" />

            <AdminLayout title="Смена пароля" description="Обновление пароля текущего пользователя." breadcrumbs={breadcrumbs}>
                <SettingsLayout>
                    <section className="bg-background rounded-xl border p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">Пароль</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Используйте длинный и безопасный пароль.</p>
                        </div>

                        <form onSubmit={updatePassword} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">Текущий пароль</Label>

                                <Input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Введите текущий пароль"
                                />

                                <InputError className="mt-1" message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Новый пароль</Label>

                                <Input
                                    id="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Введите новый пароль"
                                />

                                <InputError className="mt-1" message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Подтверждение пароля</Label>

                                <Input
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Повторите новый пароль"
                                />

                                <InputError className="mt-1" message={errors.password_confirmation} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button disabled={processing}>Сохранить пароль</Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-sm text-neutral-600">Сохранено</p>
                                </Transition>
                            </div>
                        </form>
                    </section>
                </SettingsLayout>
            </AdminLayout>
        </>
    );
}
