import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Download, Info, Upload } from 'lucide-react';

type IntegrationItem = {
    key: string;
    name: string;
    description: string;
    logo_text: string;
    download_enabled: boolean;
    publish_enabled: boolean;
};

type Props = {
    integrations: IntegrationItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Админ-панель',
        href: '/admin',
    },
    {
        title: 'Интеграции',
        href: '/admin/integration',
    },
];

export default function AdminIntegrationIndex({ integrations }: Props) {
    return (
        <>
            <Head title="Интеграции" />

            <AdminLayout title="Интеграции" description="Выгрузка квартир в XML-форматы внешних площадок." breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Интерфейс подготовлен</AlertTitle>
                        <AlertDescription>
                            Кнопки скачивания и публикации XML пока отображаются как UI-заготовка. Логику генерации и обновления файла добавим
                            следующим шагом.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        {integrations.map((integration) => (
                            <Card key={integration.key}>
                                <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-muted flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold">
                                            {integration.logo_text}
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-base font-semibold">{integration.name}</h3>
                                            <p className="text-muted-foreground text-sm">{integration.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button type="button" variant="outline" disabled={!integration.download_enabled}>
                                            <Download className="h-4 w-4" />
                                            Скачать XML
                                        </Button>

                                        <Button type="button" disabled={!integration.publish_enabled}>
                                            <Upload className="h-4 w-4" />
                                            Обновить XML на сайте
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </AdminLayout>
        </>
    );
}
