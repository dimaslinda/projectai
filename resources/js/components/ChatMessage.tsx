import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { memo } from 'react';
import MessageContent from './MessageContent';

interface ChatMessageProps {
    chat: {
        id: number;
        message: string;
        sender: 'user' | 'ai';
        created_at: string;
        metadata?: {
            images?: string[];
            generated_image?: string;
            response_type?: string;
        };
    };
    sessionPersona?: string;
    sessionChatType?: string;
    formatTime: (dateString: string) => string;
}

const ChatMessage = memo(({ chat, sessionPersona, sessionChatType, formatTime }: ChatMessageProps) => {
    return (
        <div className={`flex gap-4 duration-300 animate-in slide-in-from-bottom-2 ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {chat.sender === 'ai' && (
                <div className="flex flex-col items-center gap-1">
                    <Avatar className="h-10 w-10 shadow-md ring-2 ring-primary/20 dark:ring-primary/30">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
                            <Bot className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    {sessionChatType === 'persona' && sessionPersona && (
                        <Badge
                            variant="secondary"
                            className="border-accent-foreground/20 bg-accent px-2 py-0.5 text-xs text-accent-foreground duration-300 animate-in fade-in-50"
                        >
                            {sessionPersona}
                        </Badge>
                    )}
                </div>
            )}

            <div className={`min-w-0 max-w-[75%] ${chat.sender === 'user' ? 'order-1' : ''}`}>
                <div
                    className={`rounded-2xl border p-4 shadow-lg shadow-black/5 transition-all duration-200 dark:shadow-black/20 ${
                        chat.sender === 'user'
                            ? 'border-primary/20 bg-gradient-to-br from-primary to-primary/95 text-primary-foreground'
                            : 'border-border bg-card'
                    }`}
                >
                    <div className="space-y-3">
                        {/* Display uploaded images if any */}
                        {chat.sender === 'user' &&
                            chat.metadata?.images &&
                            Array.isArray(chat.metadata.images) &&
                            chat.metadata.images.length > 0 && (
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
                                                    <svg className="h-4 w-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="text-sm leading-relaxed">
                            {chat.sender === 'user' ? (
                                <div className="break-anywhere whitespace-pre-wrap">{chat.message}</div>
                            ) : (
                                <MessageContent content={chat.message} className="text-sm leading-relaxed break-anywhere" />
                            )}
                        </div>

                        {/* Display generated image if any */}
                        {chat.sender === 'ai' && chat.metadata?.generated_image && (
                            <div className="mt-4">
                                <div className="group relative inline-block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
                                    <img
                                        src={chat.metadata.generated_image}
                                        alt="AI Generated Image"
                                        className="max-w-full transition-transform duration-300 group-hover:scale-105"
                                        style={{ maxHeight: '500px', width: 'auto' }}
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                        <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                        AI Generated
                                    </div>
                                    <button
                                        onClick={() => chat.metadata?.generated_image && window.open(chat.metadata.generated_image, '_blank')}
                                        className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 shadow-lg transition-all duration-300 hover:bg-white group-hover:opacity-100 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                                        title="Open in new tab"
                                    >
                                        <svg className="h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        )}

                        <p
                            className={`flex items-center gap-1.5 text-xs ${
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
            </div>

            {chat.sender === 'user' && (
                <Avatar className="order-2 h-10 w-10 shadow-md ring-2 ring-secondary/20 dark:ring-secondary/30">
                    <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground">
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            )}
        </div>
    );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;