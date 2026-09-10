import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: {
            input: {
                main: 'index.html',
                movie: 'movie.html',
                about: 'about.html',
                admin: 'admin.html',
                copyright: 'copyright.html',
                disclosure: 'disclosure.html',
                editorial: 'editorial.html',
                guides: 'guides.html',
                partner: 'partner.html',
                privacy: 'privacy.html',
                rights: 'rights.html',
                terms: 'terms.html',
                unsubscribe: 'unsubscribe.html',
            },
            maxParallelFileOps: 128,
        },
    },
});
