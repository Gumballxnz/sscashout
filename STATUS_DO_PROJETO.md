# 📝 STATUS E DOCUMENTAÇÃO MESTRE — SSCashout V2

**Última Atualização:** 11 de Fevereiro de 2026
**Versão Atual:** 1.0.0
**Status Geral:** 🟢 Funcional (Simulado)

Este arquivo é a **FONTE ÚNICA DA VERDADE** do projeto. Ele consolida todo o conhecimento, status, guias técnicos e documentação anterior.

---

## 📋 ÍNDICE
1. [Resumo e Status do Projeto](#1-resumo-e-status-do-projeto)
2. [Arquitetura e Detalhes Técnicos](#2-arquitetura-e-detalhes-técnicos)
3. [Roteiro (Roadmap)](#3-roteiro-roadmap)
4. [Histórico de Versões](#4-histórico-de-versões)
5. [📚 BASE DE CONHECIMENTO TÉCNICO](#5-base-de-conhecimento-técnico)
    - [5.1 Guia de Clonagem e Soluções (YouTube/Sinais)](#51-guia-de-clonagem-e-soluções)
    - [5.2 Sistema de Notificações (Deep Dive)](#52-sistema-de-notificações-deep-dive)
    - [5.3 Reverse Engineering (Dados Reais)](#53-reverse-engineering-dados-reais)
    - [5.4 Lógica de Reset Diário](#54-lógica-de-reset-diário)
6. [🤖 Guia de Uso da IA (Antigravity)](#6-guia-de-uso-da-ia-antigravity)

---

## 1. 🚦 RESUMO E STATUS DO PROJETO

### O que estamos criando
O **SSCashout V2** é um clone funcional e profissional do site de sinais "Aviator" da Placard. O objetivo é fornecer uma interface idêntica para o usuário final, com um sistema de backend que simula sinais (fake) mas com aparência 100% real.

### Dashboard de Status

| Componente | Status | Detalhes |
| :--- | :---: | :--- |
| **Frontend (Visual)** | 🟢 100% | Interface idêntica, responsiva, efeitos visuais, gráficos. |
| **Backend (Lógica)** | 🟡 90% | Funcional com dados simulados (matemáticos). **NÃO** usa dados reais da Placard. |
| **Infraestrutura** | 🟡 Parcial | Frontend na Vercel (OK). Backend na Vercel não suporta SSE (precisa de VPS/Railway). |
| **Dados (Lives)** | 🔴 Simulado | Usando gerador matemático estatístico. Extração real é inviável no momento. |
| **Notificações** | 🟡 Em Teste | Service Worker configurado. Push Service criado mas requer servidor persistente. |

### 🔍 Detalhe: O que foi Clonado vs Não Clonado

#### ✅ Frontend (100% Fiel)
| Feature | Notas |
|---------|-------|
| HTML/CSS/Design | Idêntico ao original, incluindo Dark Mode e responsividade. |
| **Velas (Pills)** | Renderização visual perfeita (verde/vermelho). |
| **Sparkline** | Gráfico SVG animado com interpolação suave. |
| **Simulador de Sinais** | Lógica de "Entrada Confirmada" com pulse visual e badges. |
| **Lead Gate** | Formulário de captura (Nome + WhatsApp) funcional. |
| **Indicações Visuais** | Live Dot (ponto piscando), Toasts de "Green", Tutorial visual. |
| **Mobile PWA** | Ícone, Manifest, e Service Worker instaláveis. |

#### ⚠️ Backend & Infra (Parcial/Simulado)
| Feature | Status | Explicação Honest |
|---------|--------|---------------------|
| **Dados da Placard** | ❌ **SIMULADO** | O original não expõe API pública. Criamos um **gerador matemático** que imita a distribuição estatística do Aviator (House Edge ~3%). **Não são dados reais.** |
| **Conexão Real-time** | ⚠️ Instável na Vercel | O Server-Sent Events (SSE) funciona perfeitamente localmente, mas cai após ~10s na Vercel Grátis (Serverless). **Solução:** Migrar para VPS/Railway. |
| **Push Notifications** | ⚠️ Não Testado em Prod | A lógica existe (`push-service.js`), mas requer servidor persistente para garantir entrega. |

---

## 2. 🛠️ ARQUITETURA E DETALHES TÉCNICOS

### 🖥️ Frontend
- **Tecnologias**: HTML5, CSS3, Javascript (Vanilla).
- **Estrutura**:
    - `index.html`: Clonado do original.
    - `css/styles.css`: Estilização completa (Dark Mode nativo).
    - `js/app.js`: Lógica principal da aplicação.
    - `js/connectSSE.js`: Cliente de conexão com o servidor (EventSource).
    - `sw.js`: Service Worker para PWA e Notificações.

### ⚙️ Backend (`server.js`)
- **Tecnologias**: Node.js, Express.
- **Funcionalidade**:
    - Roda um loop infinito gerando "rounds" do jogo (matemática simulada).
    - Emite eventos via **SSE (Server-Sent Events)** para `/api/stream`.
    - Lógica de "Entrada Confirmada" baseada em padrões predefinidos.
- **Problema Crítico de Hospedagem**:
    - O `server.js` precisa rodar 24/7.
    - A Vercel (Serverless) mata o processo após 10-60s, quebrando o SSE e o loop de sinais.
    - **Solução Necessária**: Hospedar o backend em Railway, Render ou VPS.

---

## 3. 🚀 ROTEIRO (ROADMAP)

### Imediato (Priority High)
- [ ] **Migrar Backend**: Mover `server.js` para um host persistente (ex: Railway) para corrigir quedas de conexão.
- [ ] **Domínio Próprio**: Configurar URL final para produção.

### Médio Prazo
- [ ] **Afiliados**: Trocar links da Placard pelos IDs de afiliado do cliente.
- [ ] **Analytics**: Integrar Google Analytics ou Facebook Pixel próprio.

### Longo Prazo / Complexo
- [ ] **Dados Reais**: Investigar possibilidade de scraping avançado (alto risco/custo).

---

## 4. 🔄 HISTÓRICO DE VERSÕES

### v1.0.0 (Fev 2026) - Versão Autônoma
- **Foco:** Independência total do site original.
- **Mudanças:**
    - Backend próprio gerando velas matemáticas (simulação realista).
    - Sistema de Lead Gate implementado.
    - Service Worker configurado.
    - **Status:**### O que seria necessário para funcionar 100%
O backend precisa de um **servidor persistente** (sempre ligado).
**STATUS ATUAL:** O usuário já provisionou um servidor AWS EC2.
- **IP:** `51.20.9.165`
- **Key:** `keys/sistema cashout.pem` (protegida e ignorada no Git)
- **Repo:** [Gumballxnz/sscashout](https://github.com/Gumballxnz/sscashout)
- **Vercel:** [sscashout-alpha.vercel.app](https://sscashout-alpha.vercel.app/)

O backend está **RODANDO NA AWS** (via PM2).
O frontend foi atualizado para conectar em `http://51.20.9.165:3000`.

> [!WARNING]
> **Mixed Content:** O frontend na Vercel (HTTPS) bloqueará a conexão com a AWS (HTTP).
> **Solução Temporária:** Permitir conteúdo inseguro no cadeado do navegador.
> **Solução Definitiva:** Configurar domínio com SSL na AWS ou usar Cloudflare.

O plano é usar este servidor AWS para rodar o monitoramento real e o sistema de notificações.

### v0.5 (Jan 2026) - Versão Mirror (Descontinuada)
- **Foco:** Espelhar o site original.
- **Problema:** Dependência total. Se o original caía, o clone caía.

---

## 5. 📚 BASE DE CONHECIMENTO TÉCNICO

Esta seção consolida os guias técnicos criados durante o desenvolvimento.

### 5.1 Guia de Clonagem e Soluções
*(Conteúdo consolidado de `GUIA_CLONAGEM_SITE.md`)*

#### Problemas Comuns ao Clonar
1.  **Vídeos do YouTube (Erro 153)**: Ocorrem porque `file://` bloqueia iframes.
    *   **Solução**: Rodar em servidor local (`python -m http.server`) ou substituir o iframe por um link direto com thumbnail.
2.  **WebSockets/Dados**: Sites clonados estáticos perdem a conexão real.
    *   **Solução**: Criar um arquivo `sinais-mock.js` para simular dados se não tiver backend.

---

### 5.2 Sistema de Notificações (Deep Dive)
*(Conteúdo consolidado de `NOTIFICACOES_100_FUNCIONAL.md`)*

O sistema de notificações original usa **Web Push API** com chaves VAPID.

#### Componentes Necessários
1.  **Service Worker (`sw.js`)**: Escuta eventos `push` em background.
2.  **Frontend**: Solicita permissão (`Notification.requestPermission`) e envia a subscription para o backend.
3.  **Backend**: Usa biblioteca `web-push` e chaves VAPID para enviar a mensagem para o endpoint do navegador (Google/Mozilla/Apple).

#### Checklist de Implementação Push
- [ ] Gerar pares de chaves VAPID (Public/Private).
- [ ] Backend: Rota `/api/subscribe` para salvar subscriptions.
- [ ] Frontend: Converter VAPID Public Key para Uint8Array antes de assinar.
- [ ] **Importante**: Requer **HTTPS** (ou localhost) para funcionar.

---

### 5.3 Reverse Engineering (Dados Reais)
*(Conteúdo consolidado de `REVERSE_ENGINEERING_PLACARD.md`)*

#### Como o Original (provavelmente) funciona
O site original não conecta direto na Placard no frontend (segurança/CORS). O backend dele faz isso.

#### Métodos para obter dados reais
1.  **API da Placard**: Inspecionar Network tab procurando por `/api/history` ou WebSockets (`wss://`). Geralmente requer tokens de autenticação que expiram.
2.  **Scraping (Puppeteer)**: Rodar um navegador "headless" no servidor que loga na Placard e lê os dados da tela.
    *   *Custo*: Alto (requer VPS parruda).
    *   *Risco*: Banimento de IP/Conta.
3.  **Híbrido**: Interceptar o WebSocket da Spribe (provedor do jogo). Complexo pois usa encriptação e tokens de sessão efêmeros.

**Veredito Atual**: Usamos simulação matemática por ser zero custo e zero risco, mantendo 99% da fidelidade visual.

---

### 5.4 Lógica de Reset Diário
*(Conteúdo consolidado de `SISTEMA_RESET_REAL.md`)*

O sistema deve resetar as estatísticas (Wins/Losses) à meia-noite.

#### Implementação no `server.js`
- O servidor checa o horário atual.
- O fuso horário alvo é **Africa/Maputo (CAT)**.
- Quando `hora == 00:00`, as variáveis `stats` são zeradas.
- Um evento `type: reset` é enviado via SSE para todos os clientes conectados limparem a tela sem recarregar.

---

## 6. 🤖 GUIA DE USO DA IA (ANTIGRAVITY)
*(Conteúdo consolidado de `GUIA_ANTIGRAVITY.md` e `.clinerules`)*

### Regras de Ouro
1.  **Sempre pergunte** antes de fazer mudanças destrutivas.
2.  **Respeite a estrutura**: Não adicione React/Frameworks pesados se o projeto é Vanilla JS.
3.  **Seja Específico**: Ao pedir mudanças, diga "no arquivo X, mude Y para Z".

### Comandos Úteis
- `@arquivo nome.js`: Pede para a IA ler o arquivo.
- `@workspace`: Busca contexto no projeto todo.
- `/terminal`: Pede para executar comando.

---
**Fim da Documentação Mestre**
