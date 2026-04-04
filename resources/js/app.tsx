import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';

import InertiaFlashSonner from './components/inertia-flash-sonner';
import { Toaster } from './components/ui/sonner';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );

        const OriginalPage = page.default as ComponentType<Record<string, unknown>>;

        return {
            ...page,
            default: (props: Record<string, unknown>) => (
                <Fragment>
                    <InertiaFlashSonner />
                    <OriginalPage {...props} />
                </Fragment>
            ),
        };
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <Fragment>
                <Toaster />
                <App {...props} />
            </Fragment>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();