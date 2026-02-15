# Guia de Conexão - Aviator Signals API

Host: `http://69.62.126.212:8000`

## Endpoints Principais

### 1. Receber Velas (GET)

**Endpoint:** `GET /api/velas`

**URL Completa:** `http://69.62.126.212:8000/api/velas`

**Exemplo com curl:**
```bash
curl -X GET "http://69.62.126.212:8000/api/velas"
```

**Exemplo com JavaScript (fetch):**
```javascript
fetch('http://69.62.126.212:8000/api/velas')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

---

### 2. Enviar Velas (POST)

**Endpoint:** `POST /api/velas`

**URL Completa:** `http://69.62.126.212:8000/api/velas`

**Exemplo com curl:**
```bash
curl -X POST "http://69.62.126.212:8000/api/velas" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Exemplo com JavaScript (fetch):**
```javascript
fetch('http://69.62.126.212:8000/api/velas', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

---

### 3. Enviar Sinal

**Endpoint:** `POST /api/sinal`

**URL Completa:** `http://69.62.126.212:8000/api/sinal`

**Parâmetros obrigatórios:**
- `apos_de` (number): Valor após
- `cashout` (number): Valor de cashout

**Parâmetros opcionais:**
- `tipo` (string): Tipo do sinal (padrão: "entrada_confirmada")
- `max_gales` (integer): Máximo de gales (padrão: 2)
- `vela_atual` (number): Vela atual
- `meta` (string): Meta
- `id` (string): ID do sinal
- `ts` (string): Timestamp

**Exemplo com curl:**
```bash
curl -X POST "http://69.62.126.212:8000/api/sinal" \
  -H "Content-Type: application/json" \
  -d '{
    "apos_de": 2.5,
    "cashout": 5.0,
    "max_gales": 2,
    "vela_atual": 1.5
  }'
```

**Exemplo com JavaScript:**
```javascript
fetch('http://69.62.126.212:8000/api/sinal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apos_de: 2.5,
    cashout: 5.0,
    max_gales: 2,
    vela_atual: 1.5
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### 4. Enviar Resultado

**Endpoint:** `POST /api/resultado`

**URL Completa:** `http://69.62.126.212:8000/api/resultado`

**Parâmetros obrigatórios:**
- `id` (string): ID do resultado
- `status` (string): Status do resultado

**Parâmetros opcionais:**
- `vela_final` (number): Valor da vela final
- `ts` (string): Timestamp

**Exemplo com curl:**
```bash
curl -X POST "http://69.62.126.212:8000/api/resultado" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "resultado-123",
    "status": "win",
    "vela_final": 3.5
  }'
```

**Exemplo com JavaScript:**
```javascript
fetch('http://69.62.126.212:8000/api/resultado', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: "resultado-123",
    status: "win",
    vela_final: 3.5
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### 5. Outros Endpoints Úteis

#### Verificar Status da API
```bash
GET http://69.62.126.212:8000/api/health
```

#### Obter Último Histórico
```bash
GET http://69.62.126.212:8000/api/ultimo-historico
```

#### Obter Último Resultado
```bash
GET http://69.62.126.212:8000/api/ultimo-resultado
```

#### Obter Estatísticas do Dia
```bash
GET http://69.62.126.212:8000/api/stats
```

#### Stream de Dados (SSE)
```bash
GET http://69.62.126.212:8000/api/stream
```

---

## Exemplo Completo em Python

```python
import requests

BASE_URL = "http://69.62.126.212:8000"

# Receber velas
response = requests.get(f"{BASE_URL}/api/velas")
print("Velas:", response.json())

# Enviar sinal
sinal_data = {
    "apos_de": 2.5,
    "cashout": 5.0,
    "max_gales": 2
}
response = requests.post(f"{BASE_URL}/api/sinal", json=sinal_data)
print("Sinal enviado:", response.json())

# Enviar resultado
resultado_data = {
    "id": "resultado-123",
    "status": "win",
    "vela_final": 3.5
}
response = requests.post(f"{BASE_URL}/api/resultado", json=resultado_data)
print("Resultado enviado:", response.json())
```

---

## Tratamento de Erros

A API retorna erro 422 para validação de dados inválidos:

```json
{
  "detail": [
    {
      "loc": ["body", "campo"],
      "msg": "mensagem de erro",
      "type": "tipo_do_erro"
    }
  ]
}
```

Sempre verifique o status code da resposta e trate os erros adequadamente.
