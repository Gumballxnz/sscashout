/**
 * Monitor de Mudanças — Detecta actualizações no site original
 * 
 * Uso:
 *   node monitor-changes.js          → Verifica uma vez
 *   node monitor-changes.js --loop   → Verifica a cada 30 minutos
 * 
 * O que faz:
 *   1. Busca HTML e JS do site original
 *   2. Calcula hash MD5 de cada arquivo
 *   3. Compara com hashes guardados em changes-log.json
 *   4. Se houver mudança, salva cópia nova e regista no log
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ORIGINAL_DOMAIN = 'https://app.sscashout.online';

// Arquivos a monitorar
const MONITOR_FILES = [
    { name: 'index.html', url: `${ORIGINAL_DOMAIN}/` },
    { name: 'app.js', url: `${ORIGINAL_DOMAIN}/app.js?v=${Date.now()}` },
    { name: 'ux.js', url: `${ORIGINAL_DOMAIN}/ux.js?v=${Date.now()}` },
    { name: 'styles.css', url: `${ORIGINAL_DOMAIN}/styles.css?v=${Date.now()}` },
    { name: 'curso-promo.js', url: `${ORIGINAL_DOMAIN}/curso-promo.js?v=${Date.now()}` },
    { name: 'inapp-warn.js', url: `${ORIGINAL_DOMAIN}/inapp-warn.js?v=${Date.now()}` },
    { name: 'protect.min.js', url: `${ORIGINAL_DOMAIN}/protect.min.js` },
    { name: 'sw.js', url: `${ORIGINAL_DOMAIN}/sw.js` },
    { name: 'manifest.json', url: `${ORIGINAL_DOMAIN}/manifest.json?v=4` },
];

const LOG_FILE = path.join(__dirname, 'changes-log.json');
const UPDATES_DIR = path.join(__dirname, 'analise-profunda', 'updates');

// Garante que a pasta de updates existe
if (!fs.existsSync(UPDATES_DIR)) {
    fs.mkdirSync(UPDATES_DIR, { recursive: true });
}

// Carrega log existente
function loadLog() {
    try {
        return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    } catch (e) {
        return { lastCheck: null, hashes: {}, changes: [] };
    }
}

// Salva log
function saveLog(log) {
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), 'utf-8');
}

// Busca conteúdo de URL
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': ORIGINAL_DOMAIN
            }
        }, (res) => {
            // Segue redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });

        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// Calcula hash MD5
function hash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

// Formata data para nome de arquivo
function dateTag() {
    const d = new Date();
    return d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Verifica mudanças
async function checkChanges() {
    const log = loadLog();
    const now = new Date().toISOString();
    let changesFound = 0;

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🔍 Monitor de Mudanças — Site Original     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`[${now}] Verificando ${MONITOR_FILES.length} arquivos...\n`);

    for (const file of MONITOR_FILES) {
        try {
            const content = await fetchUrl(file.url);
            const newHash = hash(content);
            const oldHash = log.hashes[file.name] || null;

            if (oldHash === null) {
                // Primeira vez — registra hash
                log.hashes[file.name] = newHash;
                console.log(`  📝 ${file.name}: Registado pela primeira vez (${newHash.slice(0, 8)})`);
            } else if (oldHash !== newHash) {
                // MUDANÇA DETECTADA!
                changesFound++;
                const savedAs = `${file.name.replace(/\./g, '_')}_${dateTag()}${path.extname(file.name)}`;
                const savedPath = path.join(UPDATES_DIR, savedAs);

                // Salva cópia nova
                fs.writeFileSync(savedPath, content, 'utf-8');

                // Regista no log
                const change = {
                    date: now,
                    file: file.name,
                    oldHash: oldHash.slice(0, 12),
                    newHash: newHash.slice(0, 12),
                    savedAs: `analise-profunda/updates/${savedAs}`,
                    sizeBytes: Buffer.byteLength(content)
                };
                log.changes.push(change);
                log.hashes[file.name] = newHash;

                console.log(`  🚨 ${file.name}: MUDANÇA DETECTADA!`);
                console.log(`     Hash: ${oldHash.slice(0, 12)} → ${newHash.slice(0, 12)}`);
                console.log(`     Salvo em: ${savedAs}`);
            } else {
                console.log(`  ✅ ${file.name}: Sem mudanças (${newHash.slice(0, 8)})`);
            }

        } catch (e) {
            console.log(`  ❌ ${file.name}: Erro — ${e.message}`);
        }
    }

    log.lastCheck = now;
    saveLog(log);

    console.log('');
    if (changesFound > 0) {
        console.log(`⚠️  ${changesFound} mudança(s) detectada(s)! Verifica changes-log.json`);
    } else {
        console.log('✅ Nenhuma mudança detectada.');
    }
    console.log(`📋 Log salvo em: ${LOG_FILE}`);
    console.log('');

    return changesFound;
}

// Modo loop (verifica a cada 30 minutos)
async function loop() {
    const INTERVAL = 30 * 60 * 1000; // 30 minutos

    console.log(`[Monitor] Modo contínuo — verificando a cada 30 minutos`);

    while (true) {
        await checkChanges();
        console.log(`[Monitor] Próxima verificação em 30 minutos...\n`);
        await new Promise(r => setTimeout(r, INTERVAL));
    }
}

// Execução
if (process.argv.includes('--loop')) {
    loop().catch(e => {
        console.error('Erro fatal no loop:', e);
        process.exit(1);
    });
} else {
    checkChanges().catch(e => {
        console.error('Erro:', e);
        process.exit(1);
    });
}
