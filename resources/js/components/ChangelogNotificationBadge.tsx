import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import ChangelogModal from './ChangelogModal';

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

export default function ChangelogNotificationBadge() {
    const [status, setStatus] = useState<NotificationStatus | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchStatus();

        // Poll for updates every 5 minutes
        const interval = setInterval(fetchStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await axios.get('/api/changelog-notifications/status');
            setStatus(response.data);
        } catch (error) {
            console.error('Error fetching changelog status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (changelogId: number) => {
        try {
            await axios.post(`/api/changelog-notifications/mark-read/${changelogId}`);
            // Refresh status after marking read
            fetchStatus();
        } catch (error) {
            console.error('Error marking changelog as read:', error);
        }
    };

    const handleChangelogClick = (changelog: Changelog) => {
        setSelectedChangelog(changelog);
        setIsModalOpen(true);
        setIsOpen(false);
    };

    const handleModalMarkAsRead = (changelogId: number) => {
        markAsRead(changelogId);
        setIsModalOpen(false);
        setSelectedChangelog(null);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'major':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'minor':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'patch':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'hotfix':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    if (isLoading || !status || !status.has_unread || !status.latest_changelog) {
        return (
            <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                        <Bell className="h-4 w-4" />
                        {status.has_unread && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                                1
                            </Badge>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 border-gray-200 bg-white p-0 dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Update Terbaru</h3>
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {status.latest_changelog && (
                            <div className="border-b border-gray-200 p-4 last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleChangelogClick(status.latest_changelog!)}>
                                        <div className="mb-1 flex items-center space-x-2">
                                            <Badge
                                                variant="outline"
                                                className={`border-gray-300 text-xs dark:border-gray-600 ${getTypeColor(status.latest_changelog.type)}`}
                                            >
                                                {status.latest_changelog.version}
                                            </Badge>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(status.latest_changelog.created_at).toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400">
                                            {status.latest_changelog.title}
                                        </h4>
                                        <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-300">{status.latest_changelog.description}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(status.latest_changelog!.id);
                                        }}
                                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                        title="Tandai dibaca"
                                    >
                                        <Check className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-300 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            onClick={() => {
                                window.open('/admin/changelog', '_blank');
                                setIsOpen(false);
                            }}
                        >
                            Lihat Semua Update
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <ChangelogModal
                changelog={selectedChangelog}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedChangelog(null);
                }}
                onMarkAsRead={handleModalMarkAsRead}
            />
        </>
    );
}
