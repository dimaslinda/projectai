import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHAT_SESSION_TYPES, PERSONA_OPTIONS } from '@/config/personas';
import { ChevronRight, Globe, Users } from 'lucide-react';
import React, { useState } from 'react';

interface ChatTypeSelectorProps {
    onSelect: (chatType: 'global' | 'persona') => void;
    onCancel?: () => void;
    userRole?: string;
}

const ChatTypeSelector: React.FC<ChatTypeSelectorProps> = ({ onSelect, onCancel, userRole }) => {
    const [selectedType, setSelectedType] = useState<'global' | 'persona' | null>(null);

    const handleTypeSelect = (type: 'global' | 'persona') => {
        setSelectedType(type);
    };

    const handleConfirm = () => {
        if (selectedType) {
            onSelect(selectedType);
        }
    };

    const canConfirm = selectedType !== null;

    // Get user's persona info for display
    const userPersona = userRole ? PERSONA_OPTIONS.find((p) => p.id === userRole) : null;

    // Filter available chat types: hide persona option for general 'user' role
    const availableChatTypes = userRole === 'user' ? CHAT_SESSION_TYPES.filter((t) => t.id === 'global') : CHAT_SESSION_TYPES;

    return (
        <div className="space-y-6">
            {/* Step 1: Choose Chat Type */}
            <div>
                <h3 className="mb-4 text-lg font-semibold">Pilih Jenis Chat Session</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {availableChatTypes.map((type) => (
                        <Card
                            key={type.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                selectedType === type.id
                                    ? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => handleTypeSelect(type.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">
                                        {type.id === 'global' ? <Globe className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{type.name}</CardTitle>
                                        <CardDescription className="mt-1 text-sm">{type.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
                {userRole === 'user' && (
                    <p className="mt-2 text-sm text-muted-foreground">Pengguna umum hanya dapat membuat chat global.</p>
                )}
            </div>

            {/* Step 2: Show User's Persona (if persona type selected) */}
            {selectedType === 'persona' && userPersona && (
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Persona Anda</h3>
                    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <Badge className={`${userPersona.color} text-xs text-white`}>{userPersona.id.toUpperCase()}</Badge>
                            </div>
                            <CardTitle className="text-sm">{userPersona.name}</CardTitle>
                            <CardDescription className="text-xs">{userPersona.description}</CardDescription>
                        </CardHeader>
                    </Card>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Chat persona akan menggunakan persona sesuai dengan role Anda.</p>
                </div>
            )}

            {/* Show message if user doesn't have valid persona */}
            {selectedType === 'persona' && !userPersona && (
                <div>
                    <h3 className="mb-4 text-lg font-semibold">Persona Tidak Tersedia</h3>
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                        <CardHeader>
                            <CardDescription className="text-sm text-red-600 dark:text-red-400">
                                Role Anda ({userRole}) tidak memiliki persona yang sesuai untuk chat persona. Silakan gunakan chat global atau hubungi
                                administrator.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )}

            {/* Action Buttons - positioned at bottom (non-sticky) */}
            <div className="flex justify-end gap-3 border-t pt-4">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Batal
                    </Button>
                )}
                <Button onClick={handleConfirm} disabled={!canConfirm || (selectedType === 'persona' && !userPersona)} className="min-w-[120px]">
                    {selectedType === 'global' ? 'Buat Chat Global' : 'Buat Chat Persona'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default ChatTypeSelector;
