import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import userRoutes from '@/routes/users';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit as EditIcon, Eye, EyeOff, Lock, Mail, Save, Shield, User } from 'lucide-react';
import React from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Props {
    user: User;
}

export default function Edit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(userRoutes.update(user.id).url);
    };

    return (
        <AppLayout hideChangelogBanner={true}>
            <Head title={`Edit User - ${user.name}`} />

            <div className="mb-8 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <Link href={userRoutes.index().url}>
                        <Button variant="outline" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl leading-tight font-bold text-gray-900 dark:text-white">Edit User</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Update user information and permissions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>User Management</span>
                </div>
            </div>

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <Card className="border-0 bg-white shadow-lg dark:bg-sidebar">
                        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-sidebar-border dark:from-sidebar dark:to-sidebar">
                            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-sidebar-foreground">
                                <EditIcon className="h-5 w-5 text-blue-600 dark:text-sidebar-foreground" />
                                Edit User: {user.name}
                            </CardTitle>
                            <p className="mt-1 text-sm text-gray-600 dark:text-sidebar-foreground/70">
                                Modify user details and update their role permissions
                            </p>
                        </CardHeader>
                        <CardContent className="bg-gray-50/50 p-8 dark:bg-sidebar/50">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                        >
                                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter full name"
                                            className="border-gray-300 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white dark:focus:border-blue-400"
                                            required
                                        />
                                        {errors.name && (
                                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                <div className="h-1 w-1 rounded-full bg-red-600 dark:bg-red-400"></div>
                                                {errors.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                        >
                                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Enter email address"
                                            className="border-gray-300 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white dark:focus:border-blue-400"
                                            required
                                        />
                                        {errors.email && (
                                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                <div className="h-1 w-1 rounded-full bg-red-600 dark:bg-red-400"></div>
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="role"
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                    >
                                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        User Role
                                    </Label>
                                    <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select user role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="engineer" className="hover:bg-gray-100 dark:hover:bg-sidebar">Engineer</SelectItem>
                                            <SelectItem value="drafter" className="hover:bg-gray-100 dark:hover:bg-sidebar">Drafter</SelectItem>
                                            <SelectItem value="esr" className="hover:bg-gray-100 dark:hover:bg-sidebar">ESR</SelectItem>
                                            <SelectItem value="superadmin" className="hover:bg-gray-100 dark:hover:bg-sidebar">Superadmin</SelectItem>
                                            <SelectItem value="user" className="hover:bg-gray-100 dark:hover:bg-sidebar">User (Umum)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                                            <span className="h-1 w-1 rounded-full bg-red-500"></span>
                                            {errors.role}
                                        </p>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 pt-8 dark:border-gray-600">
                                    <div className="mb-6">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Change Password (Optional)
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            Leave blank to keep the current password unchanged
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password"
                                                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                            >
                                                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                New Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={data.password}
                                                    onChange={(e) => setData('password', e.target.value)}
                                                    placeholder="Enter new password (leave blank to keep current)"
                                                    className={`pr-10 transition-all duration-200 ${
                                                        errors.password
                                                            ? 'border-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:border-blue-500 dark:border-sidebar-border dark:focus:border-blue-400'
                                                    } bg-white text-gray-900 dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600 dark:text-sidebar-foreground/70 dark:hover:text-sidebar-foreground"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                    <div className="h-1 w-1 rounded-full bg-red-600 dark:bg-red-400"></div>
                                                    {errors.password}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password_confirmation"
                                                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                            >
                                                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                Confirm New Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={data.password_confirmation}
                                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                                    placeholder="Confirm new password"
                                                    className={`pr-10 transition-all duration-200 ${
                                                        errors.password_confirmation
                                                            ? 'border-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:border-blue-500 dark:border-sidebar-border dark:focus:border-blue-400'
                                                    } bg-white text-gray-900 dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600 dark:text-sidebar-foreground/70 dark:hover:text-sidebar-foreground"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password_confirmation && (
                                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                    <div className="h-1 w-1 rounded-full bg-red-600 dark:bg-red-400"></div>
                                                    {errors.password_confirmation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-6 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit('/users')}
                                        className="w-full border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 dark:border-sidebar-border dark:text-sidebar-foreground dark:hover:bg-sidebar-accent"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Update User
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
