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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import changelogRoutes from '@/routes/admin/changelog';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Calendar, CheckCircle, Circle, Clock, Edit, FileText, Settings, ToggleLeft, ToggleRight, Trash2, User } from 'lucide-react';
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

interface Props {
    changelog: Changelog;
}

export default function Show({ changelog }: Props) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Changelog', href: changelogRoutes.index().url },
        { title: `${changelog.version}`, href: '#' },
    ];

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'major':
                return 'bg-red-100 text-red-800';
            case 'minor':
                return 'bg-blue-100 text-blue-800';
            case 'patch':
                return 'bg-green-100 text-green-800';
            case 'hotfix':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDelete = () => {
        router.delete(changelogRoutes.destroy(changelog.id).url, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                router.visit(changelogRoutes.index().url);
            },
        });
    };

    const handleTogglePublished = () => {
        router.patch(changelogRoutes.togglePublished(changelog.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Changelog - ${changelog.version}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Changelog Details</h1>
                        <p className="text-muted-foreground">Version {changelog.version} release information</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={handleTogglePublished}>
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
                        </Button>
                        <Link href={changelogRoutes.edit(changelog.id).url}>
                            <Button size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Header Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Badge className={getTypeBadgeColor(changelog.type)}>{changelog.type.toUpperCase()}</Badge>
                                        {!changelog.is_published && (
                                            <Badge variant="outline" className="text-orange-600">
                                                Draft
                                            </Badge>
                                        )}
                                        {changelog.is_published && (
                                            <Badge variant="outline" className="text-green-600">
                                                Published
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CardTitle className="text-2xl">
                                    {changelog.version} - {changelog.title}
                                </CardTitle>
                                {changelog.description && <p className="text-lg text-muted-foreground">{changelog.description}</p>}
                            </CardHeader>
                        </Card>

                        {/* Changes Section */}
                        {changelog.changes && changelog.changes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Changes & Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {changelog.changes.map((change, index) => (
                                            <li key={index} className="flex items-start space-x-3">
                                                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                                                <span className="text-sm leading-relaxed">{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Technical Notes Section */}
                        {changelog.technical_notes && changelog.technical_notes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="mr-2 h-5 w-5" />
                                        Technical Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg bg-blue-50 p-4">
                                        <ul className="space-y-3">
                                            {changelog.technical_notes.map((note, index) => (
                                                <li key={index} className="flex items-start space-x-3">
                                                    <Circle className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600" />
                                                    <span className="text-sm leading-relaxed text-blue-900">{note}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Empty State */}
                        {(!changelog.changes || changelog.changes.length === 0) &&
                            (!changelog.technical_notes || changelog.technical_notes.length === 0) && (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-semibold">No detailed information</h3>
                                        <p className="mb-4 text-center text-muted-foreground">
                                            This changelog entry doesn't have detailed changes or technical notes yet.
                                        </p>
                                        <Link href={changelogRoutes.edit(changelog.id).url}>
                                            <Button>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Add Details
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Release Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Release Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Release Date</p>
                                        <p className="text-sm text-muted-foreground">{format(new Date(changelog.release_date), 'MMMM dd, yyyy')}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center space-x-3">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Version</p>
                                        <p className="text-sm text-muted-foreground">{changelog.version}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center space-x-3">
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Release Type</p>
                                        <Badge className={getTypeBadgeColor(changelog.type)}>
                                            {changelog.type.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center space-x-3">
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Status</p>
                                        <Badge variant="outline" className={changelog.is_published ? 'text-green-600' : 'text-orange-600'}>
                                            {changelog.is_published ? 'Published' : 'Draft'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {changelog.creator && (
                                    <>
                                        <div className="flex items-center space-x-3">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Created by</p>
                                                <p className="text-sm text-muted-foreground">{changelog.creator.name}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                <div className="flex items-center space-x-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Created</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(changelog.created_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center space-x-3">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Last Updated</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(changelog.updated_at), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Statistics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{changelog.changes?.length || 0}</p>
                                        <p className="text-sm text-muted-foreground">Changes</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{changelog.technical_notes?.length || 0}</p>
                                        <p className="text-sm text-muted-foreground">Tech Notes</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the changelog entry for version{' '}
                            <strong>{changelog.version}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete Entry
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
