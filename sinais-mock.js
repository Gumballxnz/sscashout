/**
 * SIMULADOR DE SINAIS - Sistema Cashout
 * APENAS PARA TESTES E DESENVOLVIMENTO
 * 
 * Este arquivo simula o comportamento do servidor de sinais
 * para que o site funcione localmente sem backend
 */

'use strict';

class SinaisMock {
  constructor() {
    this.sinais = [];
    this.stats = {
      vitorias: 0,
      derrotas: 0,
      total: 0,
      taxaAcerto: 0
    };
    this.isActive = false;
    this.intervalId = null;
  }

  /**
   * Gera um sinal aleatório baseado em padrões reais
   */
  gerarSinal() {
    // Multiplicadores realistas do Aviator
    const multiplicadores = [
      1.50, 1.60, 1.70, 1.80, 1.90,
      2.00, 2.10, 2.20, 2.30, 2.40, 2.50,
      2.65, 2.80, 3.00, 3.20, 3.50, 3.70,
      4.00, 4.50, 5.00, 6.00, 7.00,
      9.33, 10.00, 20.90
    ];

    // Pesos (multiplicadores menores são mais comuns)
    const pesos = [
      15, 14, 13, 12, 11,  // 1.5x - 1.9x (muito comum)
      10, 9, 8, 7, 6, 5,   // 2.0x - 2.5x (comum)
      4, 4, 3, 3, 2, 2,    // 2.6x - 3.7x (médio)
      2, 1, 1, 1, 1,       // 4.0x - 7.0x (raro)
      0.5, 0.3, 0.1        // 9.3x - 20.9x (muito raro)
    ];

    const mult = this.escolherPesado(multiplicadores, pesos);
    
    const sinal = {
      id: Date.now(),
      multiplicador: mult,
      timestamp: new Date().toISOString(),
      status: 'pendente', // pendente, green, loss
      cor: this.gerarCor(mult)
    };
    
    this.sinais.unshift(sinal);
    this.atualizarUIAtivo(sinal);
    
    // Notificar usuário
    this.notificar(sinal);
    
    // Simula resultado após 90-150 segundos (tempo real de uma rodada)
    const tempoRodada = Math.floor(Math.random() * 60000) + 90000; // 1.5-2.5 min
    setTimeout(() => this.resolverSinal(sinal.id), tempoRodada);
    
    console.log('🎯 Novo sinal gerado:', sinal);
  }

  /**
   * Escolhe elemento baseado em pesos probabilísticos
   */
  escolherPesado(elementos, pesos) {
    const somaTotal = pesos.reduce((a, b) => a + b, 0);
    let random = Math.random() * somaTotal;
    
    for (let i = 0; i < elementos.length; i++) {
      if (random < pesos[i]) {
        return elementos[i];
      }
      random -= pesos[i];
    }
    
    return elementos[0];
  }

  /**
   * Gera cor baseada no multiplicador
   */
  gerarCor(mult) {
    if (mult < 2.0) return 'red';
    if (mult < 3.0) return 'yellow';
    if (mult < 5.0) return 'green';
    return 'purple'; // muito alto
  }

  /**
   * Resolve o resultado de um sinal
   */
  resolverSinal(id) {
    const sinal = this.sinais.find(s => s.id === id);
    if (!sinal || sinal.status !== 'pendente') return;
    
    // 81.4% de taxa de acerto (conforme site original)
    // Mas multiplicadores mais altos têm chance menor
    let chanceGreen = 0.814;
    
    if (sinal.multiplicador > 5.0) chanceGreen = 0.70;
    else if (sinal.multiplicador > 3.0) chanceGreen = 0.78;
    
    const isGreen = Math.random() < chanceGreen;
    sinal.status = isGreen ? 'green' : 'loss';
    
    // Atualizar estatísticas
    if (isGreen) {
      this.stats.vitorias++;
    } else {
      this.stats.derrotas++;
    }
    
    this.stats.total++;
    this.stats.taxaAcerto = (this.stats.vitorias / this.stats.total * 100).toFixed(1);
    
    this.atualizarStats();
    this.atualizarHistorico();
    
    console.log(`${isGreen ? '✅ GREEN' : '❌ LOSS'} - Sinal ${sinal.multiplicador}x resolvido`);
  }

  /**
   * Atualiza UI do sinal ativo (área "Analisando velas")
   */
  atualizarUIAtivo(sinal) {
    const container = document.querySelector('.current-signal, .signal-active, [class*="analisando"]');
    
    if (container) {
      container.innerHTML = `
        <div class="signal-display">
          <span class="multiplier ${sinal.cor}">${sinal.multiplicador}x</span>
          <span class="time">agora</span>
        </div>
      `;
      
      // Adiciona classe de destaque
      container.classList.add('pulsing');
      setTimeout(() => container.classList.remove('pulsing'), 3000);
    }

    // Atualiza também área de gráfico se existir
    this.atualizarGrafico(sinal);
  }

  /**
   * Simula gráfico de velas
   */
  atualizarGrafico(sinal) {
    const grafico = document.querySelector('.chart, .graph, [class*="grafico"]');
    if (!grafico) return;

    // Adiciona marcador visual no gráfico
    const marcador = document.createElement('div');
    marcador.className = `chart-marker ${sinal.cor}`;
    marcador.textContent = `${sinal.multiplicador}x`;
    
    if (grafico.children.length > 10) {
      grafico.removeChild(grafico.firstChild);
    }
    
    grafico.appendChild(marcador);
  }

  /**
   * Atualiza estatísticas na tela
   */
  atualizarStats() {
    // Vitórias
    const winsEl = document.querySelector('.wins, [class*="vitoria"], [class*="VITÓRIA"]');
    if (winsEl) {
      winsEl.textContent = this.stats.vitorias;
    }

    // Derrotas
    const lossesEl = document.querySelector('.losses, [class*="derrota"], [class*="DERROTA"]');
    if (lossesEl) {
      lossesEl.textContent = this.stats.derrotas;
    }

    // Total
    const totalEl = document.querySelector('.total, [class*="TOTAL"]');
    if (totalEl) {
      totalEl.textContent = this.stats.total;
    }

    // Taxa de acerto
    const rateEl = document.querySelector('.win-rate, [class*="acerto"], [class*="ACERTO"]');
    if (rateEl) {
      rateEl.textContent = `${this.stats.taxaAcerto}% DE ACERTOS`;
      
      // Cor baseada na taxa
      if (this.stats.taxaAcerto >= 80) {
        rateEl.style.color = '#00ff00';
      } else if (this.stats.taxaAcerto >= 70) {
        rateEl.style.color = '#ffff00';
      } else {
        rateEl.style.color = '#ff6600';
      }
    }
  }

  /**
   * Atualiza histórico de sinais
   */
  atualizarHistorico() {
    const histContainer = document.querySelector('.history-list, .historico, [class*="historic"]');
    if (!histContainer) return;
    
    histContainer.innerHTML = '';
    
    // Mostra últimos 20 sinais
    const sinaisParaMostrar = this.sinais.slice(0, 20);
    
    sinaisParaMostrar.forEach(sinal => {
      const div = document.createElement('div');
      div.className = `history-item ${sinal.status}`;
      
      const hora = new Date(sinal.timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let statusIcon = '⏳';
      let statusText = 'ANALISANDO';
      let statusClass = 'pending';
      
      if (sinal.status === 'green') {
        statusIcon = '✓';
        statusText = 'GREEN';
        statusClass = 'green';
      } else if (sinal.status === 'loss') {
        statusIcon = '✗';
        statusText = 'LOSS';
        statusClass = 'loss';
      }
      
      div.innerHTML = `
        <div class="hist-mult ${sinal.cor}">${sinal.multiplicador}x</div>
        <div class="hist-status ${statusClass}">${statusIcon} ${statusText}</div>
        <div class="hist-time">${hora}</div>
      `;
      
      histContainer.appendChild(div);
    });
  }

  /**
   * Notifica usuário sobre novo sinal
   */
  notificar(sinal) {
    // Notificação no navegador (se habilitada)
    if (window.notificacoes && typeof window.notificacoes.notificarSinal === 'function') {
      window.notificacoes.notificarSinal(sinal.multiplicador);
    }

    // Notificação visual na página
    this.mostrarAlerta(`🎯 NOVO SINAL: ${sinal.multiplicador}x`, 'success');

    // Som de alerta (se disponível)
    this.tocarSom();
  }

  /**
   * Mostra alerta visual na tela
   */
  mostrarAlerta(mensagem, tipo = 'info') {
    let alertContainer = document.querySelector('.alert-container');
    
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.className = 'alert-container';
      document.body.appendChild(alertContainer);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.textContent = mensagem;
    
    alertContainer.appendChild(alert);

    // Remove após 5 segundos
    setTimeout(() => {
      alert.classList.add('fade-out');
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  }

  /**
   * Toca som de alerta
   */
  tocarSom() {
    try {
      const audio = new Audio('/sounds/alert.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        console.log('Não foi possível tocar som (permissão ou arquivo não encontrado)');
      });
    } catch (e) {
      // Silenciosamente ignora se som não estiver disponível
    }
  }

  /**
   * Inicia o sistema de sinais
   */
  iniciar() {
    if (this.isActive) {
      console.log('⚠️ Sistema já está ativo');
      return;
    }

    this.isActive = true;
    console.log('✅ Sistema de sinais iniciado');
    
    // Primeiro sinal após 10-30 segundos
    const tempoInicial = Math.floor(Math.random() * 20000) + 10000;
    setTimeout(() => this.gerarSinal(), tempoInicial);
    
    // Sinais subsequentes a cada 3-8 minutos
    this.intervalId = setInterval(() => {
      const intervalo = Math.floor(Math.random() * 300000) + 180000; // 3-8 min
      setTimeout(() => {
        if (this.isActive) {
          this.gerarSinal();
        }
      }, intervalo);
    }, 60000); // Verifica a cada minuto

    // Atualiza contador visual
    this.atualizarContador();
  }

  /**
   * Para o sistema de sinais
   */
  parar() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('🛑 Sistema de sinais pausado');
  }

  /**
   * Mostra contador regressivo para próximo sinal
   */
  atualizarContador() {
    const contadorEl = document.querySelector('.contador, .next-signal, [class*="proximo"]');
    if (!contadorEl) return;

    let tempo = Math.floor(Math.random() * 300) + 180; // 3-8 min em segundos
    
    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }

      const minutos = Math.floor(tempo / 60);
      const segundos = tempo % 60;
      contadorEl.textContent = `Próximo sinal em: ${minutos}:${segundos.toString().padStart(2, '0')}`;
      
      tempo--;
      
      if (tempo < 0) {
        tempo = Math.floor(Math.random() * 300) + 180;
      }
    }, 1000);
  }

  /**
   * Reseta todas as estatísticas
   */
  resetar() {
    this.sinais = [];
    this.stats = {
      vitorias: 0,
      derrotas: 0,
      total: 0,
      taxaAcerto: 0
    };
    this.atualizarStats();
    this.atualizarHistorico();
    console.log('🔄 Estatísticas resetadas');
  }
}

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Carregando sistema de sinais mock...');
  
  // Cria instância global
  window.sinaisMock = new SinaisMock();
  
  // Inicia automaticamente após 2 segundos
  setTimeout(() => {
    window.sinaisMock.iniciar();
  }, 2000);

  // Adiciona controles de debug (remover em produção)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🛠️ Modo Debug Ativo');
    console.log('Comandos disponíveis:');
    console.log('  sinaisMock.gerarSinal() - Gera sinal imediatamente');
    console.log('  sinaisMock.parar() - Para geração de sinais');
    console.log('  sinaisMock.iniciar() - Inicia geração de sinais');
    console.log('  sinaisMock.resetar() - Reseta estatísticas');
  }
});

// Adiciona CSS para alertas e animações
const style = document.createElement('style');
style.textContent = `
  .alert-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .alert {
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-weight: bold;
    animation: slideIn 0.3s ease-out;
    min-width: 250px;
  }

  .alert-success {
    background: linear-gradient(135deg, #00ff00, #00cc00);
    color: #000;
  }

  .alert-info {
    background: linear-gradient(135deg, #00aaff, #0088cc);
    color: #fff;
  }

  .alert-warning {
    background: linear-gradient(135deg, #ffaa00, #ff8800);
    color: #000;
  }

  .fade-out {
    animation: fadeOut 0.5s ease-out forwards;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateX(400px);
    }
  }

  .pulsing {
    animation: pulse 1s ease-in-out 3;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    background: rgba(255,255,255,0.05);
  }

  .history-item.green {
    border-left: 4px solid #00ff00;
  }

  .history-item.loss {
    border-left: 4px solid #ff0000;
  }

  .history-item.pending {
    border-left: 4px solid #ffaa00;
  }
`;
document.head.appendChild(style);
