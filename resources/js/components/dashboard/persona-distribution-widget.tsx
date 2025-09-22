import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Users, Bot, Code, FileText, Shield } from 'lucide-react';

interface PersonaDistributionWidgetProps {
    sessionsByPersona: Record<string, number>;
}

export function PersonaDistributionWidget({ sessionsByPersona }: PersonaDistributionWidgetProps) {
    const total = Object.values(sessionsByPersona).reduce((sum, count) => sum + count, 0);
    
    const personaConfig = {
        global: {
            label: 'Global Chat',
            icon: Bot,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            progressColor: 'bg-gray-500',
        },
        engineer: {
            label: 'Engineer',
            icon: Code,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-800',
            progressColor: 'bg-blue-500',
        },
        drafter: {
            label: 'Drafter',
            icon: FileText,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-800',
            progressColor: 'bg-green-500',
        },
        esr: {
            label: 'ESR',
            icon: Shield,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-100 dark:bg-purple-800',
            progressColor: 'bg-purple-500',
        },
    };

    const sortedPersonas = Object.entries(sessionsByPersona)
        .sort(([, a], [, b]) => b - a)
        .map(([persona, count]) => ({
            persona,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            config: personaConfig[persona as keyof typeof personaConfig] || personaConfig.global,
        }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Distribusi Chat per Persona</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Breakdown penggunaan berdasarkan role
                    </p>
                </div>
                <div className="rounded-lg p-2 bg-muted">
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            Belum ada data
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Mulai chat untuk melihat distribusi persona
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedPersonas.map(({ persona, count, percentage, config }) => {
                            const Icon = config.icon;
                            return (
                                <div key={persona} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`rounded-lg p-1.5 ${config.bgColor}`}>
                                                <Icon className={`h-4 w-4 ${config.color}`} />
                                            </div>
                                            <span className="font-medium text-sm">
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {count} sesi
                                            </Badge>
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <Progress 
                                        value={percentage} 
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                        
                        <div className="pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Total Chat Sessions</span>
                                <Badge variant="outline" className="font-medium">
                                    {total} sesi
                                </Badge>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}