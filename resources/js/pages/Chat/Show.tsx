import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Bot, ImagePlus, MoreVertical, Send, Settings, Share2, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ChatMessage from '@/components/ChatMessage';
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
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotification } from '@/hooks/useNotification';
import AppLayout from '@/layouts/app-layout';
import { type ChatHistory, type ChatSession } from '@/types';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    const [streamingMessage, setStreamingMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingImage, setStreamingImage] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'gemini-2.5-pro' | 'gemini-2.5-flash-image'>(session.preferred_model || 'gemini-2.5-pro');
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Hook untuk notifikasi
    const { showAIResponseNotification } = useNotification();

    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = useCallback(() => {
        if (chatContainerRef.current) {
            // Use smooth scrolling with better performance
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        } else {
            // Fallback to messagesEndRef if chatContainerRef is not available
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const throttledScrollToBottom = useCallback(() => {
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            scrollToBottom();
        }, 50); // Throttle to 50ms for smooth streaming
    }, [scrollToBottom]);

    const checkIfNearBottom = () => {
        if (!chatContainerRef.current) return true;

        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const threshold = 100; // 100px from bottom
        return scrollHeight - scrollTop - clientHeight < threshold;
    };

    const handleScroll = useCallback(() => {
        // Debounce scroll check to improve performance
        if (scrollCheckTimeoutRef.current) {
            clearTimeout(scrollCheckTimeoutRef.current);
        }

        scrollCheckTimeoutRef.current = setTimeout(() => {
            setShouldAutoScroll(checkIfNearBottom());
        }, 150); // Debounce to 150ms
    }, []);

    const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
    }, []);

    // Auto-scroll only when user is near bottom or when sending a new message
    useEffect(() => {
        if (shouldAutoScroll || isSubmitting) {
            scrollToBottom();
        }
    }, [session.chat_histories, shouldAutoScroll, isSubmitting, scrollToBottom]);

    // Auto-scroll during streaming only if user is near bottom (throttled for performance)
    useEffect(() => {
        if (shouldAutoScroll && streamingMessage) {
            throttledScrollToBottom();
        }
    }, [streamingMessage, shouldAutoScroll, throttledScrollToBottom]);

    // Cleanup scroll timeouts on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
            if (scrollCheckTimeoutRef.current) {
                clearTimeout(scrollCheckTimeoutRef.current);
            }
        };
    }, []);

    // Enhanced file handling functions from PhotoOrganizer
    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
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
    }, []);

    const handleClipboardPaste = useCallback(
        (e: ClipboardEvent) => {
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
        },
        [validateFile],
    );

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
    }, [handleClipboardPaste]);

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

    const handleSendMessage = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if ((!message.trim() && selectedImages.length === 0) || isSubmitting || isStreaming) return;

            // Store current message and images before clearing
            const currentMessage = message.trim();
            const currentImages = [...selectedImages];

            // Clear form state immediately after validation
            setMessage('');
            setSelectedImages([]);
            setImagePreviews([]);

            // Auto-resize textarea back to minimum height
            if (textareaRef.current) {
                textareaRef.current.style.height = '60px';
            }

            setIsSubmitting(true);
            setIsStreaming(true);
            setStreamingMessage('');

            // Force scroll to bottom when user sends a message
            setShouldAutoScroll(true);
            setTimeout(() => scrollToBottom(), 100);

            const formData = new FormData();
            formData.append('message', currentMessage);

            // Add images to form data
            currentImages.forEach((image, index) => {
                formData.append(`images[${index}]`, image);
            });

            // Add selected model to form data
            formData.append('selected_model', selectedModel);

            try {
                // Use fetch for streaming instead of router.post
                const response = await fetch(`/chat/${session.id}/message-stream`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        Accept: 'text/event-stream',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (reader) {
                    let buffer = '';

                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);

                                // Handle [DONE] signal - this indicates streaming is complete
                                if (data === '[DONE]') {
                                    // Streaming completed, show notification and refresh data
                                    setIsStreaming(false);
                                    setIsSubmitting(false);
                                    setStreamingMessage('');
                                    setStreamingImage(null);
                                    showAIResponseNotification();

                                    // Refresh the page data without full reload
                                    router.reload({
                                        only: ['session'],
                                        onSuccess: () => {
                                            // Auto-scroll to bottom after data is reloaded
                                            setTimeout(() => scrollToBottom(), 100);
                                        },
                                    });
                                    return;
                                }

                                // Try to parse as JSON for structured data
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.type === 'chunk' && parsed.content) {
                                        setStreamingMessage((prev) => prev + parsed.content);
                                    } else if (parsed.type === 'image') {
                                        // Handle image response - set the image and continue streaming
                                        setStreamingImage(parsed.image_url);
                                        // Don't return here, continue processing other chunks
                                    } else if (parsed.type === 'complete') {
                                        // Streaming completed, show notification and refresh data
                                        setIsStreaming(false);
                                        setIsSubmitting(false);
                                        setStreamingMessage('');
                                        setStreamingImage(null);
                                        showAIResponseNotification();

                                        // Refresh the page data without full reload
                                        router.reload({
                                            only: ['session'],
                                            onSuccess: () => {
                                                // Auto-scroll to bottom after data is reloaded
                                                setTimeout(() => scrollToBottom(), 100);
                                            },
                                        });
                                        return;
                                    } else if (parsed.type === 'error') {
                                        setStreamingMessage(parsed.content || 'Terjadi kesalahan');
                                        setStreamingImage(null);
                                        setIsStreaming(false);
                                        setIsSubmitting(false);
                                        setTimeout(() => {
                                            router.reload({ only: ['session'] });
                                        }, 2000);
                                        return;
                                    } else if (parsed.type === 'start') {
                                        // Handle start signal - reset streaming states
                                        setStreamingMessage('');
                                        setStreamingImage(null);
                                    }
                                } catch {
                                    // If it's not valid JSON, treat it as plain text chunk
                                    // This handles cases where the backend sends plain text
                                    if (data.trim() && data !== '[DONE]') {
                                        setStreamingMessage((prev) => prev + data);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
                // Fallback to regular submission
                router.post(`/chat/${session.id}/message`, formData, {
                    forceFormData: true,
                    onSuccess: () => {
                        // Show notification when AI response is complete
                        showAIResponseNotification();
                    },
                    onError: (error) => {
                        console.error('Error sending message:', error);
                    },
                    onFinish: () => {
                        setIsSubmitting(false);
                        setIsStreaming(false);
                    },
                });
                return;
            }

            setIsSubmitting(false);
            setIsStreaming(false);
        },
        [message, selectedImages, isSubmitting, isStreaming, session.id, showAIResponseNotification, scrollToBottom],
    );

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

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim() && !isSubmitting) {
                    setShouldAutoScroll(true);
                    setTimeout(() => {
                        scrollToBottom();
                    }, 100);
                    handleSendMessage(e);
                }
            }
        },
        [message, isSubmitting, handleSendMessage, scrollToBottom],
    );

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
                <div className="flex flex-col gap-2 border-b border-gray-200 bg-white/80 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-700 dark:bg-gray-900/80">
                    <div className="flex w-full items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/chat')}
                            className="rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Kembali</span>
                        </Button>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-lg font-bold text-transparent sm:text-xl dark:from-white dark:to-gray-300">
                                {session.title}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
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
                        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl">
                                        <MoreVertical className="h-4 w-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Aksi</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[180px]">
                                    <DropdownMenuItem onSelect={() => setShowNotificationSettings(true)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Notifikasi
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={handleToggleSharing}>
                                        <Share2 className="mr-2 h-4 w-4" />
                                        {session.is_shared ? 'Batal Bagikan' : 'Bagikan'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Hapus
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Controlled AlertDialog for Delete */}
                            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
                <div
                    ref={chatContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 space-y-6 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white p-3 dark:from-gray-900/50 dark:to-gray-950"
                >
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
                            <ChatMessage
                                key={chat.id}
                                chat={chat}
                                sessionPersona={session.persona}
                                sessionChatType={session.chat_type}
                                formatTime={formatTime}
                            />
                        ))
                    )}

                    {/* AI Streaming Message */}
                    {isStreaming && (
                        <div className="flex justify-start gap-4 duration-300 animate-in slide-in-from-bottom-2">
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

                            <div className="max-w-[75%]">
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-lg shadow-black/5 transition-all duration-200 dark:shadow-black/20">
                                    <div className="space-y-3">
                                        {streamingMessage ? (
                            <div className="text-sm leading-relaxed">
                                <MessageContent content={streamingMessage} className="text-sm leading-relaxed" />
                                <span className="ml-1 animate-pulse text-primary">|</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <div className="flex space-x-1">
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                                </div>
                                <span>
                                    {selectedModel === 'gemini-2.5-flash-image' && message.toLowerCase().includes('gambar') 
                                        ? 'AI sedang membuat gambar...' 
                                        : 'AI sedang mengetik...'}
                                </span>
                            </div>
                        )}

                                        {/* Display streaming image with enhanced loading state */}
                                        {streamingImage && (
                                            <div className="mt-3">
                                                <div className="relative inline-block">
                                                    <img
                                                        src={streamingImage}
                                                        alt="Generated image"
                                                        className="max-w-full rounded-lg border border-gray-200 shadow-lg transition-transform hover:scale-105 dark:border-gray-700"
                                                        style={{ maxHeight: '400px', width: 'auto' }}
                                                        onLoad={() => {
                                                            // Add a subtle animation when image loads
                                                            const img = document.querySelector(`img[src="${streamingImage}"]`);
                                                            if (img) {
                                                                img.classList.add('animate-in', 'fade-in-50', 'zoom-in-95');
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                                                        ✨ AI Generated
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                        className={`relative border-t border-gray-200 bg-white/70 p-2 backdrop-blur-sm transition-all duration-200 dark:border-gray-700 dark:bg-gray-900/70 ${
                            isDragOver ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/50' : ''
                        }`}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {/* Persona Context Indicator */}
                        {session.chat_type === 'persona' && session.persona && (
                            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Bot className="h-3.5 w-3.5" />
                                <span>Berbicara dengan persona:</span>
                                <Badge
                                    variant="secondary"
                                    className="border-purple-200 bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                >
                                    {session.persona}
                                </Badge>
                            </div>
                        )}

                        {/* Image Previews - compact horizontal strip */}
                        {imagePreviews.length > 0 && (
                            <div className="mb-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">Gambar ({imagePreviews.length})</h4>
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
                                <div className="mt-1 flex items-center gap-2 overflow-x-auto py-1">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="group relative">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className={`h-14 w-14 rounded-md border border-gray-200 object-cover shadow-sm transition-all duration-200 dark:border-gray-700 ${
                                                    isSubmitting ? 'opacity-50' : 'group-hover:border-blue-300'
                                                }`}
                                            />
                                            {!isSubmitting && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Drag and Drop Overlay */}
                        {isDragOver && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/95 backdrop-blur-sm dark:border-blue-400 dark:bg-blue-950/95">
                                <div className="text-center">
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                        <ImagePlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-base font-semibold text-blue-700 dark:text-blue-300">Lepaskan file di sini</p>
                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Mendukung JPG, PNG, GIF, WebP (maks. 10MB)</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="space-y-3">
                            {/* Mobile-First: Model Selector on top */}
                            <div className="flex items-center justify-between gap-3 sm:hidden">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model:</span>
                                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isSubmitting}>
                                    <SelectTrigger className="h-9 w-auto min-w-[120px] max-w-[160px] rounded-lg border-gray-200 bg-white text-sm shadow-sm transition-all duration-200 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800">
                                        <SelectValue placeholder="Pilih Model" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg min-w-[180px]">
                                        <SelectItem value="gemini-2.5-pro" className="rounded-md">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                                                    <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="font-medium">Gemini Pro</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="gemini-2.5-flash-image" className="rounded-md">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
                                                    <ImagePlus className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <span className="font-medium">Flash Image</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Input Row */}
                            <div className="flex items-center gap-2">
                                {/* Textarea - auto-grow on the left */}
                                <div className="relative flex-1">
                                    <Textarea
                                        ref={textareaRef}
                                        value={message}
                                        onChange={handleMessageChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ketik pesan Anda..."
                                        className="max-h-[120px] min-h-[44px] resize-none rounded-xl border-gray-200 bg-white py-3 text-sm leading-5 shadow-sm transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 sm:min-h-[40px] sm:py-2"
                                        disabled={isSubmitting}
                                    />
                                    {isSubmitting && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-100/50 dark:bg-gray-800/50">
                                            <div className="flex items-center gap-2">
                                                <div className="flex space-x-1">
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                                                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                                                </div>
                                                <span className="text-xs text-blue-600">
                                                    {selectedModel === 'gemini-2.5-flash-image' && message.toLowerCase().includes('gambar') 
                                                        ? 'Membuat gambar...' 
                                                        : 'Mengirim...'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Desktop Model Selector - hidden on mobile */}
                                <div className="hidden shrink-0 sm:block">
                                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isSubmitting}>
                                        <SelectTrigger className="h-10 w-auto min-w-[140px] max-w-[200px] rounded-xl border-gray-200 bg-white text-sm shadow-sm transition-all duration-200 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800">
                                            <SelectValue placeholder="Pilih Model" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl min-w-[200px]">
                                            <SelectItem value="gemini-2.5-pro" className="rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                        <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="font-medium">Gemini 2.5 Pro</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="gemini-2.5-flash-image" className="rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                                        <ImagePlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <span className="font-medium">Gemini Flash Image</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex shrink-0 items-center gap-2">
                                    {/* Upload Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSubmitting}
                                        className="h-11 w-11 rounded-xl border-gray-200 p-0 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950 sm:h-10 sm:w-auto sm:px-3"
                                        title="Pilih file gambar"
                                    >
                                        <ImagePlus className="h-5 w-5" />
                                    </Button>
                                    {/* Send Button */}
                                    <Button
                                        type="submit"
                                        disabled={(!message.trim() && selectedImages.length === 0) || isSubmitting}
                                        className="h-11 w-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-0 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/40 disabled:opacity-50 sm:h-10 sm:w-auto sm:px-5"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
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

                        {/* Compact Help Text */}
                        <div className="mt-2 text-xs text-muted-foreground">
                            Tekan Enter untuk kirim • Shift+Enter untuk baris baru • Drag & drop gambar
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
