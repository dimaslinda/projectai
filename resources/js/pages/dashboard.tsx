import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import dashboardRoutes from '@/routes/dashboard';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { StatsWidget } from '@/components/dashboard/stats-widget';
import { RecentActivityWidget } from '@/components/dashboard/recent-activity-widget';
import { PersonaDistributionWidget } from '@/components/dashboard/persona-distribution-widget';
import { QuickActionsWidget } from '@/components/dashboard/quick-actions-widget';
import { AIUsageWidget } from '@/components/dashboard/ai-usage-widget';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardStats {
    totalSessions: number;
    activeSessions: number;
    sessionsByPersona: Record<string, number>;
    recentSessions: Array<{
        id: number;
        title: string;
        persona: string | null;
        chat_type: string;
        last_activity_at: string;
        latest_message?: {
            message: string;
            is_ai: boolean;
        };
    }>;
    totalMessages: number;
    aiMessages: number;
}

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(dashboardRoutes.stats().url);
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats');
                }
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Memuat data dashboard...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (error || !stats) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-destructive mb-2">
                                    Error memuat data
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {error || 'Terjadi kesalahan saat memuat data dashboard'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Stats Overview */}
                <StatsWidget
                    totalSessions={stats.totalSessions}
                    activeSessions={stats.activeSessions}
                    totalMessages={stats.totalMessages}
                    aiMessages={stats.aiMessages}
                />

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Activity - Full width on mobile, half on desktop */}
                    <div className="lg:col-span-1">
                        <RecentActivityWidget recentSessions={stats.recentSessions} />
                    </div>
                    
                    {/* Persona Distribution */}
                    <div className="lg:col-span-1">
                        <PersonaDistributionWidget sessionsByPersona={stats.sessionsByPersona} />
                    </div>
                </div>

                {/* Bottom Row - Quick Actions and AI Usage */}
                <div className="grid gap-6 md:grid-cols-2">
                    <QuickActionsWidget userRole={auth.user.role || 'user'} />
                    <AIUsageWidget 
                        totalMessages={stats.totalMessages} 
                        aiMessages={stats.aiMessages} 
                    />
                </div>
            </div>
        </AppLayout>
    );
}
