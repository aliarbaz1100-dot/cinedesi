import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    publicDir: 'static',
    // Local CI binds cinedesi.online to 127.0.0.1, never the public site.
    preview: { allowedHosts: ['cinedesi.online'] },
    build: {
        // The released app, not just QA, must parse on Safari 12 (iPhone 6).
        target: 'safari12',
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
                licensing: 'licensing.html',
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
