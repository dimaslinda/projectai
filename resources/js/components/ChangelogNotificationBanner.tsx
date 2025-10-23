import React, { useState, useEffect } from 'react';
import { X, Bell, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChangelogModal from './ChangelogModal';
import axios from 'axios';

interface Changelog {
    id: number;
    version: string;
    title: string;
    description: string;
    type: 'major' | 'minor' | 'patch' | 'hotfix';
    created_at: string;
}

interface NotificationStatus {
    has_unread: boolean;
    latest_changelog: Changelog | null;
}

export default function ChangelogNotificationBanner() {
    const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchNotificationStatus();
    }, []);

    const fetchNotificationStatus = async () => {
        try {
            const response = await axios.get('/api/changelog-notifications/status');
            const status = response.data;
            setNotificationStatus(status);
            setIsVisible(status.has_unread);
        } catch (error) {
            console.error('Error fetching notification status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = async () => {
        if (!notificationStatus?.latest_changelog) return;

        try {
            await axios.post(`/api/changelog-notifications/mark-read/${notificationStatus.latest_changelog.id}`);
            setIsVisible(false);
        } catch (error) {
            console.error('Error marking changelog as read:', error);
        }
    };

    const handleViewDetail = () => {
        setIsModalOpen(true);
    };

    const handleModalMarkAsRead = async (changelogId: number) => {
        try {
            await axios.post(`/api/changelog-notifications/mark-read/${changelogId}`);
            setIsVisible(false);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error marking changelog as read:', error);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'major':
                return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
            case 'minor':
                return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
            case 'patch':
                return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
            case 'hotfix':
                return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
        }
    };

    if (isLoading || !isVisible || !notificationStatus?.latest_changelog) {
        return null;
    }

    const changelog = notificationStatus.latest_changelog;

    return (
        <>
            <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-l-blue-400">
                <div className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Update Terbaru: {changelog.title}
                                    </h3>
                                    <Badge 
                                        variant="outline" 
                                        className={`text-xs ${getTypeColor(changelog.type)}`}
                                    >
                                        {changelog.version}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {changelog.description}
                                </p>
                                <div className="flex items-center space-x-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        onClick={handleViewDetail}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        Lihat Detail
                                    </Button>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(changelog.created_at).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismiss}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
            
            <ChangelogModal
                changelog={notificationStatus?.latest_changelog || null}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onMarkAsRead={handleModalMarkAsRead}
            />
        </>
    );
}