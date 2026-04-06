import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Админ-панель', href: '/admin' },
    { title: 'Настройки', href: '/admin/settings/profile' },
    { title: 'Профиль', href: '/admin/settings/profile' },
];

type ProfilePageProps = SharedData & {
    status?: string;
};

export default function Profile() {
    const { auth } = usePage<ProfilePageProps>().props;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: auth.user.name,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('admin.settings.profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Профиль" />

            <AdminLayout title="Настройки профиля" description="Изменение имени текущего пользователя." breadcrumbs={breadcrumbs}>
                <SettingsLayout>
                    <section className="bg-background rounded-xl border p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold">Профиль</h2>
                            <p className="text-muted-foreground mt-1 text-sm">Обновите отображаемое имя вашего аккаунта.</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Имя</Label>

                                <Input
                                    id="name"
                                    className="max-w-xl"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Введите имя"
                                />

                                <InputError className="mt-1" message={errors.name} />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button disabled={processing}>Сохранить</Button>

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
