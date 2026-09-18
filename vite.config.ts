import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    publicDir: 'static',
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: {
            input: {
                main: 'index.html',
                catalog: 'catalog.html',
                movie: 'movie.html',
                about: 'about.html',
                admin: 'admin.html',
                copyright: 'copyright.html',
                contact: 'contact.html',
                bollywood: 'bollywood.html',
                hollywood: 'hollywood.html',
                pakistani: 'pakistani.html',
                southIndian: 'south-indian.html',
                turkish: 'turkish.html',
                cartoons: 'cartoons.html',
                disclosure: 'disclosure.html',
                editorial: 'editorial.html',
                guides: 'guides.html',
                licensing: 'licensing.html',
                mediaKit: 'media-kit.html',
                watchOnCinedesi: 'watch-on-cinedesi.html',
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
