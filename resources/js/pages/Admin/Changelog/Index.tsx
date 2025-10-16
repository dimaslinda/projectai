import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import changelogRoutes from '@/routes/admin/changelog';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, Edit, Eye, FileText, MoreHorizontal, Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Changelog {
    id: number;
    version: string;
    release_date: string;
    type: 'major' | 'minor' | 'patch' | 'hotfix';
    title: string;
    description?: string;
    changes?: string[];
    technical_notes?: string[];
    is_published: boolean;
    created_by?: number;
    creator?: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
}

interface PaginatedChangelogs {
    data: Changelog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    changelogs: PaginatedChangelogs;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Changelog',
        href: changelogRoutes.index().url,
    },
];

export default function Index({ changelogs }: Props) {
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'major':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
            case 'minor':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
            case 'patch':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
            case 'hotfix':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const handleDelete = (id: number) => {
        router.delete(changelogRoutes.destroy(id).url, {
            onSuccess: () => setDeleteId(null),
        });
    };

    const handleTogglePublished = (id: number) => {
        router.patch(changelogRoutes.togglePublished(id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Changelog Management" />

            <div className="space-y-8 p-6">
                {/* Header Section */}
                <div className="flex items-center justify-between border-b pb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Changelog Management</h1>
                        <p className="text-lg text-muted-foreground">Manage application version history and release notes</p>
                    </div>
                    <Link href={changelogRoutes.create().url}>
                        <Button size="lg" className="shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Entry
                        </Button>
                    </Link>
                </div>

                {/* Content Section */}
                <div className="grid gap-6">
                    {changelogs.data.length === 0 ? (
                        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <div className="mb-4 rounded-full bg-gray-50 dark:bg-gray-800 p-4">
                                    <Tag className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">No changelog entries</h3>
                                <p className="mb-6 max-w-md text-center text-muted-foreground">
                                    Start by creating your first changelog entry to track application updates and keep users informed about new
                                    features and improvements.
                                </p>
                                <Link href={changelogRoutes.create().url}>
                                    <Button size="lg" className="shadow-sm">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create First Entry
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        changelogs.data.map((changelog) => (
                            <Card key={changelog.id} className="border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-gray-900/20">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <Badge className={`${getTypeBadgeColor(changelog.type)} px-3 py-1 font-medium`}>
                                                {changelog.type.toUpperCase()}
                                            </Badge>
                                            <div className="space-y-1">
                                                <h3 className="text-xl leading-tight font-semibold text-gray-900 dark:text-gray-100">{changelog.version}</h3>
                                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{changelog.title}</p>
                                                {!changelog.is_published && (
                                                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={changelogRoutes.show(changelog.id).url}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={changelogRoutes.edit(changelog.id).url}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleTogglePublished(changelog.id)}>
                                                    {changelog.is_published ? (
                                                        <>
                                                            <ToggleLeft className="mr-2 h-4 w-4" />
                                                            Unpublish
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ToggleRight className="mr-2 h-4 w-4" />
                                                            Publish
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDeleteId(changelog.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        {changelog.description && <p className="leading-relaxed text-gray-600 dark:text-gray-400">{changelog.description}</p>}

                                        {changelog.changes && changelog.changes.length > 0 && (
                                            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
                                                <h4 className="mb-3 flex items-center font-semibold text-gray-900 dark:text-gray-100">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Changes
                                                </h4>
                                                <ul className="space-y-2">
                                                    {changelog.changes.slice(0, 3).map((change, index) => (
                                                        <li key={index} className="flex items-start">
                                                            <span className="mt-2 mr-3 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                                                            <span className="text-gray-700 dark:text-gray-300">{change}</span>
                                                        </li>
                                                    ))}
                                                    {changelog.changes.length > 3 && (
                                                        <li className="ml-5 font-medium text-blue-600 dark:text-blue-400">
                                                            +{changelog.changes.length - 3} more changes...
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    <span className="font-medium">Release:</span>
                                                    <span className="ml-1">{format(new Date(changelog.release_date), 'MMM dd, yyyy')}</span>
                                                </div>
                                                {changelog.creator && (
                                                    <div className="flex items-center">
                                                        <span className="font-medium">by</span>
                                                        <span className="ml-1 text-gray-700 dark:text-gray-300">{changelog.creator.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Created {format(new Date(changelog.created_at), 'MMM dd, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {changelogs.last_page > 1 && (
                    <div className="flex items-center justify-center space-x-2">
                        {changelogs.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the changelog entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
