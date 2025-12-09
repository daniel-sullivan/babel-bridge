import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        css: true,
        setupFiles: ['./src/test-setup.ts'],
    },
    server: {
        host: '0.0.0.0',
        port: parseInt(process.env.VITE_PORT || '5173'),
        watch: {
            usePolling: true,
        },
        proxy: {
            '/api': {
                // Support different API URLs for different test suites
                target: process.env.VITE_API_URL ||
                        (process.env.INTEGRATION_TEST === 'true'
                            ? 'http://localhost:8082'
                            : 'http://localhost:8080'),
                changeOrigin: true,
            },
            '/session': {
                // Support different API URLs for different test suites
                target: process.env.VITE_API_URL ||
                        (process.env.INTEGRATION_TEST === 'true'
                            ? 'http://localhost:8082'
                            : 'http://localhost:8080'),
                changeOrigin: true,
            },
            // remove the '/' proxy entirely in dev
        },
    },
})