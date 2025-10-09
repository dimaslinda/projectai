import { Head, Link, useForm, router } from '@inertiajs/react';
import { Clock, MessageSquare, Plus, Share2, Users, Trash2, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';

import ChatTypeSelector from '@/components/ChatTypeSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getPersonaById } from '@/config/personas';
import AppLayout from '@/layouts/app-layout';
import { type ChatSession } from '@/types';

interface ChatIndexProps {
    mySessions: ChatSession[];
    sharedSessions: ChatSession[];
    userRole: string;
}

export default function ChatIndex({ mySessions, sharedSessions, userRole }: ChatIndexProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedChatType, setSelectedChatType] = useState<'global' | 'persona' | null>(null);
    const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        type: null as 'global' | 'persona' | null,
        persona: null as string | null,
    });

    const handleChatTypeSelect = (chatType: 'global' | 'persona') => {
        // Prevent selecting persona when userRole is 'user'
        if (userRole === 'user' && chatType === 'persona') {
            // Ignore selection or force global
            setSelectedChatType('global');
            setData('type', 'global');
            setData('persona', null);
            setData('title', 'Chat Global');
            return;
        }

        setSelectedChatType(chatType);
        setData('type', chatType);
        setData('persona', chatType === 'persona' ? userRole : null);

        // Set default title based on selection
        if (chatType === 'global') {
            setData('title', 'Chat Global');
        } else if (chatType === 'persona') {
            const personaData = getPersonaById(userRole);
            setData('title', `Chat ${personaData?.name || userRole}`);
        }
    };

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi data sebelum dikirim
        if (!selectedChatType) {
            return;
        }

        post('/chat', {
            onSuccess: () => {
                setIsCreateDialogOpen(false);
                reset();
                setSelectedChatType(null);
            },
            onError: (errors: Record<string, string>) => {
                console.error('Error creating chat session:', errors);
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'engineer':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'drafter':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'esr':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const toggleSessionSelection = (sessionId: number) => {
        setSelectedSessions(prev => 
            prev.includes(sessionId) 
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedSessions.length === mySessions.length) {
            setSelectedSessions([]);
        } else {
            setSelectedSessions(mySessions.map(session => session.id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedSessions.length === 0) return;

        router.delete('/chat/bulk-delete', {
            data: { session_ids: selectedSessions },
            onSuccess: () => {
                setSelectedSessions([]);
                setIsSelectionMode(false);
            },
        });
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedSessions([]);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dasbor', href: '/dashboard' },
                { title: 'AI Chat', href: '/chat' },
            ]}
        >
            <Head title="AI Chat" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
                        <p className="text-muted-foreground">
                            Berkomunikasi dengan AI assistant yang disesuaikan dengan peran Anda sebagai {userRole.toUpperCase()}
                        </p>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Sesi Chat Baru
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            {!selectedChatType ? (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Pilih Jenis Chat Session</DialogTitle>
                                        <DialogDescription>Pilih jenis AI assistant yang ingin Anda gunakan untuk percakapan ini.</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <ChatTypeSelector onSelect={handleChatTypeSelect} userRole={userRole} />
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleCreateSession}>
                                    <DialogHeader>
                                        <DialogTitle>Buat Sesi Chat Baru</DialogTitle>
                                        <DialogDescription>
                                            {selectedChatType === 'global'
                                                ? 'Chat dengan AI assistant global yang dapat membantu dengan berbagai topik.'
                                                : `Chat dengan AI assistant ${getPersonaById(userRole)?.name} yang khusus untuk divisi ${getPersonaById(userRole)?.name}.`}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Judul Sesi</Label>
                                            <Input
                                                id="title"
                                                value={data.title}
                                                onChange={(e) => setData('title', e.target.value)}
                                                placeholder="Masukkan judul untuk sesi chat ini"
                                                required
                                                className={errors.title ? 'border-red-500' : ''}
                                            />
                                            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Deskripsi singkat tentang topik yang akan dibahas"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setSelectedChatType(null);
                                                reset();
                                            }}
                                        >
                                            Kembali
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Membuat...' : 'Buat Sesi'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {/* My Sessions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            <h2 className="text-xl font-semibold">Sesi Chat Saya</h2>
                            <Badge variant="secondary">{mySessions.length}</Badge>
                        </div>
                        
                        {mySessions.length > 0 && (
                            <div className="flex items-center gap-2">
                                {isSelectionMode && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={toggleSelectAll}
                                            className="flex items-center gap-2"
                                        >
                                            {selectedSessions.length === mySessions.length ? (
                                                <CheckSquare className="h-4 w-4" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                            {selectedSessions.length === mySessions.length ? 'Batalkan Semua' : 'Pilih Semua'}
                                        </Button>
                                        
                                        {selectedSessions.length > 0 && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" className="flex items-center gap-2">
                                                        <Trash2 className="h-4 w-4" />
                                                        Hapus ({selectedSessions.length})
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-bold">Hapus Multiple Sesi Chat</AlertDialogTitle>
                                                        <AlertDialogDescription className="leading-relaxed text-muted-foreground">
                                                            Apakah Anda yakin ingin menghapus {selectedSessions.length} sesi chat yang dipilih? 
                                                            Tindakan ini tidak dapat dibatalkan dan semua riwayat percakapan akan hilang.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="gap-3">
                                                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={handleBulkDelete}
                                                            className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/40"
                                                        >
                                                            Hapus Semua
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        
                                        <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
                                            Batal
                                        </Button>
                                    </>
                                )}
                                
                                {!isSelectionMode && (
                                    <Button variant="outline" size="sm" onClick={toggleSelectionMode}>
                                        Pilih Multiple
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {mySessions.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-medium">Belum ada sesi chat</h3>
                                <p className="mb-4 text-center text-muted-foreground">Mulai percakapan pertama Anda dengan AI assistant</p>
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Buat Sesi Chat Pertama
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {mySessions.map((session) => (
                                <Card key={session.id} className={`transition-shadow hover:shadow-md ${isSelectionMode ? 'relative' : 'cursor-pointer'} ${selectedSessions.includes(session.id) ? 'ring-2 ring-blue-500' : ''}`}>
                                    {isSelectionMode && (
                                        <div className="absolute left-3 top-3 z-10">
                                            <Checkbox
                                                checked={selectedSessions.includes(session.id)}
                                                onCheckedChange={() => toggleSessionSelection(session.id)}
                                                className="h-5 w-5"
                                            />
                                        </div>
                                    )}
                                    
                                    <div className={isSelectionMode ? 'pl-8' : ''}>
                                        {isSelectionMode ? (
                                            <div>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <CardTitle className="line-clamp-2 text-lg">{session.title}</CardTitle>
                                                        {session.is_shared && <Share2 className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                                                    </div>
                                                    {session.description && <CardDescription className="line-clamp-2">{session.description}</CardDescription>}
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(session.last_activity_at)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${
                                                                    session.chat_type === 'global'
                                                                        ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950'
                                                                        : 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950'
                                                                }`}
                                                            >
                                                                {session.chat_type === 'global' ? 'Global' : 'Persona'}
                                                            </Badge>
                                                            {session.persona && (
                                                                <Badge className={getRoleColor(session.persona)} variant="secondary">
                                                                    {session.persona.toUpperCase()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {session.latest_message && (
                                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.latest_message.message}</p>
                                                    )}
                                                </CardContent>
                                            </div>
                                        ) : (
                                            <Link href={`/chat/${session.id}`}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <CardTitle className="line-clamp-2 text-lg">{session.title}</CardTitle>
                                                        {session.is_shared && <Share2 className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                                                    </div>
                                                    {session.description && <CardDescription className="line-clamp-2">{session.description}</CardDescription>}
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDate(session.last_activity_at)}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${
                                                                    session.chat_type === 'global'
                                                                        ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950'
                                                                        : 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950'
                                                                }`}
                                                            >
                                                                {session.chat_type === 'global' ? 'Global' : 'Persona'}
                                                            </Badge>
                                                            {session.persona && (
                                                                <Badge className={getRoleColor(session.persona)} variant="secondary">
                                                                    {session.persona.toUpperCase()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {session.latest_message && (
                                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.latest_message.message}</p>
                                                    )}
                                                </CardContent>
                                            </Link>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shared Sessions */}
                {sharedSessions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <h2 className="text-xl font-semibold">Sesi Chat Dibagikan</h2>
                            <Badge variant="secondary">{sharedSessions.length}</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sharedSessions.map((session) => (
                                <Card key={session.id} className="cursor-pointer transition-shadow hover:shadow-md">
                                    <Link href={`/chat/${session.id}`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="line-clamp-2 text-lg">{session.title}</CardTitle>
                                                <Share2 className="ml-2 h-4 w-4 flex-shrink-0 text-blue-500" />
                                            </div>
                                            {session.description && <CardDescription className="line-clamp-2">{session.description}</CardDescription>}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(session.last_activity_at)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${
                                                            session.chat_type === 'global'
                                                                ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950'
                                                                : 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950'
                                                        }`}
                                                    >
                                                        {session.chat_type === 'global' ? 'Global' : 'Persona'}
                                                    </Badge>
                                                    {session.persona && (
                                                        <Badge className={getRoleColor(session.persona)} variant="secondary">
                                                            {session.persona.toUpperCase()}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Oleh: {session.user?.name || 'Unknown'}</p>
                                            {session.latest_message && (
                                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{session.latest_message.message}</p>
                                            )}
                                        </CardContent>
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
