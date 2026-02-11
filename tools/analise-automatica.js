#!/usr/bin/env node

/**
 * ANALISADOR AUTOMÁTICO DE SITE
 * Descobre automaticamente APIs, WebSockets e endpoints
 * 
 * USO:
 * npm install puppeteer
 * node analise-automatica.js https://app.sscashout.online/
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const URL_ALVO = process.argv[2] || 'https://app.sscashout.online/';

console.log('🔍 ANALISADOR AUTOMÁTICO DE SITE');
console.log('═'.repeat(70));
console.log(`🎯 Alvo: ${URL_ALVO}`);
console.log('');

const descobertas = {
  requisicoes: [],
  websockets: [],
  apis: [],
  headers: {},
  cookies: [],
  localStorage: {},
  sessionStorage: {},
  scriptsSources: [],
  timestamp: new Date().toISOString()
};

async function analisar() {
  console.log('🚀 Iniciando navegador...');
  
  const browser = await puppeteer.launch({
    headless: false, // Mostre o navegador para debug
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  const page = await browser.newPage();
  
  // Configura viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // ============================================
  // INTERCEPTAR REQUISIÇÕES
  // ============================================
  await page.setRequestInterception(true);
  
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    const headers = request.headers();
    const resourceType = request.resourceType();
    
    // Filtra apenas requisições relevantes
    if (['xhr', 'fetch', 'websocket', 'eventsource'].includes(resourceType)) {
      console.log(`📡 ${method} ${resourceType.toUpperCase()}: ${url}`);
      
      descobertas.requisicoes.push({
        url,
        method,
        resourceType,
        headers,
        timestamp: new Date().toISOString()
      });
      
      // Detecta possíveis APIs
      if (url.includes('/api/') || 
          url.includes('/velas') || 
          url.includes('/aviator') ||
          url.includes('/history') ||
          url.includes('/results') ||
          url.includes('spribe') ||
          url.includes('placard')) {
        
        console.log('✨ POSSÍVEL API DETECTADA!');
        descobertas.apis.push({
          url,
          method,
          headers
        });
      }
    }
    
    request.continue();
  });
  
  // ============================================
  // INTERCEPTAR RESPOSTAS
  // ============================================
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    const contentType = response.headers()['content-type'] || '';
    
    // Apenas JSONs e APIs
    if (contentType.includes('json') || url.includes('/api/')) {
      try {
        const data = await response.json();
        
        console.log(`📥 RESPONSE [${status}]: ${url}`);
        console.log('📄 Dados:', JSON.stringify(data).substring(0, 200) + '...');
        
        // Salva resposta completa
        descobertas.requisicoes.forEach(req => {
          if (req.url === url) {
            req.response = {
              status,
              contentType,
              data
            };
          }
        });
        
      } catch (e) {
        // Não é JSON válido
      }
    }
  });
  
  // ============================================
  // INTERCEPTAR CONSOLE DO SITE
  // ============================================
  page.on('console', msg => {
    const text = msg.text();
    
    // Procura por URLs, tokens, etc
    if (text.includes('http') || 
        text.includes('token') ||
        text.includes('api') ||
        text.includes('key')) {
      console.log(`💬 CONSOLE:`, text);
    }
  });
  
  // ============================================
  // NAVEGAR PARA O SITE
  // ============================================
  console.log('🌐 Navegando para o site...');
  
  await page.goto(URL_ALVO, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  
  console.log('✅ Página carregada!');
  console.log('⏳ Aguardando 30 segundos para capturar atividade...');
  
  // Aguarda 30 segundos para capturar requisições dinâmicas
  await page.waitForTimeout(30000);
  
  // ============================================
  // EXTRAIR INFORMAÇÕES DO PÁGINA
  // ============================================
  console.log('📊 Extraindo informações da página...');
  
  const pageInfo = await page.evaluate(() => {
    return {
      // LocalStorage
      localStorage: { ...localStorage },
      
      // SessionStorage
      sessionStorage: { ...sessionStorage },
      
      // Cookies
      cookies: document.cookie,
      
      // Scripts carregados
      scripts: Array.from(document.querySelectorAll('script[src]'))
        .map(s => s.src),
      
      // Meta tags
      metas: Array.from(document.querySelectorAll('meta'))
        .map(m => ({
          name: m.getAttribute('name'),
          content: m.getAttribute('content')
        })),
      
      // Variáveis globais suspeitas
      globals: Object.keys(window).filter(key => 
        key.toLowerCase().includes('api') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('config') ||
        key.toLowerCase().includes('endpoint')
      )
    };
  });
  
  descobertas.localStorage = pageInfo.localStorage;
  descobertas.sessionStorage = pageInfo.sessionStorage;
  descobertas.cookies = pageInfo.cookies;
  descobertas.scriptsSources = pageInfo.scripts;
  
  console.log('');
  console.log('📦 Informações coletadas:');
  console.log(`  - ${descobertas.requisicoes.length} requisições interceptadas`);
  console.log(`  - ${descobertas.apis.length} APIs detectadas`);
  console.log(`  - ${pageInfo.scripts.length} scripts carregados`);
  console.log(`  - ${Object.keys(pageInfo.localStorage).length} itens em localStorage`);
  console.log('');
  
  // ============================================
  // INJETAR SCRIPT DE CAPTURA
  // ============================================
  console.log('💉 Injetando script de captura...');
  
  await page.evaluate(() => {
    // Intercepta WebSocket
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      console.log('🔌 WEBSOCKET CRIADO:', url);
      window.__wsUrls = window.__wsUrls || [];
      window.__wsUrls.push({ url, protocols, timestamp: Date.now() });
      return new originalWebSocket(url, protocols);
    };
    
    // Intercepta EventSource
    const originalEventSource = window.EventSource;
    window.EventSource = function(url, config) {
      console.log('📻 SSE CRIADO:', url);
      window.__sseUrls = window.__sseUrls || [];
      window.__sseUrls.push({ url, config, timestamp: Date.now() });
      return new originalEventSource(url, config);
    };
  });
  
  // Aguarda mais 10 segundos
  await page.waitForTimeout(10000);
  
  // Coleta WebSockets e SSE
  const wsData = await page.evaluate(() => ({
    websockets: window.__wsUrls || [],
    sse: window.__sseUrls || []
  }));
  
  descobertas.websockets = wsData.websockets;
  if (wsData.sse.length > 0) {
    descobertas.apis.push(...wsData.sse);
  }
  
  // ============================================
  // ANÁLISE DE SCRIPTS
  // ============================================
  console.log('🔍 Analisando scripts da página...');
  
  for (const scriptUrl of pageInfo.scripts.slice(0, 10)) {
    try {
      const scriptResponse = await page.goto(scriptUrl);
      const scriptContent = await scriptResponse.text();
      
      // Procura por padrões de API
      const apiPatterns = [
        /fetch\(['"]([^'"]+)['"]/g,
        /axios\.get\(['"]([^'"]+)['"]/g,
        /\$\.ajax\(\{[^}]*url:\s*['"]([^'"]+)['"]/g,
        /new\s+WebSocket\(['"]([^'"]+)['"]/g,
        /new\s+EventSource\(['"]([^'"]+)['"]/g,
        /api[Uu]rl\s*[:=]\s*['"]([^'"]+)['"]/g,
        /endpoint\s*[:=]\s*['"]([^'"]+)['"]/g
      ];
      
      apiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(scriptContent)) !== null) {
          console.log(`  🔗 URL encontrada: ${match[1]}`);
          descobertas.apis.push({
            url: match[1],
            source: scriptUrl,
            method: 'GET (inferido)'
          });
        }
      });
      
    } catch (e) {
      console.log(`  ⚠️ Não foi possível analisar: ${scriptUrl}`);
    }
  }
  
  // ============================================
  // FECHAR NAVEGADOR
  // ============================================
  await browser.close();
  
  // ============================================
  // GERAR RELATÓRIO
  // ============================================
  console.log('');
  console.log('═'.repeat(70));
  console.log('📊 RELATÓRIO DE DESCOBERTAS');
  console.log('═'.repeat(70));
  console.log('');
  
  if (descobertas.apis.length > 0) {
    console.log('🎯 APIs ENCONTRADAS:');
    descobertas.apis.forEach((api, index) => {
      console.log(`\n${index + 1}. ${api.method || 'GET'} ${api.url}`);
      if (api.headers && api.headers.authorization) {
        console.log(`   🔑 Authorization: ${api.headers.authorization.substring(0, 50)}...`);
      }
    });
    console.log('');
  }
  
  if (descobertas.websockets.length > 0) {
    console.log('🔌 WEBSOCKETS ENCONTRADOS:');
    descobertas.websockets.forEach((ws, index) => {
      console.log(`${index + 1}. ${ws.url}`);
    });
    console.log('');
  }
  
  // ============================================
  // SALVAR RESULTADOS
  // ============================================
  const filename = `analise-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(descobertas, null, 2));
  
  console.log(`💾 Relatório completo salvo em: ${filename}`);
  console.log('');
  
  // ============================================
  // GERAR CÓDIGO DE EXEMPLO
  // ============================================
  if (descobertas.apis.length > 0) {
    const primeiraApi = descobertas.apis[0];
    
    console.log('📝 CÓDIGO DE EXEMPLO:');
    console.log('─'.repeat(70));
    console.log('');
    console.log('// Backend (Node.js)');
    console.log(`const API_URL = '${primeiraApi.url}';`);
    
    if (primeiraApi.headers && primeiraApi.headers.authorization) {
      console.log(`const API_TOKEN = '${primeiraApi.headers.authorization}';`);
    }
    
    console.log('');
    console.log('async function buscarDados() {');
    console.log('  const response = await fetch(API_URL, {');
    console.log(`    method: '${primeiraApi.method || 'GET'}',`);
    console.log('    headers: {');
    
    if (primeiraApi.headers) {
      Object.entries(primeiraApi.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'cookie' && value.length < 100) {
          console.log(`      '${key}': '${value}',`);
        }
      });
    }
    
    console.log('    }');
    console.log('  });');
    console.log('  ');
    console.log('  const data = await response.json();');
    console.log('  return data;');
    console.log('}');
    console.log('');
    console.log('─'.repeat(70));
  }
  
  console.log('');
  console.log('✅ Análise completa!');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Revise o arquivo JSON gerado');
  console.log('2. Teste as APIs encontradas com Postman');
  console.log('3. Implemente no seu backend');
  console.log('4. Configure variáveis de ambiente na Vercel');
  console.log('');
}

// Executar análise
analisar().catch(error => {
  console.error('❌ Erro durante análise:', error);
  process.exit(1);
});
