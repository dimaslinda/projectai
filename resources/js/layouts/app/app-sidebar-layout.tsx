import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import InstallPromptBanner from '@/components/pwa/InstallPromptBanner';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    hideChangelogBanner?: boolean;
}

export default function AppSidebarLayout({ children, breadcrumbs = [], hideChangelogBanner = false }: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} hideChangelogBanner={hideChangelogBanner} />
                <InstallPromptBanner />
                {children}
            </AppContent>
        </AppShell>
    );
}
