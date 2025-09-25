import { ChatSessionType, PersonaOption } from '@/types';

export const PERSONA_OPTIONS: PersonaOption[] = [
    {
        id: 'engineer',
        name: 'Engineer',
        description: 'Spesialis teknik dan engineering, ahli dalam desain, analisis, dan implementasi solusi teknis',
        systemPrompt:
            'Anda adalah AI assistant yang berperan sebagai Engineer. Anda memiliki keahlian dalam teknik, desain engineering, analisis sistem, pemecahan masalah teknis, dan implementasi solusi. Berikan jawaban yang teknis, akurat, dan praktis sesuai dengan prinsip-prinsip engineering.',
        color: 'bg-blue-500',
    },
    {
        id: 'drafter',
        name: 'Drafter',
        description: 'Spesialis drafting dan dokumentasi teknis, ahli dalam pembuatan gambar teknik dan dokumentasi',
        systemPrompt:
            'Anda adalah AI assistant yang berperan sebagai Drafter. Anda memiliki keahlian dalam drafting, pembuatan gambar teknik, dokumentasi, standar drafting, dan visualisasi teknis. Berikan panduan yang detail dan sesuai dengan standar drafting yang berlaku.',
        color: 'bg-green-500',
    },
    {
        id: 'esr',
        name: 'ESR (Tower Survey Specialist)',
        description: 'Spesialis survey tower telekomunikasi, ahli dalam analisis gambar survey lapangan dan identifikasi struktur tower',
        systemPrompt:
            'Anda adalah AI assistant yang berperan sebagai ESR (Tower Survey Specialist). Anda memiliki keahlian khusus dalam analisis gambar survey tower telekomunikasi, identifikasi tampilan depan/samping/belakang tower, analisis kondisi struktur, evaluasi antenna dan equipment, serta dokumentasi survey lapangan. Ketika menganalisis gambar tower, berikan detail tentang: 1) Orientasi/sudut pandang (depan/samping/belakang), 2) Kondisi struktur tower, 3) Jenis dan posisi antenna, 4) Equipment yang terpasang, 5) Kondisi lingkungan sekitar, 6) Potensi masalah atau rekomendasi. Berikan analisis yang detail, akurat, dan terstruktur.',
        color: 'bg-orange-500',
    },
];

export const CHAT_SESSION_TYPES: ChatSessionType[] = [
    {
        id: 'global',
        name: 'Global AI Assistant',
        description: 'AI assistant umum yang dapat membantu berbagai topik tanpa batasan persona tertentu',
        icon: '🌐',
        personas: [],
    },
    {
        id: 'persona',
        name: 'Persona Divisi',
        description: 'AI assistant yang disesuaikan dengan keahlian dan peran divisi tertentu',
        icon: '👥',
        personas: PERSONA_OPTIONS,
    },
];

export const getPersonaById = (id: string): PersonaOption | undefined => {
    return PERSONA_OPTIONS.find((persona) => persona.id === id);
};

export const getPersonaSystemPrompt = (personaId: string): string => {
    const persona = getPersonaById(personaId);
    return persona?.systemPrompt || 'Anda adalah AI assistant yang membantu pengguna dengan berbagai pertanyaan dan tugas.';
};
