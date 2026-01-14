import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
                'resources/js/script.js',
            ],
            refresh: false,
        }),
        react(),
    ],
    server: {
        watch: {
            ignored: [
                '**/vendor/**',
                '**/app/**',
                '**/bootstrap/**',
                '**/config/**',
                '**/database/**',
                '**/routes/**',
                '**/storage/**',
                '**/tests/**',
                '**/public/**',
            ],
        },
    },
})
