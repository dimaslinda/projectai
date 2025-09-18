import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import userRoutes from '@/routes/users';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield, User, UserPlus } from 'lucide-react';
import React from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        role: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(userRoutes.store().url);
    };

    return (
        <AppLayout>
            <Head title="Create User" />

            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={userRoutes.index().url}>
                        <Button variant="outline" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New User</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Add a new user to the system with their basic information</p>
                    </div>
                </div>
                <div className="hidden items-center gap-2 text-gray-500 sm:flex dark:text-gray-400">
                    <User className="h-5 w-5" />
                    <span className="text-sm">User Management</span>
                </div>
            </div>

            <div className="py-6">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <Card className="border-0 bg-white shadow-lg dark:bg-sidebar">
                        <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-sidebar-border dark:from-sidebar dark:to-sidebar">
                            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-sidebar-foreground">
                                <User className="h-5 w-5 text-blue-600 dark:text-sidebar-foreground" />
                                User Information
                            </CardTitle>
                            <p className="mt-1 text-sm text-gray-600 dark:text-sidebar-foreground/70">
                                Fill in the details below to create a new user account
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
                                            placeholder="Enter full name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
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
                                            placeholder="Enter email address"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
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
                                        <SelectTrigger className="border-gray-300 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white dark:focus:border-blue-400">
                                            <SelectValue placeholder="Select user role" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:border-sidebar-border dark:bg-sidebar-accent">
                                            <SelectItem value="admin" className="dark:text-sidebar-foreground dark:focus:bg-sidebar">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                    Administrator
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="user" className="dark:text-sidebar-foreground dark:focus:bg-sidebar">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                    Regular User
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.role && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                            <div className="h-1 w-1 rounded-full bg-red-600 dark:bg-red-400"></div>
                                            {errors.role}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password"
                                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-sidebar-foreground"
                                        >
                                            <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="border-gray-300 pr-10 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white dark:focus:border-blue-400"
                                                required
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
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm password"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                className="border-gray-300 pr-10 transition-all duration-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-sidebar-border dark:bg-sidebar-accent dark:text-sidebar-foreground dark:placeholder-white dark:focus:border-blue-400"
                                                required
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

                                <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 md:grid-cols-2 dark:border-sidebar-border">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="w-full border-2 border-gray-300 text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-sidebar-border dark:text-sidebar-foreground dark:hover:bg-sidebar-accent"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create User
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
