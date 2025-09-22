import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Bot, MessageSquare, Users } from 'lucide-react';

interface StatsWidgetProps {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    aiMessages: number;
}

export function StatsWidget({ totalSessions, activeSessions, totalMessages, aiMessages }: StatsWidgetProps) {
    const stats = [
        {
            title: 'Total Chat Sessions',
            value: totalSessions,
            icon: MessageSquare,
            description: 'Semua sesi chat Anda',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950',
        },
        {
            title: 'Sesi Aktif',
            value: activeSessions,
            icon: Activity,
            description: 'Aktif dalam 7 hari terakhir',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950',
        },
        {
            title: 'Total Pesan',
            value: totalMessages,
            icon: Users,
            description: 'Semua pesan dalam chat',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950',
        },
        {
            title: 'Respons AI',
            value: aiMessages,
            icon: Bot,
            description: 'Pesan yang dihasilkan AI',
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="transition-shadow hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
