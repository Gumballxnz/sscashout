/**
 * ANÁLISE PROFUNDA DO SITE ORIGINAL
 * Captura TUDO: código-fonte JS, SSE events, WebSockets, APIs, headers, cookies
 * Preenche o formulário de lead automaticamente e monitora por 2 minutos
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://app.sscashout.online/';
const OUTPUT_DIR = path.join(__dirname, 'analise-profunda');

// Dados para preencher o formulário
const LEAD_NOME = 'João Silva';
const LEAD_WHATSAPP = '841234567';

async function run() {
    console.log('🚀 Iniciando análise profunda...');

    // Cria pasta de saída
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: false, // Visível para ver o que acontece
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--window-size=1360,768'
        ]
    });

    const page = await browser.newPage();

    // Configura viewport e user-agent
    await page.setViewport({ width: 1360, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');

    // === DADOS COLETADOS ===
    const dados = {
        timestamp: new Date().toISOString(),
        url: TARGET_URL,
        // Requisições de rede
        requisicoes: [],
        // Respostas de API com corpo completo
        apiResponses: [],
        // Eventos SSE capturados em tempo real
        sseEvents: [],
        // WebSockets
        webSockets: [],
        // Código-fonte dos scripts
        scripts: {},
        // Headers de resposta
        responseHeaders: {},
        // Cookies
        cookies: [],
        // LocalStorage e SessionStorage
        storage: { local: {}, session: {} },
        // Console logs do site
        consoleLogs: [],
        // Variáveis globais do window
        globalVars: [],
        // Service Workers
        serviceWorkers: [],
        // Erros capturados
        erros: []
    };

    // === 1. INTERCEPTAR TODAS AS REQUISIÇÕES ===
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const url = request.url();
        const method = request.method();
        const headers = request.headers();
        const postData = request.postData();

        dados.requisicoes.push({
            url,
            method,
            resourceType: request.resourceType(),
            headers,
            postData: postData || null,
            timestamp: new Date().toISOString()
        });

        // Log de requisições importantes
        if (url.includes('/api/') || url.includes('stream') || url.includes('placard') ||
            url.includes('spribe') || url.includes('aviator') || url.includes('wss://') ||
            url.includes('websocket') || url.includes('socket')) {
            console.log(`📡 [${method}] ${url.substring(0, 120)}`);
        }

        request.continue();
    });

    // === 2. CAPTURAR TODAS AS RESPOSTAS ===
    page.on('response', async (response) => {
        const url = response.url();
        const status = response.status();
        const contentType = response.headers()['content-type'] || '';

        // Guarda headers de todas as respostas
        dados.responseHeaders[url] = {
            status,
            contentType,
            headers: response.headers()
        };

        // Captura corpo das respostas de API e scripts JS
        try {
            if (url.includes('/api/') ||
                url.includes('stream') ||
                contentType.includes('json') ||
                contentType.includes('event-stream')) {

                const body = await response.text();
                dados.apiResponses.push({
                    url,
                    status,
                    contentType,
                    body: body.substring(0, 50000), // Limita tamanho
                    timestamp: new Date().toISOString()
                });

                console.log(`📥 API Response [${status}]: ${url.substring(0, 100)}`);
                if (contentType.includes('json')) {
                    try {
                        const jsonData = JSON.parse(body);
                        console.log(`   Dados:`, JSON.stringify(jsonData).substring(0, 200));
                    } catch (e) { }
                }
            }

            // Captura código-fonte de TODOS os scripts JS do site
            if ((url.includes('sscashout') || url.includes('app.js') ||
                url.includes('ux.js') || url.includes('protect') ||
                url.includes('inapp') || url.includes('curso')) &&
                (contentType.includes('javascript') || url.endsWith('.js'))) {

                const jsBody = await response.text();
                const fileName = url.split('/').pop().split('?')[0];
                dados.scripts[fileName] = {
                    url,
                    size: jsBody.length,
                    content: jsBody
                };

                // Salva cada script como arquivo separado
                const scriptPath = path.join(OUTPUT_DIR, `script_${fileName}`);
                fs.writeFileSync(scriptPath, jsBody);
                console.log(`💾 Script salvo: ${fileName} (${jsBody.length} bytes)`);
            }
        } catch (e) {
            // Ignora erros de corpo (ex: redirects)
        }
    });

    // === 3. CAPTURAR CONSOLE LOGS DO SITE ===
    page.on('console', (msg) => {
        const text = msg.text();
        dados.consoleLogs.push({
            type: msg.type(),
            text: text.substring(0, 500),
            timestamp: new Date().toISOString()
        });

        // Mostra logs interessantes
        if (text.includes('Mirror') || text.includes('vela') || text.includes('sinal') ||
            text.includes('stream') || text.includes('push') || text.includes('SSE') ||
            text.includes('connected') || text.includes('event') || text.includes('Stats') ||
            text.includes('Error') || text.includes('green') || text.includes('loss')) {
            console.log(`🖥️  Console [${msg.type()}]: ${text.substring(0, 200)}`);
        }
    });

    // === 4. CAPTURAR ERROS ===
    page.on('pageerror', (error) => {
        dados.erros.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        console.log(`❌ Erro na página: ${error.message.substring(0, 150)}`);
    });

    // === 5. MONITORAR WebSockets via CDP ===
    const cdpSession = await page.target().createCDPSession();

    await cdpSession.send('Network.enable');

    // Captura WebSocket frames
    cdpSession.on('Network.webSocketCreated', (params) => {
        console.log(`🔌 WebSocket CRIADO: ${params.url}`);
        dados.webSockets.push({
            event: 'created',
            url: params.url,
            timestamp: new Date().toISOString()
        });
    });

    cdpSession.on('Network.webSocketFrameReceived', (params) => {
        const payload = params.response?.payloadData || '';
        dados.webSockets.push({
            event: 'received',
            requestId: params.requestId,
            payload: payload.substring(0, 5000),
            timestamp: new Date().toISOString()
        });
        console.log(`🔌 WS Recebido: ${payload.substring(0, 150)}`);
    });

    cdpSession.on('Network.webSocketFrameSent', (params) => {
        const payload = params.response?.payloadData || '';
        dados.webSockets.push({
            event: 'sent',
            requestId: params.requestId,
            payload: payload.substring(0, 5000),
            timestamp: new Date().toISOString()
        });
        console.log(`🔌 WS Enviado: ${payload.substring(0, 150)}`);
    });

    // Captura EventSource (SSE) via CDP
    cdpSession.on('Network.eventSourceMessageReceived', (params) => {
        dados.sseEvents.push({
            requestId: params.requestId,
            eventName: params.eventName,
            eventId: params.eventId,
            data: params.data?.substring(0, 5000),
            timestamp: new Date().toISOString()
        });
        console.log(`📡 SSE Event [${params.eventName || 'message'}]: ${(params.data || '').substring(0, 200)}`);
    });

    // === 6. NAVEGAR PARA O SITE ===
    console.log('\n🌐 Abrindo site original...');
    try {
        await page.goto(TARGET_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
    } catch (e) {
        console.log('⚠️ Timeout no carregamento (normal por causa do SSE). Continuando...');
    }

    console.log('✅ Página carregada!');

    // Aguarda DOM estabilizar
    await new Promise(r => setTimeout(r, 3000));

    // === 7. PREENCHER FORMULÁRIO DE LEAD ===
    console.log('\n📝 Preenchendo formulário de acesso...');
    try {
        // Tenta diferentes seletores possíveis
        const nomeInputs = ['#leadNome', 'input[name="nome"]', 'input[placeholder*="nome" i]', 'input[type="text"]'];
        const whatsInputs = ['#leadWhatsapp', 'input[name="whatsapp"]', 'input[placeholder*="whatsapp" i]', 'input[placeholder*="telefone" i]', 'input[type="tel"]'];

        let nomePreenchido = false;
        for (const sel of nomeInputs) {
            try {
                await page.waitForSelector(sel, { timeout: 3000 });
                await page.click(sel, { clickCount: 3 }); // Seleciona tudo
                await page.type(sel, LEAD_NOME, { delay: 80 });
                console.log(`   ✅ Nome preenchido via ${sel}`);
                nomePreenchido = true;
                break;
            } catch (e) { }
        }

        let whatsPreenchido = false;
        for (const sel of whatsInputs) {
            try {
                await page.waitForSelector(sel, { timeout: 3000 });
                await page.click(sel, { clickCount: 3 });
                await page.type(sel, LEAD_WHATSAPP, { delay: 80 });
                console.log(`   ✅ WhatsApp preenchido via ${sel}`);
                whatsPreenchido = true;
                break;
            } catch (e) { }
        }

        if (nomePreenchido && whatsPreenchido) {
            // Clica no botão de submit
            const submitSelectors = [
                '#leadForm button[type="submit"]',
                'button[type="submit"]',
                'form button',
                '.btn-submit',
                'input[type="submit"]'
            ];

            for (const sel of submitSelectors) {
                try {
                    await page.click(sel);
                    console.log(`   ✅ Formulário enviado via ${sel}`);
                    break;
                } catch (e) { }
            }
        } else {
            console.log('   ⚠️ Formulário não encontrado completamente. Talvez já esteja logado.');
        }
    } catch (e) {
        console.log(`   ⚠️ Erro no formulário: ${e.message}`);
    }

    // Aguarda transição pós-login
    await new Promise(r => setTimeout(r, 5000));

    // === 8. SCREENSHOT PÓS-LOGIN ===
    const screenshotPath = path.join(OUTPUT_DIR, 'screenshot_pos_login.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot salvo: ${screenshotPath}`);

    // === 9. EXTRAIR VARIÁVEIS GLOBAIS E CÓDIGO DO SITE ===
    console.log('\n🔬 Extraindo variáveis globais e código...');

    const siteData = await page.evaluate(() => {
        const result = {
            localStorage: {},
            sessionStorage: {},
            globalVars: [],
            serviceWorkerScope: null,
            vapidKey: null,
            domData: {},
            inlineScripts: [],
            metaTags: [],
            allFetchURLsInCode: []
        };

        // LocalStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            result.localStorage[key] = localStorage.getItem(key);
        }

        // SessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            result.sessionStorage[key] = sessionStorage.getItem(key);
        }

        // Variáveis globais pertinentes
        const defaultKeys = new Set(Object.getOwnPropertyNames(window.__proto__));
        const customKeys = Object.keys(window).filter(k => !defaultKeys.has(k));

        customKeys.forEach(key => {
            try {
                const val = window[key];
                const tipo = typeof val;
                if (tipo === 'function') {
                    result.globalVars.push({ key, type: 'function', value: val.toString().substring(0, 300) });
                } else if (tipo === 'object' && val !== null) {
                    result.globalVars.push({ key, type: 'object', value: JSON.stringify(val).substring(0, 500) });
                } else if (tipo === 'string' || tipo === 'number' || tipo === 'boolean') {
                    result.globalVars.push({ key, type: tipo, value: val });
                }
            } catch (e) { }
        });

        // Meta tags
        document.querySelectorAll('meta').forEach(m => {
            result.metaTags.push({
                name: m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv'),
                content: m.getAttribute('content')
            });
        });

        // Scripts inline
        document.querySelectorAll('script:not([src])').forEach(s => {
            if (s.textContent.trim().length > 0) {
                result.inlineScripts.push(s.textContent.substring(0, 10000));
            }
        });

        // Dados visíveis no DOM (stats, velas, etc.)
        result.domData = {
            title: document.title,
            statsElements: {},
            velasElements: []
        };

        // Captura texto de elementos com classes/ids de stats
        const statsSelectors = [
            '#wins', '#loss', '#total', '#percentage', '#taxa',
            '.wins', '.loss', '.total', '.percentage', '.taxa',
            '[class*="vitoria"]', '[class*="derrota"]', '[class*="acerto"]',
            '[class*="stat"]', '[class*="pill"]'
        ];

        statsSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                result.domData.statsElements[sel] = el.textContent.trim().substring(0, 100);
            }
        });

        // Captura velas visíveis
        document.querySelectorAll('[class*="vela"], [class*="pill"], [class*="candle"]').forEach(el => {
            result.domData.velasElements.push(el.textContent.trim().substring(0, 50));
        });

        return result;
    });

    dados.storage = { local: siteData.localStorage, session: siteData.sessionStorage };
    dados.globalVars = siteData.globalVars;
    dados.domData = siteData.domData;
    dados.inlineScripts = siteData.inlineScripts;
    dados.metaTags = siteData.metaTags;

    console.log(`   📦 LocalStorage: ${Object.keys(siteData.localStorage).length} chaves`);
    console.log(`   📦 SessionStorage: ${Object.keys(siteData.sessionStorage).length} chaves`);
    console.log(`   🔑 Variáveis globais: ${siteData.globalVars.length}`);
    console.log(`   📝 Scripts inline: ${siteData.inlineScripts.length}`);

    // Mostra variáveis globais interessantes
    siteData.globalVars.forEach(v => {
        if (v.key.length > 2 && !v.key.startsWith('_') && !v.key.startsWith('webkit')) {
            console.log(`   🔹 window.${v.key} (${v.type}): ${String(v.value).substring(0, 100)}`);
        }
    });

    // === 10. MONITORAR SSE EM TEMPO REAL POR 2 MINUTOS ===
    console.log('\n⏳ Monitorando eventos SSE em tempo real por 120 segundos...');
    console.log('   (Velas, sinais, resultados serão capturados automaticamente)');

    // Injeta monitor de SSE no browser
    await page.evaluate(() => {
        // Intercepta a classe EventSource para capturar TODOS os eventos
        const OrigES = window.EventSource;
        window._sseLog = [];

        window.EventSource = function (url, config) {
            console.log('[INTERCEPTOR] Nova conexão EventSource: ' + url);
            const es = new OrigES(url, config);

            es.addEventListener('message', (e) => {
                window._sseLog.push({
                    type: 'message',
                    data: e.data,
                    timestamp: new Date().toISOString()
                });
            });

            // Escuta eventos nomeados comuns
            ['vela', 'sinal', 'resultado', 'online', 'connected', 'stats', 'reset', 'ping'].forEach(evName => {
                es.addEventListener(evName, (e) => {
                    window._sseLog.push({
                        type: evName,
                        data: e.data,
                        timestamp: new Date().toISOString()
                    });
                });
            });

            return es;
        };
    });

    // Espera 120 segundos capturando tudo
    for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const elapsed = (i + 1) * 5;

        // Coleta SSE logs do browser
        const newSSELogs = await page.evaluate(() => {
            const logs = window._sseLog || [];
            window._sseLog = [];
            return logs;
        });

        if (newSSELogs.length > 0) {
            dados.sseEvents.push(...newSSELogs);
            newSSELogs.forEach(log => {
                console.log(`   📡 [${elapsed}s] SSE ${log.type}: ${(log.data || '').substring(0, 200)}`);
            });
        }

        // Captura cookies atualizados
        const cookies = await page.cookies();
        dados.cookies = cookies;

        // Re-extrai storage (pode ter mudado)
        const updatedStorage = await page.evaluate(() => {
            const ls = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                ls[key] = localStorage.getItem(key);
            }
            return ls;
        });
        dados.storage.local = updatedStorage;

        if (elapsed % 30 === 0) {
            console.log(`   ⏱️  ${elapsed}s decorridos... SSE total: ${dados.sseEvents.length} eventos`);

            // Screenshot periódico
            const periodScreenshot = path.join(OUTPUT_DIR, `screenshot_${elapsed}s.png`);
            await page.screenshot({ path: periodScreenshot, fullPage: true });
        }
    }

    // === 11. EXTRAÇÃO FINAL ===
    console.log('\n📊 Extração final...');

    // DOM final
    const finalDOM = await page.evaluate(() => {
        return {
            fullHTML: document.documentElement.outerHTML.substring(0, 100000),
            bodyText: document.body.innerText.substring(0, 10000)
        };
    });

    // Salva HTML completo
    fs.writeFileSync(path.join(OUTPUT_DIR, 'pagina_completa.html'), finalDOM.fullHTML);
    console.log('💾 HTML completo salvo.');

    // Screenshot final
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'screenshot_final.png'), fullPage: true });

    // === 12. SALVAR RELATÓRIO COMPLETO ===
    const reportPath = path.join(OUTPUT_DIR, `relatorio_profundo_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(dados, null, 2));
    console.log(`\n💾 Relatório salvo em: ${reportPath}`);

    // === 13. RESUMO ===
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMO DA ANÁLISE PROFUNDA');
    console.log('='.repeat(60));
    console.log(`Total requisições: ${dados.requisicoes.length}`);
    console.log(`Respostas API capturadas: ${dados.apiResponses.length}`);
    console.log(`Eventos SSE capturados: ${dados.sseEvents.length}`);
    console.log(`WebSockets detectados: ${dados.webSockets.length}`);
    console.log(`Scripts JS capturados: ${Object.keys(dados.scripts).length}`);
    console.log(`Console logs: ${dados.consoleLogs.length}`);
    console.log(`Cookies: ${dados.cookies.length}`);
    console.log(`Erros: ${dados.erros.length}`);
    console.log(`Variáveis globais: ${dados.globalVars.length}`);

    // Lista todas as URLs únicas chamadas pelo site
    const urlsUnicas = [...new Set(dados.requisicoes.map(r => {
        try {
            const u = new URL(r.url);
            return u.origin + u.pathname;
        } catch (e) {
            return r.url;
        }
    }))].filter(u => !u.includes('google') && !u.includes('facebook') && !u.includes('youtube'));

    console.log(`\n🔗 URLs ÚNICAS DO SITE (excl. trackers):`);
    urlsUnicas.forEach(u => console.log(`   ${u}`));

    console.log('\n' + '='.repeat(60));

    await browser.close();
    console.log('\n✅ Análise profunda concluída!');
    console.log(`📂 Todos os arquivos estão em: ${OUTPUT_DIR}`);
}

run().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
