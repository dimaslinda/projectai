import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Bot, Code, FileText, Plus, Shield, Zap } from 'lucide-react';

interface QuickActionsWidgetProps {
    userRole: string;
}

export function QuickActionsWidget({ userRole }: QuickActionsWidgetProps) {
    // Define all available personas
    const allPersonas = {
        global: {
            title: 'Chat Global',
            description: 'Mulai percakapan umum dengan AI',
            href: '/chat?type=global',
            icon: Bot,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            hoverColor: 'hover:bg-gray-200 dark:hover:bg-gray-700',
        },
        engineer: {
            title: 'Engineer Chat',
            description: 'Chat dengan persona engineer',
            href: '/chat?persona=engineer',
            icon: Code,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-800',
            hoverColor: 'hover:bg-blue-200 dark:hover:bg-blue-700',
        },
        drafter: {
            title: 'Drafter Chat',
            description: 'Chat dengan persona drafter',
            href: '/chat?persona=drafter',
            icon: FileText,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-800',
            hoverColor: 'hover:bg-green-200 dark:hover:bg-green-700',
        },
        esr: {
            title: 'ESR Chat',
            description: 'Chat dengan persona ESR',
            href: '/chat?persona=esr',
            icon: Shield,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-800',
            hoverColor: 'hover:bg-purple-200 dark:hover:bg-purple-700',
        },
    };

    // Filter personas based on user role
    const getAvailablePersonas = () => {
        const personas = [allPersonas.global]; // Global chat always available

        // Add user's role-specific persona
        if (userRole && allPersonas[userRole as keyof typeof allPersonas]) {
            personas.push(allPersonas[userRole as keyof typeof allPersonas]);
        }

        // For superadmin, show all personas
        if (userRole === 'superadmin') {
            return Object.values(allPersonas);
        }

        return personas;
    };

    const quickActions = getAvailablePersonas();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Mulai chat baru dengan cepat</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={action.title}
                                variant="outline"
                                className={`h-auto justify-start p-4 ${action.hoverColor} transition-colors`}
                                asChild
                            >
                                <Link href={action.href}>
                                    <div className="flex w-full items-start gap-3">
                                        <div className={`rounded-lg p-2 ${action.bgColor} flex-shrink-0`}>
                                            <Icon className={`h-5 w-5 ${action.color}`} />
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <div className="mb-1 text-sm font-medium">{action.title}</div>
                                            <div className="line-clamp-2 text-xs text-muted-foreground">{action.description}</div>
                                        </div>
                                    </div>
                                </Link>
                            </Button>
                        );
                    })}
                </div>

                <div className="mt-4 border-t border-border/50 pt-4">
                    <Button className="w-full" asChild>
                        <Link href="/chat">
                            <Plus className="mr-2 h-4 w-4" />
                            Lihat Semua Chat Sessions
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
