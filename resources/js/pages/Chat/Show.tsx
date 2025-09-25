import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Bot, ImagePlus, Send, Settings, Share2, Trash2, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import MessageContent from '@/components/MessageContent';
import NotificationSettings from '@/components/NotificationSettings';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotification } from '@/hooks/useNotification';
import AppLayout from '@/layouts/app-layout';
import { type ChatHistory, type ChatSession } from '@/types';

interface ChatShowProps {
    session: ChatSession & {
        chat_histories: ChatHistory[];
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
    userRole: string;
    canEdit: boolean;
}

export default function ChatShow({ session, canEdit }: ChatShowProps) {

    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [previousMessageCount, setPreviousMessageCount] = useState(session.chat_histories.length);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hook untuk notifikasi
    const { showAIResponseNotification } = useNotification();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [session.chat_histories, isSubmitting]);

    // Effect untuk mendeteksi response AI baru dan memicu notifikasi
    useEffect(() => {
        const currentMessageCount = session.chat_histories.length;

        // Jika ada pesan baru dan bukan sedang submit (artinya response dari AI)
        if (currentMessageCount > previousMessageCount && !isSubmitting) {
            const latestMessage = session.chat_histories[currentMessageCount - 1];

            // Pastikan pesan terakhir adalah dari AI (bukan user)
            if (latestMessage && latestMessage.sender === 'ai') {
                // Delay sedikit untuk memastikan UI sudah terupdate
                setTimeout(() => {
                    showAIResponseNotification();
                }, 500);
            }
        }

        // Update previous message count
        setPreviousMessageCount(currentMessageCount);
    }, [session.chat_histories, isSubmitting, previousMessageCount, showAIResponseNotification]);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            // Only handle paste when the textarea is focused or when in the chat area
            if (textareaRef.current && (document.activeElement === textareaRef.current || textareaRef.current.contains(document.activeElement))) {
                handleClipboardPaste(e);
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    // Enhanced file handling functions from PhotoOrganizer
    const validateFile = (file: File): { valid: boolean; error?: string } => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: `File ${file.name}: Tipe file tidak didukung. Hanya JPG, PNG, GIF, dan WebP yang diizinkan.` };
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { valid: false, error: `File ${file.name}: Ukuran file terlalu besar. Maksimal 10MB.` };
        }

        return { valid: true };
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const validFiles: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error!);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa file tidak valid:\n' + errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setSelectedImages((prev) => [...prev, ...validFiles]);

            // Create previews for valid files
            validFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews((prev) => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're leaving the main container
        if (e.currentTarget === e.target) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        files.forEach((file) => {
            const validation = validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(validation.error!);
            }
        });

        if (errors.length > 0) {
            alert('Beberapa file tidak valid:\n' + errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setSelectedImages((prev) => [...prev, ...validFiles]);

            // Create previews
            validFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews((prev) => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleClipboardPaste = (e: ClipboardEvent) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        const items = Array.from(clipboardData.items);
        const imageItems = items.filter((item) => item.type.startsWith('image/'));

        if (imageItems.length > 0) {
            e.preventDefault(); // Prevent default paste behavior for images

            imageItems.forEach((item) => {
                const file = item.getAsFile();
                if (file) {
                    const validation = validateFile(file);
                    if (!validation.valid) {
                        alert(validation.error!);
                        return;
                    }

                    // Add to selected images
                    setSelectedImages((prev) => [...prev, file]);

                    // Create preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setImagePreviews((prev) => [...prev, e.target?.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!message.trim() && selectedImages.length === 0) || isSubmitting) return;

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('message', message.trim());

        // Add images to form data
        selectedImages.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        router.post(`/chat/${session.id}/message`, formData, {
            forceFormData: true,
            onSuccess: () => {
                // Reset form state after successful submission
                setMessage('');
                setSelectedImages([]);
                setImagePreviews([]);

                // Auto-resize textarea back to minimum height
                if (textareaRef.current) {
                    textareaRef.current.style.height = '60px';
                }
            },
            onError: (error) => {
                console.error('Error sending message:', error);
            },
            onFinish: () => {
                // Always reset submitting state when request is completely finished
                setIsSubmitting(false);
            },
        });
    };

    const handleToggleSharing = () => {
        router.patch(
            `/chat/${session.id}/toggle-sharing`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleDeleteSession = () => {
        router.delete(`/chat/${session.id}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
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

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dasbor', href: '/dashboard' },
                { title: 'AI Chat', href: '/chat' },
                { title: session.title, href: `/chat/${session.id}` },
            ]}
        >
            <Head title={`Chat: ${session.title}`} />

            <div className="flex h-[calc(100vh-4rem)] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-white/80 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/chat')}
                            className="rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <div>
                            <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-300">
                                {session.title}
                            </h1>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Oleh: {session.user.name}</span>
                                </div>
                                {session.persona && (
                                    <Badge className={`${getRoleColor(session.persona)} shadow-sm`} variant="secondary">
                                        {session.persona.toUpperCase()}
                                    </Badge>
                                )}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge
                                                variant="outline"
                                                className={`cursor-help shadow-sm ${
                                                    session.chat_type === 'global'
                                                        ? 'border-accent-foreground/20 bg-accent text-accent-foreground'
                                                        : 'border-primary/30 bg-primary/10 text-primary'
                                                }`}
                                            >
                                                {session.chat_type === 'global' ? 'Global Chat' : 'Persona Chat'}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>
                                                {session.chat_type === 'global'
                                                    ? 'Chat umum dengan AI assistant'
                                                    : `Chat dengan persona: ${session.persona}`}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {session.is_shared && (
                                    <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary shadow-sm">
                                        <Share2 className="mr-1 h-3 w-3" />
                                        Dibagikan
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowNotificationSettings(true)}
                                className="rounded-xl border-border text-muted-foreground shadow-sm transition-all duration-200 hover:border-border/80 hover:bg-accent hover:text-accent-foreground"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Notifikasi
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleSharing}
                                className="rounded-xl border-primary/30 text-primary shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                {session.is_shared ? 'Batal Bagikan' : 'Bagikan'}
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl border-destructive/30 text-destructive shadow-sm transition-all duration-200 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-xl font-bold">Hapus Sesi Chat</AlertDialogTitle>
                                        <AlertDialogDescription className="leading-relaxed text-muted-foreground">
                                            Apakah Anda yakin ingin menghapus sesi chat ini? Tindakan ini tidak dapat dibatalkan dan semua riwayat
                                            percakapan akan hilang.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3">
                                        <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDeleteSession}
                                            className="rounded-xl bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 transition-all duration-200 hover:from-destructive/90 hover:to-destructive hover:shadow-destructive/40"
                                        >
                                            Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white p-6 dark:from-gray-900/50 dark:to-gray-950">
                    {session.chat_histories.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <div className="mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
                                <Bot className="h-12 w-12 text-white" />
                            </div>
                            <h3 className="mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                                Mulai Percakapan
                            </h3>
                            <p className="mb-4 max-w-md leading-relaxed text-muted-foreground">
                                Kirim pesan pertama Anda untuk memulai percakapan dengan AI assistant yang cerdas dan responsif.
                            </p>
                        </div>
                    ) : (
                        session.chat_histories.map((chat) => (
                            <div
                                key={chat.id}
                                className={`flex gap-4 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'} duration-300 animate-in slide-in-from-bottom-2`}
                            >
                                {chat.sender === 'ai' && (
                                    <div className="flex flex-col items-center gap-1">
                                        <Avatar className="h-10 w-10 shadow-md ring-2 ring-primary/20 dark:ring-primary/30">
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                                                <Bot className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        {session.chat_type === 'persona' && session.persona && (
                                            <Badge
                                                variant="secondary"
                                                className="border-accent-foreground/20 bg-accent px-2 py-0.5 text-xs text-accent-foreground duration-300 animate-in fade-in-50"
                                            >
                                                {session.persona}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <div className={`max-w-[75%] ${chat.sender === 'user' ? 'order-1' : ''}`}>
                                    <div
                                        className={`group relative ${
                                            chat.sender === 'user'
                                                ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                                                : 'border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/20'
                                        } rounded-2xl p-4 transition-all duration-200 hover:shadow-xl ${
                                            chat.sender === 'user' ? 'hover:shadow-primary/30' : 'hover:shadow-black/10 dark:hover:shadow-black/30'
                                        }`}
                                    >
                                        {chat.sender === 'user' ? (
                                            <div className="space-y-3">
                                                {/* Display uploaded images if any */}
                                                {chat.metadata?.images && Array.isArray(chat.metadata.images) && chat.metadata.images.length > 0 && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {chat.metadata.images.map((imageUrl: string, index: number) => (
                                                            <div key={index} className="group relative">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={`Uploaded image ${index + 1}`}
                                                                    className="h-32 w-full rounded-lg object-cover shadow-sm transition-shadow duration-200 group-hover:shadow-md"
                                                                />
                                                                <div className="bg-opacity-0 group-hover:bg-opacity-10 absolute inset-0 flex items-center justify-center rounded-lg transition-all duration-200">
                                                                    <button
                                                                        onClick={() => window.open(imageUrl, '_blank')}
                                                                        className="bg-opacity-90 hover:bg-opacity-100 rounded-full bg-white p-2 opacity-0 transition-all duration-200 group-hover:opacity-100"
                                                                    >
                                                                        <svg
                                                                            className="h-4 w-4 text-gray-700"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.message}</p>
                                            </div>
                                        ) : (
                                            <MessageContent content={chat.message} className="text-sm leading-relaxed" />
                                        )}
                                        <p
                                            className={`mt-3 flex items-center gap-1 text-xs ${
                                                chat.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${chat.sender === 'user' ? 'bg-primary-foreground/50' : 'bg-muted-foreground/50'}`}
                                            ></span>
                                            {formatTime(chat.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {chat.sender === 'user' && (
                                    <Avatar className="order-2 h-10 w-10 shadow-md ring-2 ring-secondary/20 dark:ring-secondary/30">
                                        <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground">
                                            <User className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}

                    {/* AI Loading Skeleton */}
                    {isSubmitting && (
                        <div className="flex justify-start gap-4 duration-300 animate-in slide-in-from-bottom-2">
                            <div className="flex flex-col items-center gap-1">
                                <Avatar className="h-10 w-10 shadow-md ring-2 ring-blue-100 dark:ring-blue-900">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                        <img src="/asset/img/Icon.png" alt="AI" className="h-5 w-5 animate-pulse" />
                                    </AvatarFallback>
                                </Avatar>
                                {session.chat_type === 'persona' && session.persona && (
                                    <Badge
                                        variant="secondary"
                                        className="border-purple-200 bg-purple-100 px-2 py-0.5 text-xs text-purple-700 duration-300 animate-in fade-in-50 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                    >
                                        {session.persona}
                                    </Badge>
                                )}
                            </div>

                            <div className="max-w-[75%]">
                                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-gray-500/10 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                                            <Skeleton className="h-4 w-4/5 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 [animation-delay:0.2s] dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                                            <Skeleton className="h-4 w-3/5 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 [animation-delay:0.4s] dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
                                        </div>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="flex space-x-1">
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gradient-to-r from-blue-500 to-blue-600 [animation-delay:-0.3s]" />
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gradient-to-r from-blue-500 to-blue-600 [animation-delay:-0.15s]" />
                                                <div className="h-2 w-2 animate-bounce rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
                                            </div>
                                            <span className="ml-2 animate-pulse text-xs text-muted-foreground">AI sedang mengetik...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                {canEdit && (
                    <div
                        className={`relative border-t border-gray-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/80 ${
                            isDragOver ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/50' : ''
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Persona Context Indicator */}
                        {session.chat_type === 'persona' && session.persona && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground duration-300 animate-in slide-in-from-top-2">
                                <Bot className="h-4 w-4" />
                                <span>Berbicara dengan persona:</span>
                                <Badge
                                    variant="secondary"
                                    className="border-purple-200 bg-purple-100 text-purple-700 duration-300 animate-in fade-in-50 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                >
                                    {session.persona}
                                </Badge>
                            </div>
                        )}

                        {/* Enhanced Image Previews with better UI */}
                        {imagePreviews.length > 0 && (
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Gambar Terpilih ({imagePreviews.length})</h4>
                                    {!isSubmitting && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedImages([]);
                                                setImagePreviews([]);
                                            }}
                                            className="text-xs"
                                        >
                                            Hapus Semua
                                        </Button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="group relative">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className={`h-24 w-24 rounded-lg border-2 border-gray-200 object-cover shadow-sm transition-all duration-200 dark:border-gray-700 ${
                                                    isSubmitting ? 'opacity-50' : 'group-hover:border-blue-300'
                                                }`}
                                            />
                                            {!isSubmitting && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                            <div className="absolute right-1 bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                {selectedImages[index]?.name?.substring(0, 15)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Drag and Drop Overlay */}
                        {isDragOver && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/95 backdrop-blur-sm dark:border-blue-400 dark:bg-blue-950/95">
                                <div className="text-center duration-200 animate-in fade-in-50 zoom-in-95">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                        <ImagePlus className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">Lepaskan file di sini</p>
                                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                        Mendukung JPG, PNG, GIF, WebP (maks. 10MB per file)
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex gap-3">
                            <div className="relative flex-1">
                                <Textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ketik pesan Anda..."
                                    className="max-h-[120px] min-h-[60px] resize-none rounded-xl border-gray-200 bg-white shadow-sm transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                                    disabled={isSubmitting}
                                />
                                {isSubmitting && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
                                        <div className="flex space-x-1">
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                                            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Upload Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                    className="h-[60px] rounded-xl border-gray-200 px-3 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950"
                                    title="Pilih file gambar"
                                >
                                    <ImagePlus className="h-5 w-5" />
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                disabled={(!message.trim() && selectedImages.length === 0) || isSubmitting}
                                className="h-[60px] self-end rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/40 disabled:opacity-50"
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </form>

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        {/* Enhanced Help Text */}
                        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">💡 Tips Upload Gambar:</h5>
                            <div className="grid grid-cols-1 gap-1 text-xs text-gray-600 md:grid-cols-2 dark:text-gray-400">
                                <p className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                                    Tekan Enter untuk kirim, Shift+Enter untuk baris baru
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                                    Ctrl+V untuk paste gambar dari clipboard
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                                    Drag & drop file atau gunakan tombol upload
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                                    Format: JPG, PNG, GIF, WebP • Maks: 10MB/file
                                </p>
                            </div>
                        </div>
                    </div>
                )}



                {!canEdit && (
                    <div className="border-t bg-muted/50 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Anda hanya dapat melihat percakapan ini. Hanya pemilik yang dapat mengirim pesan.
                        </p>
                    </div>
                )}
            </div>

            {/* Notification Settings Dialog */}
            <NotificationSettings open={showNotificationSettings} onOpenChange={setShowNotificationSettings} />
        </AppLayout>
    );
}
