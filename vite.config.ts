import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        mkcert({
            hosts: ['projectai.test', 'localhost'],
        }),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: { enabled: true },
            includeAssets: ['logo.svg', 'robots.txt', 'apple-touch-icon.png', 'favicon.ico'],
            manifest: {
                name: 'ProjectAI',
                short_name: 'ProjectAI',
                description: 'Chat & AI assistant',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                background_color: '#0B0F1A',
                theme_color: '#0EA5E9',
                id: 'com.projectai.app',
                categories: ['productivity', 'utilities'],
                icons: [
                    { src: '/logo.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
                    { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
                    { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
                ],
            },
            workbox: {
                navigateFallback: '/offline.html',
                runtimeCaching: [
                    {
                        urlPattern: ({ request }) => request.destination === 'image',
                        handler: 'CacheFirst',
                        options: { cacheName: 'images', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
                    },
                    {
                        urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'font',
                        handler: 'StaleWhileRevalidate',
                        options: { cacheName: 'assets' },
                    },
                    {
                        // Avoid caching API and streaming endpoints
                        urlPattern: ({ url }) => url.pathname.startsWith('/api') || url.pathname.includes('/stream'),
                        handler: 'NetworkOnly',
                        options: { cacheName: 'api' },
                    },
                ],
            },
        }),
    ],
    server: {
        host: 'projectai.test',
        port: 5176,
        cors: true,
        strictPort: false,
        hmr: {
            host: 'projectai.test',
            protocol: 'wss',
            port: 5176,
        },
        origin: 'https://projectai.test:5176',
    },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor libraries into their own chunks
                    vendor: ['react', 'react-dom'],
                    ui: ['lucide-react', '@radix-ui/react-slot'],
                    inertia: ['@inertiajs/react'],
                },
            },
        },
    },
});
