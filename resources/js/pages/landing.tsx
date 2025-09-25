import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Code, FileText, Globe, MessageSquare, Shield, Sparkles, Users } from 'lucide-react';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
    const heroRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const personasRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Set initial styles to prevent flash
        gsap.set([heroRef.current, navRef.current], { opacity: 0 });

        const ctx = gsap.context(() => {
            // Hero Animation with stagger for child elements
            const heroTimeline = gsap.timeline();

            heroTimeline.fromTo(heroRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }).fromTo(
                heroRef.current?.querySelectorAll('.hero-element') || [],
                { opacity: 0, y: 30, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'back.out(1.2)',
                },
                '-=0.6',
            );

            // Navigation Animation
            gsap.fromTo(navRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });

            // Stats Animation
            gsap.fromTo(
                statsRef.current?.children || [],
                { opacity: 0, y: 30, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'back.out(1.7)',
                    scrollTrigger: {
                        trigger: statsRef.current,
                        start: 'top 80%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none reverse',
                    },
                },
            );

            // Features Animation
            gsap.fromTo(
                featuresRef.current?.querySelectorAll('.feature-card') || [],
                { opacity: 0, y: 50, rotationX: 15 },
                {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: featuresRef.current,
                        start: 'top 70%',
                        end: 'bottom 30%',
                        toggleActions: 'play none none reverse',
                    },
                },
            );

            // Personas Animation
            gsap.fromTo(
                personasRef.current?.querySelectorAll('.persona-card') || [],
                { opacity: 0, scale: 0.8, rotation: 5 },
                {
                    opacity: 1,
                    scale: 1,
                    rotation: 0,
                    duration: 0.7,
                    stagger: 0.1,
                    ease: 'elastic.out(1, 0.5)',
                    scrollTrigger: {
                        trigger: personasRef.current,
                        start: 'top 75%',
                        end: 'bottom 25%',
                        toggleActions: 'play none none reverse',
                    },
                },
            );

            // Footer Animation
            gsap.fromTo(
                footerRef.current,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: footerRef.current,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                    },
                },
            );

            // Floating elements animation with better performance
            gsap.to('.floating-icon', {
                y: -10,
                duration: 2,
                ease: 'power2.inOut',
                yoyo: true,
                repeat: -1,
                stagger: 0.2,
                force3D: true, // Hardware acceleration
            });

            // Add smooth scroll behavior
            gsap.registerPlugin(ScrollTrigger);
            ScrollTrigger.config({
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
            });
        });

        return () => ctx.revert();
    }, []);

    const features = [
        {
            icon: () => <img src="/asset/img/Icon.png" alt="AI" className="h-6 w-6" />,
            title: 'AI Multi-Persona',
            description: 'Berinteraksi dengan berbagai persona AI yang disesuaikan untuk kebutuhan spesifik Anda',
            color: 'text-blue-600 dark:text-blue-400',
        },
        {
            icon: Code,
            title: 'Engineering Assistant',
            description: 'Bantuan coding, debugging, dan solusi teknis dari AI yang memahami engineering',
            color: 'text-green-600 dark:text-green-400',
        },
        {
            icon: FileText,
            title: 'Document Drafting',
            description: 'Buat dokumen profesional, proposal, dan laporan dengan bantuan AI',
            color: 'text-purple-600 dark:text-purple-400',
        },
        {
            icon: Shield,
            title: 'ESR Support',
            description: 'Dukungan khusus untuk Environmental & Social Responsibility',
            color: 'text-orange-600 dark:text-orange-400',
        },
        {
            icon: MessageSquare,
            title: 'Smart Chat History',
            description: 'Riwayat percakapan yang terorganisir dan mudah dicari',
            color: 'text-indigo-600 dark:text-indigo-400',
        },
        {
            icon: Users,
            title: 'Role-Based Access',
            description: 'Kontrol akses berdasarkan peran untuk keamanan dan efisiensi',
            color: 'text-red-600 dark:text-red-400',
        },
    ];

    const personas = [
        {
            icon: Globe,
            name: 'Global Assistant',
            description: 'Asisten AI umum untuk berbagai keperluan',
            bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
        },
        {
            icon: Code,
            name: 'Engineering Expert',
            description: 'Spesialis dalam pengembangan dan solusi teknis',
            bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
        },
        {
            icon: FileText,
            name: 'Document Drafter',
            description: 'Ahli dalam pembuatan dokumen profesional',
            bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
        },
        {
            icon: Shield,
            name: 'ESR Specialist',
            description: 'Fokus pada Environmental & Social Responsibility',
            bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
        },
    ];

    const stats = [
        { label: 'Active Users', value: '1,000+' },
        { label: 'Chat Sessions', value: '10,000+' },
        { label: 'AI Responses', value: '50,000+' },
        { label: 'Uptime', value: '99.9%' },
    ];

    return (
        <>
            <Head title="Gradient">
                <meta
                    name="description"
                    content="Tingkatkan produktivitas dengan AI multi-persona yang disesuaikan untuk engineering, document drafting, ESR, dan berbagai kebutuhan profesional lainnya."
                />
                <meta name="keywords" content="AI Assistant, Multi-Persona AI, Engineering AI, Document Drafting, ESR, Productivity, ProjectAI" />
                <meta property="og:title" content="Gradient" />
                <meta
                    property="og:description"
                    content="Tingkatkan produktivitas dengan AI multi-persona yang disesuaikan untuk engineering, document drafting, ESR, dan berbagai kebutuhan profesional lainnya."
                />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Gradient" />
                <meta
                    name="twitter:description"
                    content="Tingkatkan produktivitas dengan AI multi-persona yang disesuaikan untuk engineering, document drafting, ESR, dan berbagai kebutuhan profesional lainnya."
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Navigation */}
                <nav ref={navRef} className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <img src="/asset/img/Horizontal.png" className="w-32" alt="Logo Gradient" />
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link href="/login" className="cursor-pointer">
                                    <Button variant="ghost">Login</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section ref={heroRef} className="relative py-20 lg:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <Badge className="hero-element mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Sparkles className="mr-1 h-4 w-4" />
                                Powered by Advanced AI
                            </Badge>
                            <h1 className="hero-element mb-6 text-4xl font-bold text-slate-900 md:text-6xl dark:text-white">
                                AI Assistant untuk
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Setiap Kebutuhan</span>
                            </h1>
                            <p className="hero-element mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300">
                                Tingkatkan produktivitas dengan AI multi-persona yang disesuaikan untuk engineering, document drafting, ESR, dan
                                berbagai kebutuhan profesional lainnya.
                            </p>
                            <div className="hero-element flex justify-center">
                                <Link href="/login">
                                    <Button size="lg" variant="outline">
                                        Login ke Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-20 left-10 opacity-20">
                        <img src="/asset/img/Icon.png" alt="AI" className="floating-icon h-16 w-16" />
                    </div>
                    <div className="absolute top-40 right-10 opacity-20">
                        <Code className="floating-icon h-12 w-12 text-green-500" />
                    </div>
                    <div className="absolute bottom-20 left-20 opacity-20">
                        <FileText className="floating-icon h-14 w-14 text-purple-500" />
                    </div>
                </section>

                {/* Stats Section */}
                <section className="bg-white/50 py-16 dark:bg-slate-800/50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div ref={statsRef} className="grid grid-cols-2 gap-8 md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                                    <div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section ref={featuresRef} className="py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">Fitur Unggulan</h2>
                            <p className="mx-auto max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                                Solusi AI komprehensif yang dirancang untuk meningkatkan efisiensi kerja Anda
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <Card
                                    key={index}
                                    className="feature-card border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <CardHeader>
                                        <div
                                            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800`}
                                        >
                                            <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                        </div>
                                        <CardTitle className="text-slate-900 dark:text-white">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-slate-600 dark:text-slate-300">{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Personas Section */}
                <section ref={personasRef} className="bg-gradient-to-r from-blue-50 to-purple-50 py-20 dark:from-slate-800 dark:to-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">AI Personas</h2>
                            <p className="mx-auto max-w-2xl text-xl text-slate-600 dark:text-slate-300">
                                Pilih persona AI yang sesuai dengan kebutuhan spesifik Anda
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {personas.map((persona, index) => (
                                <Card key={index} className={`persona-card border-0 ${persona.bgColor} transition-all duration-300 hover:scale-105`}>
                                    <CardHeader className="text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg dark:bg-slate-800">
                                            <persona.icon className="h-8 w-8 text-slate-700 dark:text-slate-300" />
                                        </div>
                                        <CardTitle className="text-slate-900 dark:text-white">{persona.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-center text-slate-600 dark:text-slate-300">
                                            {persona.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer ref={footerRef} className="bg-slate-900 py-12 text-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid gap-8 md:grid-cols-4">
                            <div>
                                <div className="mb-4 flex items-center space-x-2">
                                    <img src="/asset/img/Horizontal.png" className="w-32" alt="Logo Gradient" />
                                </div>
                                <p className="text-slate-400">AI Assistant terdepan untuk meningkatkan produktivitas dan efisiensi kerja Anda.</p>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Produk</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            AI Chat
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Personas
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Dashboard
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Perusahaan</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Tentang Kami
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Karir
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Kontak
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="mb-4 font-semibold">Dukungan</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Dokumentasi
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            FAQ
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="transition-colors hover:text-white">
                                            Support
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-8 border-t border-slate-800 pt-8 text-center text-slate-400">
                            <p>&copy; 2024 ProjectAI. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
