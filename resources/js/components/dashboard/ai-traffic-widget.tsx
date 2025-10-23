import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrafficData {
    period: string;
    aiMessages: number;
    userMessages: number;
    sessions: number;
    avgResponseTime: number;
    persona?: string;
}

interface AITrafficWidgetProps {
    dailyData: TrafficData[];
    weeklyData: TrafficData[];
    monthlyData: TrafficData[];
    yearlyData: TrafficData[];
    isLoading?: boolean;
}

export function AITrafficWidget({ dailyData, weeklyData, monthlyData, yearlyData, isLoading = false }: AITrafficWidgetProps) {
    const [selectedPersona, setSelectedPersona] = useState<string>('all');

    const getDataByPeriod = (period: string) => {
        switch (period) {
            case 'daily':
                return dailyData;
            case 'weekly':
                return weeklyData;
            case 'monthly':
                return monthlyData;
            case 'yearly':
                return yearlyData;
            default:
                return dailyData;
        }
    };

    const filterDataByPersona = (data: TrafficData[]) => {
        if (selectedPersona === 'all') {
            return data;
        }

        // Group data by period and filter by persona
        const filteredData = data.filter((item) => item.persona === selectedPersona);

        // If no data matches the selected persona, return empty array with same structure
        if (filteredData.length === 0) {
            return data.map((item) => ({
                ...item,
                aiMessages: 0,
                userMessages: 0,
                sessions: 0,
                avgResponseTime: 0,
            }));
        }

        return filteredData;
    };

    const calculateTotalMessages = (data: TrafficData[]) => {
        return data.reduce((sum, item) => sum + item.aiMessages + item.userMessages, 0);
    };

    const calculateGrowth = (data: TrafficData[]) => {
        if (data.length < 2) return 0;
        const current = data[data.length - 1];
        const previous = data[data.length - 2];
        const currentTotal = current.aiMessages + current.userMessages;
        const previousTotal = previous.aiMessages + previous.userMessages;
        return previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    };

    const formatTooltipValue = (value: number, name: string) => {
        switch (name) {
            case 'aiMessages':
                return [`${value.toLocaleString()} pesan`, 'Pesan AI'];
            case 'userMessages':
                return [`${value.toLocaleString()} pesan`, 'Pesan User'];
            case 'sessions':
                return [`${value.toLocaleString()} sesi`, 'Sesi Chat'];
            case 'avgResponseTime':
                return [`${value.toFixed(2)}s`, 'Waktu Respons Rata-rata'];
            default:
                return [value, name];
        }
    };

    if (isLoading) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Traffic AI
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse text-muted-foreground">Memuat data traffic...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Traffic AI
                    </CardTitle>
                    <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pilih Persona" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Persona</SelectItem>
                            <SelectItem value="global">Global Chat</SelectItem>
                            <SelectItem value="drafter">Drafter</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="daily" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="daily">Harian</TabsTrigger>
                        <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                        <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                        <TabsTrigger value="yearly">Tahunan</TabsTrigger>
                    </TabsList>

                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => {
                        const rawData = getDataByPeriod(period);
                        const data = filterDataByPersona(rawData);
                        const totalMessages = calculateTotalMessages(data);
                        const growth = calculateGrowth(data);

                        return (
                            <TabsContent key={period} value={period} className="space-y-4">
                                {/* Summary Stats */}
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Pesan</span>
                                        </div>
                                        <div className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {totalMessages.toLocaleString()}
                                        </div>
                                        <div
                                            className={`text-xs ${growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                                        >
                                            {growth >= 0 ? '+' : ''}
                                            {growth.toFixed(1)}% dari periode sebelumnya
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-purple-800/20">
                                        <div className="flex items-center gap-2">
                                            <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Pesan AI</span>
                                        </div>
                                        <div className="mt-2 text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {data.reduce((sum, item) => sum + item.aiMessages, 0).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-purple-700 dark:text-purple-300">
                                            {totalMessages > 0
                                                ? ((data.reduce((sum, item) => sum + item.aiMessages, 0) / totalMessages) * 100).toFixed(1)
                                                : 0}
                                            % dari total
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 dark:border-green-800 dark:from-green-900/20 dark:to-green-800/20">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Sesi Chat</span>
                                        </div>
                                        <div className="mt-2 text-2xl font-bold text-green-900 dark:text-green-100">
                                            {data.reduce((sum, item) => sum + item.sessions, 0).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-green-700 dark:text-green-300">
                                            Rata-rata{' '}
                                            {data.length > 0 ? (data.reduce((sum, item) => sum + item.sessions, 0) / data.length).toFixed(1) : 0} per
                                            periode
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/20">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Waktu Respons</span>
                                        </div>
                                        <div className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-100">
                                            {data.length > 0
                                                ? (data.reduce((sum, item) => sum + item.avgResponseTime, 0) / data.length).toFixed(2)
                                                : 0}
                                            s
                                        </div>
                                        <div className="text-xs text-orange-700 dark:text-orange-300">Rata-rata respons AI</div>
                                    </div>
                                </div>

                                {/* Charts */}
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Messages Chart */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Tren Pesan</h4>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis
                                                        dataKey="period"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        className="fill-muted-foreground"
                                                    />
                                                    <YAxis
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => value.toLocaleString()}
                                                        className="fill-muted-foreground"
                                                    />
                                                    <Tooltip
                                                        formatter={formatTooltipValue}
                                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--background))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '6px',
                                                            color: 'hsl(var(--foreground))',
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="userMessages"
                                                        stackId="1"
                                                        stroke="#10b981"
                                                        fill="#10b981"
                                                        fillOpacity={0.6}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="aiMessages"
                                                        stackId="1"
                                                        stroke="#8b5cf6"
                                                        fill="#8b5cf6"
                                                        fillOpacity={0.6}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Sessions Chart */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Sesi Chat & Waktu Respons</h4>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis
                                                        dataKey="period"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        className="fill-muted-foreground"
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => value.toLocaleString()}
                                                        className="fill-muted-foreground"
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(value) => `${value}s`}
                                                        className="fill-muted-foreground"
                                                    />
                                                    <Tooltip
                                                        formatter={formatTooltipValue}
                                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--background))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '6px',
                                                            color: 'hsl(var(--foreground))',
                                                        }}
                                                    />
                                                    <Bar yAxisId="left" dataKey="sessions" fill="#3b82f6" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="avgResponseTime"
                                                        stroke="#f59e0b"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </CardContent>
        </Card>
    );
}
