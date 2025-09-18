import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

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
    ],
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
