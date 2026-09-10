import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const staticFiles=['manifest.webmanifest','sw.js','robots.txt','ads.txt','sitemap.xml','cinedesi-icon.svg','cinedesi-maskable.svg','tamasha-season-5.svg'];

export default defineConfig({
    base: './',
    plugins:[{
        name:'cinedesi-static-assets',
        transformIndexHtml(html,ctx){
            const file=ctx?.filename||'';
            const tags:any[]=[{tag:'script',attrs:{type:'module',src:'./src/sw-refresh.ts'},injectTo:'body'}];
            if(file.endsWith('movie.html')) tags.push({tag:'script',attrs:{type:'module',src:'./src/movie-enhancements.ts'},injectTo:'body'});
            if(file.endsWith('index.html')) tags.push({tag:'script',attrs:{type:'module',src:'./src/enhancements.ts'},injectTo:'body'});
            return {html,tags};
        },
        closeBundle(){
            const outDir=resolve(process.cwd(),process.env.APPDEPLOY_VITE_OUT_DIR||'dist');
            if(!existsSync(outDir)) mkdirSync(outDir,{recursive:true});
            for(const file of staticFiles){
                const source=resolve(process.cwd(),file);
                if(existsSync(source)) copyFileSync(source,resolve(outDir,file));
            }
            const launch=resolve(process.cwd(),'cinedesi-launch-iphone13-v2.png');
            if(existsSync(launch)) copyFileSync(launch,resolve(outDir,'cinedesi-launch-iphone13-v2.png'));
        },
    }],
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
