import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Bot, MessageSquare, TrendingUp, Zap } from 'lucide-react';

interface AIUsageWidgetProps {
    totalMessages: number;
    aiMessages: number;
}

export function AIUsageWidget({ totalMessages, aiMessages }: AIUsageWidgetProps) {
    const userMessages = totalMessages - aiMessages;
    const aiResponseRate = totalMessages > 0 ? (aiMessages / totalMessages) * 100 : 0;
    const userMessageRate = totalMessages > 0 ? (userMessages / totalMessages) * 100 : 0;

    const usageStats = [
        {
            label: 'Pesan AI',
            value: aiMessages,
            percentage: aiResponseRate,
            icon: Bot,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            progressColor: 'bg-blue-500',
        },
        {
            label: 'Pesan User',
            value: userMessages,
            percentage: userMessageRate,
            icon: MessageSquare,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-100 dark:bg-green-900',
            progressColor: 'bg-green-500',
        },
    ];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold">Ringkasan Penggunaan AI</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Statistik interaksi dengan AI assistant</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                {totalMessages === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium text-muted-foreground">Belum ada aktivitas</h3>
                        <p className="text-sm text-muted-foreground">Mulai chat untuk melihat statistik AI</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Overall Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg bg-muted/50 p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{totalMessages.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Total Pesan</div>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-4 text-center">
                                <div className="text-2xl font-bold text-primary">{aiResponseRate.toFixed(1)}%</div>
                                <div className="text-sm text-muted-foreground">Respons AI</div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="space-y-4">
                            {usageStats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`rounded-lg p-1.5 ${stat.bgColor}`}>
                                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                                </div>
                                                <span className="text-sm font-medium">{stat.label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {stat.value.toLocaleString()}
                                                </Badge>
                                                <span className="text-sm font-medium text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                        <Progress value={stat.percentage} className="h-2" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* AI Efficiency Indicator */}
                        <div className="border-t border-border/50 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium">AI Efficiency</span>
                                </div>
                                <Badge variant={aiResponseRate >= 45 ? 'default' : 'secondary'} className="text-xs">
                                    {aiResponseRate >= 45 ? 'Optimal' : 'Good'}
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Rasio respons AI yang seimbang menunjukkan interaksi yang produktif</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
