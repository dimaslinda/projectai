import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role?: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface ChatSession {
    id: number;
    user_id: number;
    title: string;
    persona: string;
    chat_type: 'global' | 'persona';
    description?: string;
    is_shared: boolean;
    shared_with_roles?: string[];
    last_activity_at: string;
    created_at: string;
    updated_at: string;
    user?: User;
    latest_message?: ChatHistory;
    chat_histories?: ChatHistory[];
}

export interface ChatSessionType {
    id: 'global' | 'persona';
    name: string;
    description: string;
    icon: string;
    personas?: PersonaOption[];
}

export interface PersonaOption {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    color: string;
}

export interface ChatMetadata {
    persona?: string;
    chat_type?: string;
    timestamp?: string;
    [key: string]: unknown; // Allow additional properties while maintaining type safety
}

export interface ChatHistory {
    id: number;
    user_id: number;
    chat_session_id: number;
    message: string;
    sender: 'user' | 'ai';
    metadata?: ChatMetadata;
    created_at: string;
    updated_at: string;
    user?: User;
    chat_session?: ChatSession;
}
