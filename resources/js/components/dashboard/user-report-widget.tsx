import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { Tooltip as UITooltip, TooltipTrigger as UITooltipTrigger, TooltipContent as UITooltipContent } from '@/components/ui/tooltip';
import { Users, UserCheck, UserX, TrendingUp, Crown, Wrench, MessageSquare, Zap } from 'lucide-react';
import { useState } from 'react';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    totalSessions: number;
    totalMessages: number;
    lastActivity: string;
    favoritePersona: string;
}

interface PersonaStats {
    persona: string;
    userCount: number;
    activeUsers: number;
    totalSessions: number;
    avgSessionsPerUser: number;
    color: string;
    [key: string]: string | number; // More specific type for Recharts compatibility
}

// Recharts label function props interface
interface PieChartLabelProps {
    [key: string]: unknown; // Recharts compatibility - allows any property type
    persona?: string;
    userCount?: number;
    percent?: number;
}

interface UserGrowthData {
    period: string;
    newUsers: number;
    activeUsers: number;
    totalUsers: number;
}

interface TokenUsageUser {
    id: number;
    name: string;
    email: string;
    role: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    message_count: number;
    avg_tokens_per_message: number;
}

interface TokenUsageOverview {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    period: string;
}

interface TokenUsageByPersona {
    persona: string;
    total_tokens: number;
    message_count: number;
    avg_tokens_per_message: number;
}

interface DailyTokenUsage {
    date: string;
    day: string;
    tokens: number;
}

interface TokenUsageData {
    topUsers: TokenUsageUser[];
    overview: TokenUsageOverview;
    byPersona: TokenUsageByPersona[];
    dailyUsage: DailyTokenUsage[];
}

// Helper function to get display name for persona
const getPersonaDisplayName = (persona: string): string => {
    const personaNames: Record<string, string> = {
        'global': 'Global Chat',
        'engineer': 'Engineer',
        'drafter': 'Drafter',
        'esr': 'ESR (Tower Survey)',
        'hr': 'Human Resources',
        'finance': 'Finance',
        'marketing': 'Marketing',
        'sales': 'Sales',
        'operations': 'Operations',
        'legal': 'Legal'
    };
    return personaNames[persona] || persona;
};

// Helper function to get color for persona
const getPersonaColor = (persona: string): string => {
    const personaColors: Record<string, string> = {
        'global': '#10b981',      // emerald-500 - untuk Global Chat
        'engineer': '#3b82f6',    // blue-500 - untuk Engineer
        'drafter': '#8b5cf6',     // violet-500 - untuk Drafter
        'esr': '#f59e0b',         // amber-500 - untuk ESR
        'hr': '#ef4444',          // red-500 - untuk HR
        'finance': '#06b6d4',     // cyan-500 - untuk Finance
        'marketing': '#ec4899',   // pink-500 - untuk Marketing
        'sales': '#84cc16',       // lime-500 - untuk Sales
        'operations': '#f97316',  // orange-500 - untuk Operations
        'legal': '#6366f1'        // indigo-500 - untuk Legal
    };
    return personaColors[persona] || '#6b7280'; // gray-500 sebagai default
};

interface UserReportWidgetProps {
    personaStats: PersonaStats[];
    topUsers: UserData[];
    userGrowth: UserGrowthData[];
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    tokenUsage?: TokenUsageData;
    isLoading?: boolean;
}

export function UserReportWidget({ 
    personaStats, 
    topUsers, 
    userGrowth, 
    totalUsers, 
    activeUsers, 
    inactiveUsers,
    tokenUsage,
    isLoading = false 
}: UserReportWidgetProps) {
    const [selectedTab, setSelectedTab] = useState('overview');

    const activityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const inactivityRate = totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'superadmin': return <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
            case 'admin': return <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
            case 'engineer': return <Wrench className="h-4 w-4 text-green-600 dark:text-green-400" />;
            case 'drafter': return <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
            default: return <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'superadmin': return 'Super Admin';
            case 'admin': return 'Admin';
            case 'engineer': return 'Engineer';
            case 'drafter': return 'Drafter';
            case 'esr': return 'ESR';
            default: return 'User';
        }
    };

    const formatTooltipValue = (value: number, name: string) => {
        switch (name) {
            case 'activeUsers': return [`${value} pengguna`, 'Pengguna Aktif'];
            case 'userCount': return [`${value} pengguna`, 'Jumlah Pengguna'];
            case 'totalSessions': return [`${value} sesi`, 'Total Sesi'];
            default: return [value, name];
        }
    };

    if (isLoading) {
        return (
            <Card className="col-span-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Laporan Pengguna
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse text-muted-foreground">Memuat data pengguna...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Laporan Pengguna
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="persona">Per Persona</TabsTrigger>
                        <TabsTrigger value="growth">Pertumbuhan</TabsTrigger>
                        <TabsTrigger value="top-users">Top Users</TabsTrigger>
                        <TabsTrigger value="token-usage">Token Usage</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Pengguna</span>
                                </div>
                                <div className="mt-2 text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{totalUsers.toLocaleString()}</div>
                                <div className="text-xs text-blue-700 dark:text-blue-300">Terdaftar di sistem</div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-green-900 dark:text-green-100">Pengguna Aktif</span>
                                </div>
                                <div className="mt-2 text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{activeUsers.toLocaleString()}</div>
                                <div className="text-xs text-green-700 dark:text-green-300">
                                    {activityRate.toFixed(1)}% dari total pengguna
                                </div>
                            </div>
                            <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-3 sm:p-4 border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2">
                                    <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <span className="text-sm font-medium text-red-900 dark:text-red-100">Pengguna Tidak Aktif</span>
                                </div>
                                <div className="mt-2 text-xl sm:text-2xl font-bold text-red-900 dark:text-red-100">{inactiveUsers.toLocaleString()}</div>
                                <div className="text-xs text-red-700 dark:text-red-300">
                                    {inactivityRate.toFixed(1)}% dari total pengguna
                                </div>
                            </div>
                        </div>

                        {/* Activity Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Tingkat Aktivitas Pengguna</span>
                                <span>{activityRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={activityRate} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{activeUsers} aktif</span>
                                <span>{inactiveUsers} tidak aktif</span>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Persona Tab */}
                    <TabsContent value="persona" className="space-y-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Pie Chart */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Distribusi Pengguna per Persona</h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={personaStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ persona, userCount, percent }: PieChartLabelProps) => 
                                                    `${persona || ''}: ${userCount || 0} (${((percent || 0) * 100).toFixed(0)}%)`
                                                }
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="userCount"
                                            >
                                                {personaStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={formatTooltipValue} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">Aktivitas per Persona</h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={personaStats}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis 
                                                dataKey="persona" 
                                                fontSize={10}
                                                tickMargin={8}
                                                interval="preserveStartEnd"
                                                tickLine={false}
                                                axisLine={false}
                                                className="fill-muted-foreground"
                                            />
                                            <YAxis 
                                                fontSize={10}
                                                tickMargin={6}
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
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                            />
                                            <Bar 
                                                dataKey="activeUsers" 
                                                fill="#10b981" 
                                                name="activeUsers"
                                                radius={[2, 2, 0, 0]}
                                            />
                                            <Bar 
                                                dataKey="totalSessions" 
                                                fill="#3b82f6" 
                                                name="totalSessions"
                                                radius={[2, 2, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Persona Stats Table */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Detail Statistik per Persona</h4>
                            <div className="rounded-md border overflow-x-auto">
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm font-medium border-b min-w-[560px]">
                                    <div>Persona</div>
                                    <div>Total Pengguna</div>
                                    <div className="hidden sm:block">Pengguna Aktif</div>
                                    <div>Total Sesi</div>
                                    <div className="hidden sm:block">Rata-rata Sesi/User</div>
                                </div>
                                {personaStats.map((stat, index) => (
                                    <div key={index} className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm border-b last:border-b-0 min-w-[560px]">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: stat.color }}
                                            />
                                            <span className="capitalize">{stat.persona}</span>
                                        </div>
                                        <div>{stat.userCount.toLocaleString()}</div>
                                        <div className="hidden sm:block">{stat.activeUsers.toLocaleString()}</div>
                                        <div>{stat.totalSessions.toLocaleString()}</div>
                                        <div className="hidden sm:block">{stat.avgSessionsPerUser.toFixed(1)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Growth Tab */}
                    <TabsContent value="growth" className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Tren Pertumbuhan Pengguna</h4>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="period" 
                                            fontSize={10}
                                            tickMargin={8}
                                            interval="preserveStartEnd"
                                            tickLine={false}
                                            axisLine={false}
                                            className="fill-muted-foreground"
                                        />
                                        <YAxis 
                                            fontSize={10}
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
                                                color: 'hsl(var(--foreground))'
                                            }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="activeUsers" 
                                            stroke="#10b981" 
                                            strokeWidth={2}
                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                            name="activeUsers"
                                        />

                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Top Users Tab */}
                    <TabsContent value="top-users" className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Top 10 Pengguna Paling Aktif</h4>
                            <div className="rounded-md border overflow-x-auto">
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm font-medium border-b min-w-[640px]">
                                    <div>Rank</div>
                                    <div>Nama</div>
                                    <div className="hidden sm:block">Role</div>
                                    <div className="hidden sm:block">Total Sesi</div>
                                    <div>Total Pesan</div>
                                    <div className="hidden sm:block">Persona Favorit</div>
                                </div>
                                {topUsers.slice(0, 10).map((user, index) => (
                                    <div key={user.id} className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm border-b last:border-b-0 min-w-[640px]">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                                index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="font-medium truncate min-w-0">{user.name}</div>
                                        <div className="flex items-center gap-2 hidden sm:flex">
                                            {getRoleIcon(user.role)}
                                            <span className="capitalize">{getRoleLabel(user.role)}</span>
                                        </div>
                                        <div className="hidden sm:block">{user.totalSessions.toLocaleString()}</div>
                                        <div>{user.totalMessages.toLocaleString()}</div>
                                        <div className="capitalize hidden sm:block">{user.favoritePersona || 'Global'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Token Usage Tab */}
                    <TabsContent value="token-usage" className="space-y-4">
                        {tokenUsage ? (
                            <>
                                {/* Token Overview */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Token</span>
                                        </div>
                                        <div className="mt-2 text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {tokenUsage.overview.total_tokens.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-purple-700 dark:text-purple-300">
                                            {tokenUsage.overview.period}
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Input Token</span>
                                        </div>
                                        <div className="mt-2 text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {tokenUsage.overview.input_tokens.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-blue-700 dark:text-blue-300">
                                            {((tokenUsage.overview.input_tokens / tokenUsage.overview.total_tokens) * 100).toFixed(1)}% dari total
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 sm:p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            <span className="text-sm font-medium text-green-900 dark:text-green-100">Output Token</span>
                                        </div>
                                        <div className="mt-2 text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                                            {tokenUsage.overview.output_tokens.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-green-700 dark:text-green-300">
                                            {((tokenUsage.overview.output_tokens / tokenUsage.overview.total_tokens) * 100).toFixed(1)}% dari total
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    {/* Top Token Users */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Top 5 Pengguna Token</h4>
                                        <div className="rounded-md border overflow-x-auto">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm font-medium border-b min-w-[480px]">
                                                <div>Nama</div>
                                                <div>Total Token</div>
                                                <div>Pesan</div>
                                                <div className="hidden sm:block">Avg/Pesan</div>
                                            </div>
                                            {tokenUsage.topUsers.slice(0, 5).map((user, index) => (
                                                <div key={user.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm border-b last:border-b-0 min-w-[480px]">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                                            index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {index + 1}
                                                        </div>
                                                        <UITooltip>
                                                            <UITooltipTrigger asChild>
                                                                <span className="font-medium truncate max-w-[180px]">{user.name}</span>
                                                            </UITooltipTrigger>
                                                            <UITooltipContent side="top">
                                                                <p className="max-w-xs break-words">{user.name}</p>
                                                            </UITooltipContent>
                                                        </UITooltip>
                                                    </div>
                                                    <div>{user.total_tokens.toLocaleString()}</div>
                                                    <div>{user.message_count.toLocaleString()}</div>
                                                    <div className="hidden sm:block">{Math.round(user.avg_tokens_per_message)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Token Usage by Persona */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Penggunaan Token per Persona</h4>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={tokenUsage.byPersona.map(item => ({
                                                ...item,
                                                personaDisplay: getPersonaDisplayName(item.persona),
                                                fill: getPersonaColor(item.persona)
                                            }))}>
                                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                    <XAxis 
                                                        dataKey="personaDisplay" 
                                                        className="fill-muted-foreground"
                                                        fontSize={10}
                                                        tickMargin={8}
                                                        interval="preserveStartEnd"
                                                    />
                                                    <YAxis 
                                                        tickFormatter={(value) => value.toLocaleString()}
                                                        className="fill-muted-foreground"
                                                        fontSize={10}
                                                        tickMargin={6}
                                                    />
                                                    <Tooltip 
                                                        formatter={(value: number, name: string) => [
                                                            value.toLocaleString(), 
                                                            name === 'total_tokens' ? 'Total Token' : name
                                                        ]}
                                                        labelStyle={{ 
                                                            color: '#f9fafb',
                                                            fontWeight: 'bold',
                                                            fontSize: '14px'
                                                        }}
                                                        contentStyle={{ 
                                                            backgroundColor: '#111827',
                                                            border: '2px solid #374151',
                                                            borderRadius: '8px',
                                                            color: '#f9fafb',
                                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                            fontSize: '13px'
                                                        }}
                                                        itemStyle={{
                                                            color: '#f9fafb',
                                                            fontWeight: '500'
                                                        }}
                                                    />
                                                    <Legend 
                                                        wrapperStyle={{
                                                            paddingTop: '20px',
                                                            fontSize: '11px'
                                                        }}
                                                        formatter={(value) => value === 'total_tokens' ? 'Total Token' : value}
                                                    />
                                                    <Bar 
                                                        dataKey="total_tokens" 
                                                        radius={[4, 4, 0, 0]}
                                                    >
                                                        {tokenUsage.byPersona.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={getPersonaColor(entry.persona)} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Token Usage */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Penggunaan Token Harian (7 Hari Terakhir)</h4>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={tokenUsage.dailyUsage}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                                <XAxis 
                                                    dataKey="day" 
                                                    className="fill-muted-foreground"
                                                    fontSize={10}
                                                    tickMargin={8}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis 
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                    className="fill-muted-foreground"
                                                    fontSize={10}
                                                    tickMargin={6}
                                                />
                                                <Tooltip 
                                                    formatter={(value: number) => [value.toLocaleString(), 'Token']}
                                                    labelFormatter={(label) => `Hari: ${label}`}
                                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                    contentStyle={{ 
                                                        backgroundColor: 'hsl(var(--background))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '6px',
                                                        color: 'hsl(var(--foreground))'
                                                    }}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="tokens" 
                                                    stroke="#8b5cf6" 
                                                    strokeWidth={2}
                                                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-muted-foreground">Data penggunaan token tidak tersedia</div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}