import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    hideChangelogBanner?: boolean;
}

export default ({ children, breadcrumbs, hideChangelogBanner, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} hideChangelogBanner={hideChangelogBanner} {...props}>
        {children}
    </AppLayoutTemplate>
);
