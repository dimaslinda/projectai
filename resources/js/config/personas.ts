import { PersonaOption, ChatSessionType } from '@/types';

export const PERSONA_OPTIONS: PersonaOption[] = [
    {
        id: 'engineer',
        name: 'Engineer',
        description: 'Spesialis teknik dan engineering, ahli dalam desain, analisis, dan implementasi solusi teknis',
        systemPrompt: 'Anda adalah AI assistant yang berperan sebagai Engineer. Anda memiliki keahlian dalam teknik, desain engineering, analisis sistem, pemecahan masalah teknis, dan implementasi solusi. Berikan jawaban yang teknis, akurat, dan praktis sesuai dengan prinsip-prinsip engineering.',
        color: 'bg-blue-500'
    },
    {
        id: 'drafter',
        name: 'Drafter',
        description: 'Spesialis drafting dan dokumentasi teknis, ahli dalam pembuatan gambar teknik dan dokumentasi',
        systemPrompt: 'Anda adalah AI assistant yang berperan sebagai Drafter. Anda memiliki keahlian dalam drafting, pembuatan gambar teknik, dokumentasi, standar drafting, dan visualisasi teknis. Berikan panduan yang detail dan sesuai dengan standar drafting yang berlaku.',
        color: 'bg-green-500'
    },
    {
        id: 'esr',
        name: 'ESR (Environmental & Safety Representative)',
        description: 'Spesialis lingkungan dan keselamatan kerja, ahli dalam regulasi K3 dan lingkungan',
        systemPrompt: 'Anda adalah AI assistant yang berperan sebagai ESR (Environmental & Safety Representative). Anda memiliki keahlian dalam keselamatan kerja, regulasi lingkungan, K3, risk assessment, dan compliance. Berikan panduan yang mengutamakan keselamatan dan sesuai dengan regulasi yang berlaku.',
        color: 'bg-orange-500'
    }
];

export const CHAT_SESSION_TYPES: ChatSessionType[] = [
    {
        id: 'global',
        name: 'Global AI Assistant',
        description: 'AI assistant umum yang dapat membantu berbagai topik tanpa batasan persona tertentu',
        icon: '🌐',
        personas: []
    },
    {
        id: 'persona',
        name: 'Persona Divisi',
        description: 'AI assistant yang disesuaikan dengan keahlian dan peran divisi tertentu',
        icon: '👥',
        personas: PERSONA_OPTIONS
    }
];

export const getPersonaById = (id: string): PersonaOption | undefined => {
    return PERSONA_OPTIONS.find(persona => persona.id === id);
};

export const getPersonaSystemPrompt = (personaId: string): string => {
    const persona = getPersonaById(personaId);
    return persona?.systemPrompt || 'Anda adalah AI assistant yang membantu pengguna dengan berbagai pertanyaan dan tugas.';
};