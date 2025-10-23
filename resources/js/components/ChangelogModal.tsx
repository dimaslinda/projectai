import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React from 'react';

interface Changelog {
    id: number;
    version: string;
    title: string;
    description: string;
    type: 'major' | 'minor' | 'patch' | 'hotfix';
    release_date?: string;
    created_at: string;
    changes?: string[];
    technical_notes?: string[];
}

interface ChangelogModalProps {
    changelog: Changelog | null;
    isOpen: boolean;
    onClose: () => void;
    onMarkAsRead?: (changelogId: number) => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ changelog, isOpen, onClose, onMarkAsRead }) => {
    if (!isOpen || !changelog) return null;

    const handleMarkAsRead = () => {
        if (onMarkAsRead) {
            onMarkAsRead(changelog.id);
        }
        onClose();
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-opacity-50 dark:bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-black p-4 dark:bg-black">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Changelog</h2>
                        <Badge variant="outline" className={`${getTypeColor(changelog.type)}`}>
                            {changelog.version}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-100 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {changelog.type}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Title and Meta */}
                        <div>
                            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{changelog.title}</h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>Tanggal Rilis: {formatDate(changelog.created_at)}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300">{changelog.description}</p>
                        </div>

                        {/* Changes */}
                        {changelog.changes && changelog.changes.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Perubahan & Fitur Baru</h3>
                                <ul className="space-y-2">
                                    {changelog.changes.map((change, index) => (
                                        <li key={index} className="flex items-start space-x-2">
                                            <span className="mt-1 text-green-500 dark:text-green-400">•</span>
                                            <span className="text-gray-700 dark:text-gray-300">{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Technical Notes */}
                        {changelog.technical_notes && changelog.technical_notes.length > 0 && (
                            <div>
                                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Catatan Teknis</h3>
                                <ul className="space-y-2">
                                    {changelog.technical_notes.map((note, index) => (
                                        <li key={index} className="flex items-start space-x-2">
                                            <span className="mt-1 text-blue-500 dark:text-blue-400">•</span>
                                            <span className="text-gray-700 dark:text-gray-300">{note}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <button
                        onClick={onClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Tutup
                    </button>
                    {onMarkAsRead && (
                        <button
                            onClick={handleMarkAsRead}
                            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-700 dark:hover:bg-blue-800"
                        >
                            Tandai Sudah Dibaca
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;
