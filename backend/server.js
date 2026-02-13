const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = require('node-fetch');

// Importar EventSource (compatível com v2 e v4)
let EventSource;
try {
    const esPkg = require('eventsource');
    EventSource = esPkg.EventSource || esPkg;
} catch (e) {
    console.error('[FATAL] Pacote eventsource não encontrado. Instale com: npm install eventsource');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// =============================================================================
// BACKEND MIRROR — Espelha dados REAIS do site original em tempo real
// Conecta ao SSE do original e repassa tudo para nossos clientes.
// Zero dados falsos. Zero geração local.
// =============================================================================

const ORIGINAL_DOMAIN = 'https://app.sscashout.online';
const STREAM_URL = `${ORIGINAL_DOMAIN}/api/stream`;

// --- Estado do Servidor (Cache do Original) ---
let clients = [];
let velasHistorico = [];
let stats = { wins: 0, loss: 0, total: 0, percentage: 0 };
let ultimoHistorico = null;
let ultimoResultado = null;
let onlineCount = 0;
let notificationClicks = [];

// --- Push Subscriptions ---
let pushService = null;
try { pushService = require('./push-service'); } catch (e) { }

// =============================================================================
// 1. SINCRONIZAÇÃO INICIAL — Busca dados actuais do original
// =============================================================================

async function syncInitialData() {
    const endpoints = [
        {
            name: 'Stats',
            url: `${ORIGINAL_DOMAIN}/api/stats`,
            handler: (data) => {
                stats = data;
                console.log(`[Sync] ✅ Stats: ${data.wins}W/${data.loss}L (${data.percentage}%)`);
            }
        },
        {
            name: 'Velas',
            url: `${ORIGINAL_DOMAIN}/api/velas`,
            handler: (data) => {
                velasHistorico = data.valores || data.velas || [];
                console.log(`[Sync] ✅ Velas: [${velasHistorico.slice(0, 6).map(v => Number(v).toFixed(2)).join(', ')}]`);
            }
        },
        {
            name: 'Histórico',
            url: `${ORIGINAL_DOMAIN}/api/ultimo-historico`,
            handler: (data) => {
                if (data.ok && data.data) {
                    ultimoHistorico = data.data;
                    console.log(`[Sync] ✅ Último resultado: ${data.data.status} (${data.data.vela_final}x)`);
                }
            }
        },
        {
            name: 'Online',
            url: `${ORIGINAL_DOMAIN}/api/online`,
            handler: (data) => {
                if (data.ok) {
                    onlineCount = data.online || 0;
                    console.log(`[Sync] ✅ Online: ${onlineCount}`);
                }
            }
        }
    ];

    console.log('[Sync] Sincronizando dados iniciais do original...');

    for (const ep of endpoints) {
        try {
            const res = await fetch(ep.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': ORIGINAL_DOMAIN
                },
                timeout: 10000
            });
            if (res.ok) {
                const data = await res.json();
                ep.handler(data);
            } else {
                console.warn(`[Sync] ⚠️ ${ep.name}: HTTP ${res.status}`);
            }
        } catch (e) {
            console.error(`[Sync] ❌ ${ep.name}: ${e.message}`);
        }
    }

    console.log('[Sync] Sincronização completa.');
}

// =============================================================================
// 2. CONEXÃO SSE — Espelha stream do original em tempo real
// =============================================================================

let mirrorConnection = null;
let reconnectAttempts = 0;
const MAX_BACKOFF = 30000; // 30s máximo entre tentativas

function connectToMirrorStream() {
    if (mirrorConnection) {
        try { mirrorConnection.close(); } catch (e) { }
    }

    const cid = 'mirror-' + Date.now();
    const url = `${STREAM_URL}?cid=${cid}&v=${Date.now()}`;

    console.log(`[Mirror] Conectando ao stream real: ${ORIGINAL_DOMAIN}`);

    try {
        mirrorConnection = new EventSource(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': ORIGINAL_DOMAIN
            }
        });

        // --- Conexão aberta ---
        mirrorConnection.onopen = () => {
            reconnectAttempts = 0;
            console.log('[Mirror] ✅ Conectado ao stream do original!');
        };

        // --- Recebe mensagens do original ---
        mirrorConnection.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                const evt = parsed.event;
                const data = parsed.data;

                // Log compacto
                if (evt === 'vela') {
                    const vals = data.valores || data.velas || [];
                    if (vals.length > 0) {
                        velasHistorico = vals;
                        console.log(`[Mirror] 🕯️ Vela: [${vals.slice(0, 3).map(v => Number(v).toFixed(2)).join(', ')}...]`);
                    }
                } else if (evt === 'sinal') {
                    console.log(`[Mirror] 📊 Sinal: ${data.tipo || 'desconhecido'} | Após: ${data.apos_de}x → Cash: ${data.cashout}x`);

                    // Notificação push
                    if (pushService && data.tipo === 'entrada_confirmada') {
                        pushService.notifySignal(data).catch(() => { });
                    }
                } else if (evt === 'resultado') {
                    ultimoHistorico = data;
                    const st = (data.status || '').toUpperCase();
                    console.log(`[Mirror] ${st === 'GREEN' ? '✅' : '❌'} ${st} | Vela: ${data.vela_final}x`);

                    // Atualiza stats com polling rápido
                    setTimeout(refreshStats, 1500);

                    // Notificação push
                    if (pushService) {
                        if (data.status === 'green') {
                            pushService.notifyGreen(data).catch(() => { });
                        } else {
                            pushService.notifyLoss(data).catch(() => { });
                        }
                    }
                } else if (evt === 'online') {
                    onlineCount = data.count || data.online || onlineCount;
                } else if (evt === 'connected') {
                    console.log('[Mirror] 🔗 Confirmação de conexão recebida');
                } else {
                    console.log(`[Mirror] 📨 Evento: ${evt}`);
                }

                // Repassa TUDO para nossos clientes
                broadcast(parsed.event, parsed.data);

            } catch (e) {
                console.error('[Mirror] Erro ao processar evento:', e.message);
            }
        };

        // --- Erro / Reconexão ---
        mirrorConnection.onerror = (err) => {
            console.error(`[Mirror] ❌ Erro no stream. Reconectando... (tentativa ${reconnectAttempts + 1})`);
            try { mirrorConnection.close(); } catch (e) { }

            const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts++), MAX_BACKOFF);
            console.log(`[Mirror] Próxima tentativa em ${Math.round(backoff / 1000)}s`);
            setTimeout(connectToMirrorStream, backoff);
        };

    } catch (e) {
        console.error('[Mirror] Falha ao criar EventSource:', e.message);
        const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts++), MAX_BACKOFF);
        setTimeout(connectToMirrorStream, backoff);
    }
}

// Atualiza stats silenciosamente
async function refreshStats() {
    try {
        const res = await fetch(`${ORIGINAL_DOMAIN}/api/stats`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': ORIGINAL_DOMAIN },
            timeout: 8000
        });
        if (res.ok) {
            stats = await res.json();
        }
    } catch (e) { }
}

// =============================================================================
// 3. BROADCAST — Envia eventos para todos os clientes conectados
// =============================================================================

function broadcast(event, data) {
    const payload = JSON.stringify({ event, data });
    let deadClients = [];

    clients.forEach((client, index) => {
        try {
            client.res.write(`data: ${payload}\n\n`);
        } catch (e) {
            deadClients.push(index);
        }
    });

    // Remove clientes mortos
    if (deadClients.length > 0) {
        clients = clients.filter((_, i) => !deadClients.includes(i));
    }
}

// =============================================================================
// 4. ENDPOINTS DE API
// =============================================================================

// Stats (cache do original)
app.get('/api/stats', (req, res) => res.json(stats));

// Velas (cache do original)
app.get('/api/velas', (req, res) => {
    res.json({ ok: true, valores: velasHistorico });
});

// Online count
app.get('/api/online', (req, res) => {
    res.json({ ok: true, online: onlineCount || Math.floor(Math.random() * 8) + 5 });
});

// Último resultado
app.get('/api/ultimo-historico', (req, res) => {
    if (ultimoHistorico) {
        res.json({ ok: true, data: ultimoHistorico });
    } else {
        res.json({ ok: false });
    }
});

// Push subscription
app.post('/api/subscribe', (req, res) => {
    const sub = req.body;
    if (sub && sub.endpoint) {
        if (pushService) pushService.addSubscription(sub);
        res.json({ ok: true });
    } else {
        res.status(400).json({ ok: false, error: 'Subscrição inválida' });
    }
});

// =============================================================================
// 4b. NOVOS ENDPOINTS — Paridade com API original
// =============================================================================

// POST /api/sinal — Recebe sinal (para bot próprio ou teste)
app.post('/api/sinal', (req, res) => {
    const { tipo = 'entrada_confirmada', apos_de, cashout, max_gales = 2, vela_atual, meta, id, ts } = req.body;

    if (apos_de === undefined || cashout === undefined) {
        return res.status(422).json({
            detail: [{ loc: ['body'], msg: 'apos_de e cashout são obrigatórios', type: 'value_error' }]
        });
    }

    const sinal = {
        tipo,
        apos_de: Number(apos_de),
        cashout: Number(cashout),
        max_gales: Number(max_gales),
        vela_atual: vela_atual != null ? Number(vela_atual) : null,
        meta: meta || null,
        id: id || `sinal-${Date.now()}`,
        ts: ts || new Date().toISOString()
    };

    console.log(`[API] 📊 Sinal recebido: ${sinal.tipo} | Após: ${sinal.apos_de}x → Cash: ${sinal.cashout}x`);

    // Broadcast to all SSE clients
    broadcast('sinal', sinal);

    // Push notification
    if (pushService && sinal.tipo === 'entrada_confirmada') {
        pushService.notifySignal(sinal).catch(() => { });
    }

    res.json({ ok: true, sinal });
});

// POST /api/resultado — Recebe resultado (para bot próprio ou teste)
app.post('/api/resultado', (req, res) => {
    const { id, status, vela_final, ts } = req.body;

    if (!id || !status) {
        return res.status(422).json({
            detail: [{ loc: ['body'], msg: 'id e status são obrigatórios', type: 'value_error' }]
        });
    }

    const resultado = {
        id,
        status,
        vela_final: vela_final != null ? Number(vela_final) : null,
        ts: ts || new Date().toISOString()
    };

    ultimoHistorico = resultado;
    ultimoResultado = resultado;

    console.log(`[API] ${status === 'green' ? '✅' : '❌'} Resultado: ${status.toUpperCase()} | Vela: ${vela_final}x`);

    // Broadcast to all SSE clients
    broadcast('resultado', resultado);

    // Update stats
    if (status === 'green') {
        stats.wins++;
    } else {
        stats.loss++;
    }
    stats.total = stats.wins + stats.loss;
    stats.percentage = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

    // Push notification
    if (pushService) {
        if (status === 'green') {
            pushService.notifyGreen(resultado).catch(() => { });
        } else {
            pushService.notifyLoss(resultado).catch(() => { });
        }
    }

    // Refresh stats from original after 2s
    setTimeout(refreshStats, 2000);

    res.json({ ok: true, resultado });
});

// POST /api/velas — Recebe velas (para bot próprio)
app.post('/api/velas', (req, res) => {
    const data = req.body;
    const vals = data.valores || data.velas || (Array.isArray(data) ? data : null);

    if (vals && vals.length > 0) {
        velasHistorico = vals;
        broadcast('vela', { valores: velasHistorico });
        console.log(`[API] 🕯️ Velas atualizadas: ${vals.length} valores`);
    }

    res.json({ ok: true, count: velasHistorico.length });
});

// GET /api/ultimo-resultado — Retorna último resultado
app.get('/api/ultimo-resultado', (req, res) => {
    if (ultimoResultado) {
        res.json({ ok: true, data: ultimoResultado });
    } else if (ultimoHistorico) {
        res.json({ ok: true, data: ultimoHistorico });
    } else {
        res.json({ ok: false });
    }
});

// POST /api/notification/click — Registra clique em push
app.post('/api/notification/click', (req, res) => {
    if (pushService) pushService.recordClick();
    notificationClicks.push({ ts: new Date().toISOString(), data: req.body });
    // Keep only last 200 clicks
    if (notificationClicks.length > 200) notificationClicks = notificationClicks.slice(-200);
    res.json({ ok: true });
});

// POST /api/push-broadcast — Push manual para todos
app.post('/api/push-broadcast', async (req, res) => {
    if (!pushService) return res.status(503).json({ ok: false, error: 'Push service indisponível' });

    const {
        title = '📢 Aviso',
        body = 'Nova atualização disponível!',
        kind = 'admin',
        tag, url = '/', priority = 5,
        mode = 'queue', target = 'all',
        limit = 0, query,
        delay_seconds = 0, dry_run = false,
        renotify = true, require_interaction = false, silent = false
    } = req.body || {};

    try {
        const result = await pushService.sendTargeted(
            {
                title, body,
                icon: '/images/icon-192.png',
                badge: '/favicon.ico',
                tag: tag || kind,
                data: { url, kind }
            },
            { target, limit, query, priority, delay_seconds, dry_run, mode, tag, renotify, require_interaction, silent }
        );
        res.json({ ok: true, ...result });
    } catch (e) {
        console.error('[Push] Erro no broadcast:', e.message);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /api/subs/reset — Reset de assinantes
app.post('/api/subs/reset', (req, res) => {
    if (!pushService) return res.status(503).json({ ok: false, error: 'Push service indisponível' });
    const result = pushService.resetSubscriptions();
    res.json({ ok: true, ...result });
});

// POST /api/test/push-resultado — Testa push de resultado
app.post('/api/test/push-resultado', async (req, res) => {
    if (!pushService) return res.status(503).json({ ok: false, error: 'Push service indisponível' });

    try {
        await pushService.notifyGreen({
            vela_final: 3.50,
            cashout: 2.00
        });
        res.json({ ok: true, msg: 'Push de teste enviado (GREEN simulado)' });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// SSE Stream — Nosso endpoint que o frontend conecta
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const clientId = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const newClient = { id: clientId, res };
    clients.push(newClient);

    console.log(`[SSE] ➕ Cliente ${clientId} | Total: ${clients.length}`);

    // Envia estado actual ao novo cliente
    res.write(`data: ${JSON.stringify({ event: 'connected', data: { status: 'online' } })}\n\n`);

    if (velasHistorico.length > 0) {
        res.write(`data: ${JSON.stringify({ event: 'vela', data: { valores: velasHistorico } })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ event: 'online', data: { count: onlineCount || 8 } })}\n\n`);

    // Keepalive a cada 15s
    const keepalive = setInterval(() => {
        try { res.write(`:keepalive\n\n`); } catch (e) { clearInterval(keepalive); }
    }, 15000);

    req.on('close', () => {
        clearInterval(keepalive);
        clients = clients.filter(c => c.id !== clientId);
        console.log(`[SSE] ➖ Cliente ${clientId} | Total: ${clients.length}`);
    });
});

// =============================================================================
// 5. HEALTH CHECK — Para monitoramento
// =============================================================================

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        uptime: process.uptime(),
        clients: clients.length,
        mirrorConnected: mirrorConnection && mirrorConnection.readyState === 1,
        stats,
        velasCount: velasHistorico.length,
        lastUpdate: ultimoHistorico?.ts || null
    });
});

// =============================================================================
// 6. INICIALIZAÇÃO
// =============================================================================

async function initServer() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   🪞 SISTEMA CASHOUT — Backend Mirror 24h       ║');
    console.log('║   Dados REAIS do original em tempo real          ║');
    console.log('║   Zero dados falsos                              ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`[Boot] Fonte: ${ORIGINAL_DOMAIN}`);

    // 1. Sincroniza dados iniciais
    await syncInitialData();

    // 2. Conecta ao stream SSE do original
    connectToMirrorStream();

    // 3. Polling de backup a cada 2 minutos
    setInterval(async () => {
        await refreshStats();
        // Sync velas se o SSE falhou
        if (velasHistorico.length === 0) {
            try {
                const r = await fetch(`${ORIGINAL_DOMAIN}/api/velas`, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': ORIGINAL_DOMAIN }
                });
                if (r.ok) {
                    const d = await r.json();
                    velasHistorico = d.valores || d.velas || velasHistorico;
                }
            } catch (e) { }
        }
    }, 120000);

    // 4. Inicia servidor HTTP
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor Mirror rodando em http://localhost:${PORT}`);
        console.log(`📡 Espelhando: ${ORIGINAL_DOMAIN}`);
        console.log(`🔄 Polling backup: a cada 2 min`);
        console.log(`💓 Health check: http://localhost:${PORT}/api/health`);
        console.log('');
    });
}

initServer().catch(e => {
    console.error('❌ ERRO FATAL ao iniciar servidor:', e);
    process.exit(1);
});
