import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import changelogRoutes from '@/routes/admin/changelog';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, FileText, Plus, Settings, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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

interface FormData {
    version: string;
    release_date: string;
    type: 'major' | 'minor' | 'patch' | 'hotfix' | '';
    title: string;
    description: string;
    changes: string[];
    technical_notes: string[];
    is_published: boolean;
}

interface Props {
    changelog: Changelog;
}

export default function Edit({ changelog }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Changelog', href: changelogRoutes.index().url },
        { title: `Edit ${changelog.version}`, href: '#' },
    ];

    const [newChange, setNewChange] = useState('');
    const [newTechnicalNote, setNewTechnicalNote] = useState('');

    const { data, setData, put, processing, errors } = useForm<FormData>({
        version: changelog.version,
        release_date: changelog.release_date,
        type: changelog.type,
        title: changelog.title,
        description: changelog.description || '',
        changes: changelog.changes || [],
        technical_notes: changelog.technical_notes || [],
        is_published: changelog.is_published,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(changelogRoutes.update(changelog.id).url);
    };

    const addChange = () => {
        if (newChange.trim()) {
            setData('changes', [...data.changes, newChange.trim()]);
            setNewChange('');
        }
    };

    const removeChange = (index: number) => {
        setData(
            'changes',
            data.changes.filter((_, i) => i !== index),
        );
    };

    const addTechnicalNote = () => {
        if (newTechnicalNote.trim()) {
            setData('technical_notes', [...data.technical_notes, newTechnicalNote.trim()]);
            setNewTechnicalNote('');
        }
    };

    const removeTechnicalNote = (index: number) => {
        setData(
            'technical_notes',
            data.technical_notes.filter((_, i) => i !== index),
        );
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Changelog - ${changelog.version}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center space-x-4">
                    <Link href={changelogRoutes.index().url}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Changelog
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Changelog Entry</h1>
                        <p className="text-muted-foreground">Update version {changelog.version} release information</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="space-y-6 lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Basic Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <Label htmlFor="version">Version *</Label>
                                            <Input
                                                id="version"
                                                type="text"
                                                placeholder="e.g., v1.2.0"
                                                value={data.version}
                                                onChange={(e) => setData('version', e.target.value)}
                                                className={errors.version ? 'border-red-500' : ''}
                                            />
                                            {errors.version && <p className="mt-1 text-sm text-red-500">{errors.version}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="type">Release Type *</Label>
                                            <Select value={data.type} onValueChange={(value) => setData('type', value as FormData['type'])}>
                                                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select release type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="major">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className="bg-red-100 text-red-800">MAJOR</Badge>
                                                            <span>Breaking changes</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="minor">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className="bg-blue-100 text-blue-800">MINOR</Badge>
                                                            <span>New features</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="patch">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className="bg-green-100 text-green-800">PATCH</Badge>
                                                            <span>Bug fixes</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="hotfix">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className="bg-yellow-100 text-yellow-800">HOTFIX</Badge>
                                                            <span>Critical fixes</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="release_date">Release Date *</Label>
                                        <Input
                                            id="release_date"
                                            type="date"
                                            value={data.release_date}
                                            onChange={(e) => setData('release_date', e.target.value)}
                                            className={errors.release_date ? 'border-red-500' : ''}
                                        />
                                        {errors.release_date && <p className="mt-1 text-sm text-red-500">{errors.release_date}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            type="text"
                                            placeholder="e.g., Enhanced User Experience"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            className={errors.title ? 'border-red-500' : ''}
                                        />
                                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Brief description of this release..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Changes Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Changes & Features</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="Add a change or new feature..."
                                            value={newChange}
                                            onChange={(e) => setNewChange(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChange())}
                                        />
                                        <Button type="button" onClick={addChange} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {data.changes.length > 0 && (
                                        <div className="space-y-2">
                                            {data.changes.map((change, index) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                                    <span className="text-sm">{change}</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeChange(index)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.changes && <p className="text-sm text-red-500">{errors.changes}</p>}
                                </CardContent>
                            </Card>

                            {/* Technical Notes Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="mr-2 h-5 w-5" />
                                        Technical Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="Add technical notes for developers..."
                                            value={newTechnicalNote}
                                            onChange={(e) => setNewTechnicalNote(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnicalNote())}
                                        />
                                        <Button type="button" onClick={addTechnicalNote} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {data.technical_notes.length > 0 && (
                                        <div className="space-y-2">
                                            {data.technical_notes.map((note, index) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                                                    <span className="text-sm">{note}</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnicalNote(index)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.technical_notes && <p className="text-sm text-red-500">{errors.technical_notes}</p>}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Publishing Options</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_published"
                                            checked={data.is_published}
                                            onCheckedChange={(checked) => setData('is_published', !!checked)}
                                        />
                                        <Label htmlFor="is_published">Published</Label>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">Control whether this entry is visible to users</p>
                                </CardContent>
                            </Card>

                            {/* Entry Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Entry Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <span className="font-medium">Created:</span>
                                        <p className="text-muted-foreground">{new Date(changelog.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Last Updated:</span>
                                        <p className="text-muted-foreground">{new Date(changelog.updated_at).toLocaleString()}</p>
                                    </div>
                                    {changelog.creator && (
                                        <div>
                                            <span className="font-medium">Created by:</span>
                                            <p className="text-muted-foreground">{changelog.creator.name}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Preview */}
                            {data.type && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getTypeBadgeColor(data.type)}>{data.type.toUpperCase()}</Badge>
                                                {!data.is_published && (
                                                    <Badge variant="outline" className="text-orange-600">
                                                        Draft
                                                    </Badge>
                                                )}
                                            </div>
                                            {data.version && (
                                                <h3 className="font-semibold">
                                                    {data.version} {data.title && `- ${data.title}`}
                                                </h3>
                                            )}
                                            {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
                                            {data.release_date && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {new Date(data.release_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="flex space-x-2">
                                <Button type="submit" disabled={processing} className="flex-1">
                                    {processing ? 'Updating...' : 'Update Entry'}
                                </Button>
                                <Link href={changelogRoutes.index().url}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}