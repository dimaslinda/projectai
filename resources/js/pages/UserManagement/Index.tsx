import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import userRoutes from '@/routes/users';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const getRoleBadgeVariant = (role: string) => {
    switch (role) {
        case 'superadmin':
            return 'destructive';
        case 'engineer':
            return 'default';
        case 'drafter':
            return 'secondary';
        case 'esr':
            return 'outline';
        default:
            return 'default';
    }
};

export default function Index({ users }: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = (userId: number) => {
        router.delete(userRoutes.destroy(userId).url);
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) {
            return users.data;
        }

        const query = searchQuery.toLowerCase();
        return users.data.filter(
            (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query),
        );
    }, [users.data, searchQuery]);

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <AppLayout hideChangelogBanner={true}>
            <Head title="User Management" />

            <div className="space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                            <p className="text-muted-foreground">Manage user accounts and permissions</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name, email, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 pl-10 sm:w-80"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
                                >
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Clear search</span>
                                </Button>
                            )}
                        </div>
                        <Link href={userRoutes.create().url} className="inline-block no-underline">
                            <Button
                                size="sm"
                                className="w-full cursor-pointer transition-colors hover:bg-primary/90 sm:w-auto"
                                type="button"
                                aria-label="Add new user"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{searchQuery ? 'Filtered Users' : 'Total Users'}</p>
                                    <p className="text-2xl font-bold">{searchQuery ? filteredUsers.length : users.total}</p>
                                </div>
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Current Page</p>
                                    <p className="text-2xl font-bold">
                                        {users.current_page} of {users.last_page}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                                    <Edit className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Per Page</p>
                                    <p className="text-2xl font-bold">{users.per_page}</p>
                                </div>
                                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>
                            {searchQuery
                                ? `Showing ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} matching "${searchQuery}"`
                                : 'A list of all users in your system including their name, email, role, and creation date.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b hover:bg-transparent">
                                        <TableHead className="font-semibold">Name</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">Role</TableHead>
                                        <TableHead className="font-semibold">Created</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    {searchQuery ? (
                                                        <>
                                                            <Search className="h-8 w-8 text-muted-foreground" />
                                                            <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                                                            <Button variant="outline" size="sm" onClick={clearSearch}>
                                                                Clear search
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Users className="h-8 w-8 text-muted-foreground" />
                                                            <p className="text-muted-foreground">No users found</p>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                            <span className="text-sm font-medium text-primary">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        {user.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Link href={userRoutes.edit(user.id).url}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                <span className="sr-only">Edit user</span>
                                                            </Button>
                                                        </Link>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Delete user</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete <strong>{user.name}</strong>? This action
                                                                        cannot be undone and will permanently remove the user account and all
                                                                        associated data.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(user.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete User
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {users.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                                    {Math.min(users.current_page * users.per_page, users.total)} of {users.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    {users.current_page > 1 && (
                                        <Link href={userRoutes.index({ query: { page: users.current_page - 1 } }).url}>
                                            <Button variant="outline" size="sm">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}

                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(users.last_page, 5) }, (_, i) => {
                                            let page;
                                            if (users.last_page <= 5) {
                                                page = i + 1;
                                            } else if (users.current_page <= 3) {
                                                page = i + 1;
                                            } else if (users.current_page >= users.last_page - 2) {
                                                page = users.last_page - 4 + i;
                                            } else {
                                                page = users.current_page - 2 + i;
                                            }

                                            return (
                                                <Link key={page} href={userRoutes.index({ query: { page } }).url}>
                                                    <Button
                                                        variant={page === users.current_page ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {page}
                                                    </Button>
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    {users.current_page < users.last_page && (
                                        <Link href={userRoutes.index({ query: { page: users.current_page + 1 } }).url}>
                                            <Button variant="outline" size="sm">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
