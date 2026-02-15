Markdown# Guia de Conexão - Aviator Signals API (Atualizado 2025)

**Host principal:** `http://69.62.126.212:8000`

**Observações importantes (2025):**
- A maioria dos endpoints GET (velas, stats, online, health, ultimo-historico) **não exige autenticação** e funciona publicamente.
- O endpoint **SSE `/api/stream`** exige autenticação **obrigatória** via parâmetro de query `_token=seu_token`.
- O token é obtido via `GET /api/token` e tem validade curta (~300 segundos / 5 minutos).
- Renove o token a cada 4 minutos para evitar desconexões no stream.
- O frontend oficial passa o token **no query string como `_token=...`** (não em headers como Authorization ou X-API-Token para o SSE).
- Alguns POSTs (sinal, resultado, velas) podem ser aceitos sem token, mas podem ser restritos por IP ou rate-limit em produção.

## 1. Obter Token de Autenticação (essencial para SSE)

**Método:** `GET /api/token`  
**Autenticação:** Não requer token  
**Resposta esperada (200 OK):**
```json
{
  "token": "b8e8b0e26b13485b3130def44bcf4bf4",
  "ttl": 300
}
Exemplo curl:
Bashcurl -s "http://69.62.126.212:8000/api/token"
Exemplo JavaScript (async/await):
JavaScriptasync function getToken() {
  try {
    const res = await fetch('http://69.62.126.212:8000/api/token');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.token;
  } catch (err) {
    console.error('Falha ao obter token:', err);
    return null;
  }
}
2. Stream de Dados em Tempo Real (SSE) – Endpoint mais crítico
Método: GET /api/stream
Autenticação: Obrigatória via query _token=...
Parâmetros recomendados na URL:

_token=SEU_TOKEN (obrigatório para evitar 403)
cid=qualquer_string (opcional, identificador do cliente)
v=timestamp (opcional, cache-buster)

URL exemplo correta:
texthttp://69.62.126.212:8000/api/stream?_token=b8e8b0e26b13485b3130def44bcf4bf4&v=1739500000000
Exemplo curl (para testar):
Bashcurl -N "http://69.62.126.212:8000/api/stream?_token=SEU_TOKEN_AQUI"
Exemplo JavaScript (EventSource com reconexão):
JavaScriptasync function connectToStream() {
  const token = await getToken();
  if (!token) return console.error('Sem token');

  const url = `http://69.62.126.212:8000/api/stream?_token=${encodeURIComponent(token)}&v=${Date.now()}`;
  
  const es = new EventSource(url);

  es.onopen = () => console.log('SSE conectado!');
  
  es.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      console.log('Evento:', msg.event, msg.data);
      // Ex: msg.event === 'vela' → msg.data.valores
      //     msg.event === 'resultado' → msg.data.status, msg.data.vela_final
    } catch (e) {
      console.error('Erro parse:', e);
    }
  };

  es.onerror = (err) => {
    console.error('Erro SSE:', err);
    es.close();
    // Recomendado: esperar 5-10s, obter novo token e reconectar
    setTimeout(connectToStream, 8000);
  };
}

connectToStream();
Eventos comuns recebidos:

vela → atualização das velas (data.valores ou data.velas)
sinal → sinal de entrada (data.tipo, data.apos_de, data.cashout)
resultado → green/loss (data.status, data.vela_final)
online → contagem de usuários (data.online ou data.count)
connected → confirmação de conexão

3. Receber Velas Históricas
Método: GET /api/velas
Autenticação: Não necessária
Resposta típica:
JSON{ "valores": [1.23, 2.45, 1.89, 4.12, 1.67, 2.98] }
Exemplo curl:
Bashcurl "http://69.62.126.212:8000/api/velas"
4. Obter Estatísticas (Wins / Loss / Percentage)
Método: GET /api/stats
Autenticação: Não necessária
Resposta exemplo:
JSON{
  "wins": 147,
  "loss": 25,
  "total": 172,
  "percentage": 85
}
5. Enviar Sinal (para bots, testes ou integração)
Método: POST /api/sinal
Autenticação: Geralmente não necessária
Parâmetros obrigatórios: apos_de, cashout
Exemplo curl:
Bashcurl -X POST "http://69.62.126.212:8000/api/sinal" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "entrada_confirmada",
    "apos_de": 2.8,
    "cashout": 4.2,
    "max_gales": 2,
    "vela_atual": 1.9
  }'
6. Enviar Resultado (para bots ou simulação)
Método: POST /api/resultado
Autenticação: Geralmente não necessária
Parâmetros obrigatórios: id, status
Exemplo curl:
Bashcurl -X POST "http://69.62.126.212:8000/api/resultado" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "res-001",
    "status": "green",
    "vela_final": 5.67,
    "ts": "2025-02-15T06:43:00Z"
  }'
7. Outros Endpoints Úteis



































MétodoEndpointDescriçãoAutenticaçãoGET/api/healthStatus da API e saúde do servidorNãoGET/api/ultimo-historicoÚltimo resultado completoNãoGET/api/ultimo-resultadoÚltimo resultado (versão simplificada)NãoGET/api/onlineContagem de usuários onlineNão
Recomendações para Implementação Estável

Renove o token a cada ~240 segundos (antes dos 300s de TTL).
Implemente reconexão automática no EventSource (onerror → novo token → reconnect).
Use encodeURIComponent(token) ao adicionar no query string.
Evite enviar headers Origin ou Referer falsos em servidores Node.js → pode causar 403.
Headers mínimos sugeridos para SSE:JavaScript{
  'Accept': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'User-Agent': 'Mozilla/5.0 ...'
}
Fallback: se SSE continuar falhando → teste sem _token (pode funcionar temporariamente em alguns momentos).

Tratamento de Erros Comuns

403 Forbidden → Token ausente/inválido no SSE → verifique _token na URL
422 Unprocessable Entity → Dados inválidos no POSTJSON{
  "detail": [
    {
      "loc": ["body", "apos_de"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
Conexão interrompida no SSE → Token expirado → renove e reconecte
