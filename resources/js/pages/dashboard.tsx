import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { AITrafficWidget } from '@/components/dashboard/ai-traffic-widget';
import { UserReportWidget } from '@/components/dashboard/user-report-widget';
import { aiTraffic, userReport } from '@/routes/dashboard';



interface AITrafficData {
    dailyData: Array<{
        period: string;
        aiMessages: number;
        userMessages: number;
        sessions: number;
        avgResponseTime: number;
        persona?: string;
    }>;
    weeklyData: Array<{
        period: string;
        aiMessages: number;
        userMessages: number;
        sessions: number;
        avgResponseTime: number;
        persona?: string;
    }>;
    monthlyData: Array<{
        period: string;
        aiMessages: number;
        userMessages: number;
        sessions: number;
        avgResponseTime: number;
        persona?: string;
    }>;
    yearlyData: Array<{
        period: string;
        aiMessages: number;
        userMessages: number;
        sessions: number;
        avgResponseTime: number;
        persona?: string;
    }>;
}

interface UserReportData {
    personaStats: Array<{
        persona: string;
        userCount: number;
        activeUsers: number;
        totalSessions: number;
        avgSessionsPerUser: number;
        color: string;
    }>;
    topUsers: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        totalSessions: number;
        totalMessages: number;
        lastActivity: string;
        favoritePersona: string;
    }>;
    userGrowth: Array<{
        period: string;
        newUsers: number;
        activeUsers: number;
        totalUsers: number;
    }>;
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    tokenUsage: {
        topUsers: Array<{
            id: number;
            name: string;
            email: string;
            role: string;
            total_tokens: number;
            input_tokens: number;
            output_tokens: number;
            message_count: number;
            avg_tokens_per_message: number;
        }>;
        overview: {
            total_tokens: number;
            input_tokens: number;
            output_tokens: number;
            period: string;
        };
        byPersona: Array<{
            persona: string;
            total_tokens: number;
            message_count: number;
            avg_tokens_per_message: number;
        }>;
        dailyUsage: Array<{
            date: string;
            day: string;
            tokens: number;
        }>;
    };
}

export default function Dashboard() {
    const [aiTrafficData, setAITrafficData] = useState<AITrafficData | null>(null);
    const [userReportData, setUserReportData] = useState<UserReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [trafficResponse, userResponse] = await Promise.all([
                fetch(aiTraffic().url),
                fetch(userReport().url)
            ]);

            const [trafficData, userData] = await Promise.all([
                trafficResponse.json(),
                userResponse.json()
            ]);

            setAITrafficData(trafficData);
            setUserReportData(userData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-32 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dashboard</h1>
                
                {/* AI Traffic Widget */}
                <div className="mb-6">
                    <AITrafficWidget 
                        dailyData={aiTrafficData?.dailyData || []}
                        weeklyData={aiTrafficData?.weeklyData || []}
                        monthlyData={aiTrafficData?.monthlyData || []}
                        yearlyData={aiTrafficData?.yearlyData || []}
                        isLoading={loading}
                    />
                </div>

                {/* User Report Widget */}
                <div className="mb-6">
                    <UserReportWidget 
                        personaStats={userReportData?.personaStats || []}
                        topUsers={userReportData?.topUsers || []}
                        userGrowth={userReportData?.userGrowth || []}
                        totalUsers={userReportData?.totalUsers || 0}
                        activeUsers={userReportData?.activeUsers || 0}
                        inactiveUsers={userReportData?.inactiveUsers || 0}
                        tokenUsage={userReportData?.tokenUsage}
                        isLoading={loading}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
