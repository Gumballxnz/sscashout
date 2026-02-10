const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// --- Estado do Servidor ---
let stats = {
    wins: 91,
    loss: 20,
    total: 111,
    percentage: 82.0
};

// Histórico inicial (baseado no screenshot real)
let velasHistorico = [1.57, 4.50, 1.20, 3.40, 2.10, 1.90, 3.36, 1.82, 1.09, 1.73];

let clients = [];

function broadcast(event, data) {
    const payload = JSON.stringify({ event, data });
    clients.forEach(client => {
        try {
            client.res.write(`data: ${payload}\n\n`);
        } catch (e) { }
    });
}

// --- Endpoints de API ---

app.get('/api/stats', (req, res) => res.json(stats));
app.get('/api/velas', (req, res) => {
    // Retorna as velas na ordem cronológica (antiga -> nova)
    // O app.js do clone inverte elas conforme a necessidade
    res.json({ valores: velasHistorico });
});

app.get('/api/online', (req, res) => res.json({ ok: true, online: Math.floor(Math.random() * 5) + 8 }));

app.get('/api/ultimo-historico', (req, res) => {
    res.json({
        ok: true,
        data: {
            ts: new Date().toISOString(),
            status: 'green',
            apos_de: 2.36,
            cashout: 2.00,
            vela_final: 11.47
        }
    });
});

app.post('/api/subscribe', (req, res) => res.json({ ok: true }));

// SSE Endpoint (Stream de Eventos)
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    // Conexão imediata
    res.write(`retry: 3000\n`);
    res.write(`data: ${JSON.stringify({ event: 'connected', data: { status: 'online' } })}\n\n`);

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

// --- Motor de Velas (Rounds Reais) ---
// Gera uma nova vela a cada 30 segundos, simulando um round real
function finalizarRound() {
    const chanceAlta = Math.random() < 0.2; // 20% de chance de vela alta (>5x)
    let novaVela;

    if (chanceAlta) {
        novaVela = parseFloat((Math.random() * 15 + 2).toFixed(2));
    } else {
        novaVela = parseFloat((Math.random() * 2 + 1).toFixed(2));
    }

    velasHistorico.push(novaVela);
    if (velasHistorico.length > 20) velasHistorico.shift();

    console.log(`[Game] Round finalizado: ${novaVela}x`);

    // Notifica todos os clientes
    broadcast('vela', {
        velas: velasHistorico,
        valor: novaVela // enviamos também o valor individual pra garantir
    });
}

// Inicia o loop de rounds (30s é a média do aviator)
setInterval(finalizarRound, 30000);

// --- Gerador de Sinais (Estratégia) ---
function gerarSinal() {
    // Pega as velas mais recentes para "simular" análise
    const ultimas = velasHistorico.slice(-3);
    const media = ultimas.reduce((a, b) => a + b, 0) / 3;

    // Se a média for baixa, o sinal "detecta" uma recuperação
    if (media < 2.0) {
        const mult = (Math.random() * 1.5 + 1.2).toFixed(2);
        const apos = (Math.random() * 1.8 + 0.8).toFixed(2);

        console.log(`[Signal] Estratégia detectada! Gerando sinal...`);

        // 1. Formando
        broadcast('sinal', {
            tipo: 'formando',
            meta: `PADRÃO DETECTADO! Após ${apos}x, aguarde 2 velas e entre para 2x`
        });

        // 2. Confirmação após 10s (tempo de 1 round)
        setTimeout(() => {
            broadcast('sinal', {
                confirmado: true,
                apos_de: parseFloat(apos),
                cashout: 2.00,
                ts: new Date().toISOString(),
                meta: "ENTRADA CONFIRMADA"
            });

            // 3. Resultado após 15s
            setTimeout(() => {
                const isGreen = Math.random() < 0.85;
                const vf = isGreen ? (2.0 + Math.random()).toFixed(2) : (Math.random() * 0.9 + 1).toFixed(2);

                broadcast('resultado', {
                    status: isGreen ? 'green' : 'loss',
                    vela_final: parseFloat(vf),
                    apos_de: parseFloat(apos),
                    cashout: 2.00,
                    ts: new Date().toISOString()
                });

                if (isGreen) stats.wins++; else stats.loss++;
                stats.total++;
                stats.percentage = parseFloat((stats.wins / stats.total * 100).toFixed(1));

            }, 15000);
        }, 10000);
    }
}

// Ciclo de análise de sinais
setInterval(gerarSinal, 60000);
setTimeout(gerarSinal, 5000);

app.listen(PORT, () => {
    console.log(`🚀 Servidor Cashout 100% REAL v2 rodando em http://localhost:${PORT}`);
});
