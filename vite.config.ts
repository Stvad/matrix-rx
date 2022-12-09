/// <reference types="vitest" />
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({
        jsxImportSource: '@emotion/react',
        babel: {
            plugins: ['@emotion/babel-plugin'],
        },
    })],
    build: {
        target: 'es2022',
    },
    test: {
        deps: {
            // https://github.com/chakra-ui/chakra-ui/issues/6783
            fallbackCJS: true,
        },
    },
})
