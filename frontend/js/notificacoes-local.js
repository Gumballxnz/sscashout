/**
 * SISTEMA DE NOTIFICAÇÕES LOCAIS
 * Para funcionar sem servidor backend
 */

'use strict';

class NotificacoesLocal {
  constructor() {
    this.permissao = Notification.permission || 'default';
    this.habilitado = false;
    this.ultimoSinal = null;
  }

  /**
   * Verifica se navegador suporta notificações
   */
  suportaNotificacoes() {
    if (!("Notification" in window)) {
      console.warn('❌ Navegador não suporta notificações');
      return false;
    }
    return true;
  }

  /**
   * Solicita permissão para notificações
   */
  async solicitar() {
    if (!this.suportaNotificacoes()) {
      this.mostrarAviso('Seu navegador não suporta notificações de desktop');
      return false;
    }

    // Já tem permissão
    if (this.permissao === 'granted') {
      this.habilitado = true;
      console.log('✅ Notificações já estavam habilitadas');
      return true;
    }

    // Bloqueado permanentemente
    if (this.permissao === 'denied') {
      this.mostrarAviso('Notificações bloqueadas. Habilite nas configurações do navegador.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      this.permissao = result;
      
      if (result === 'granted') {
        this.habilitado = true;
        console.log('✅ Permissão de notificações concedida');
        this.enviarTesteNotificacao();
        return true;
      } else {
        console.log('❌ Permissão de notificações negada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }

  /**
   * Envia notificação de teste
   */
  enviarTesteNotificacao() {
    this.enviar(
      '🎉 Notificações Ativadas!',
      'Você receberá alertas quando houver novos sinais',
      'images/icon-192.png',
      false
    );
  }

  /**
   * Envia notificação
   */
  enviar(titulo, mensagem, icone = 'images/icon-192.png', comSom = true) {
    if (!this.habilitado || this.permissao !== 'granted') {
      console.log('Notificação bloqueada:', titulo, mensagem);
      return null;
    }

    try {
      const opcoes = {
        body: mensagem,
        icon: icone,
        badge: icone,
        tag: 'sinal-cashout-' + Date.now(),
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: {
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      };

      const notification = new Notification(titulo, opcoes);

      // Som de alerta
      if (comSom) {
        this.tocarSom();
      }

      // Handler de clique
      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        this.close();
      };

      // Auto-fechar após 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return null;
    }
  }

  /**
   * Notifica sobre novo sinal (chamado pelo sinais-mock.js)
   */
  notificarSinal(multiplicador) {
    const titulo = '🎯 NOVO SINAL!';
    const mensagem = `Entre agora no Aviator!\nMultiplicador: ${multiplicador}x`;
    
    this.ultimoSinal = {
      multiplicador,
      timestamp: Date.now()
    };

    this.enviar(titulo, mensagem, 'images/icon-192.png', true);
  }

  /**
   * Notifica sobre resultado
   */
  notificarResultado(multiplicador, resultado) {
    const emoji = resultado === 'green' ? '✅' : '❌';
    const titulo = resultado === 'green' ? 'GREEN! Você ganhou!' : 'LOSS - Tente novamente';
    const mensagem = `Sinal ${multiplicador}x ${resultado === 'green' ? 'acertou' : 'não bateu'}`;
    
    this.enviar(emoji + ' ' + titulo, mensagem, 'images/icon-192.png', false);
  }

  /**
   * Toca som de alerta
   */
  tocarSom() {
    try {
      // Tenta carregar som customizado
      let audio = new Audio('sounds/alert.mp3');
      audio.volume = 0.6;
      
      audio.play().catch(() => {
        // Fallback: usa beep do sistema
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
      });
    } catch (error) {
      console.log('Não foi possível tocar som:', error);
    }
  }

  /**
   * Mostra aviso na tela
   */
  mostrarAviso(mensagem, tipo = 'info') {
    const aviso = document.createElement('div');
    aviso.className = `notif-aviso notif-${tipo}`;
    aviso.innerHTML = `
      <div class="notif-content">
        <span class="notif-icon">${tipo === 'info' ? 'ℹ️' : '⚠️'}</span>
        <span class="notif-text">${mensagem}</span>
      </div>
    `;

    document.body.appendChild(aviso);

    setTimeout(() => {
      aviso.classList.add('fade-out');
      setTimeout(() => aviso.remove(), 500);
    }, 5000);
  }

  /**
   * Desabilita notificações
   */
  desabilitar() {
    this.habilitado = false;
    console.log('🔕 Notificações desabilitadas');
  }

  /**
   * Habilita notificações (se já tem permissão)
   */
  habilitar() {
    if (this.permissao === 'granted') {
      this.habilitado = true;
      console.log('🔔 Notificações habilitadas');
      return true;
    }
    return false;
  }

  /**
   * Verifica se notificações estão ativas
   */
  estaoAtivas() {
    return this.habilitado && this.permissao === 'granted';
  }

  /**
   * Obtém status das notificações
   */
  getStatus() {
    return {
      suportado: this.suportaNotificacoes(),
      permissao: this.permissao,
      habilitado: this.habilitado,
      ativo: this.estaoAtivas()
    };
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔔 Carregando sistema de notificações...');
  
  // Cria instância global
  window.notificacoes = new NotificacoesLocal();

  // Configura botões de ativar notificações
  const botoesNotificacao = document.querySelectorAll(
    '.btn-notificacao, .ativar-notificacao, [class*="Ativar"][class*="Notifica"]'
  );

  botoesNotificacao.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const permitiu = await window.notificacoes.solicitar();
      
      if (permitiu) {
        btn.textContent = '✓ Notificações Ativas';
        btn.classList.add('ativo');
        btn.disabled = true;
      } else {
        btn.textContent = 'Habilite nas Configurações';
      }
    });
  });

  // Verifica se já tem permissão ao carregar
  if (window.notificacoes.permissao === 'granted') {
    window.notificacoes.habilitar();
    botoesNotificacao.forEach(btn => {
      btn.textContent = '✓ Notificações Ativas';
      btn.classList.add('ativo');
    });
  }

  console.log('Status das notificações:', window.notificacoes.getStatus());
});

// Adiciona CSS para avisos
const style = document.createElement('style');
style.textContent = `
  .notif-aviso {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 10000;
    animation: slideUp 0.3s ease-out;
    max-width: 90%;
  }

  .notif-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .notif-icon {
    font-size: 20px;
  }

  .notif-text {
    font-size: 14px;
  }

  .notif-info {
    border-left: 4px solid #00aaff;
  }

  .notif-warning {
    border-left: 4px solid #ffaa00;
  }

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  .fade-out {
    animation: fadeDown 0.5s ease-out forwards;
  }

  @keyframes fadeDown {
    to {
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
    }
  }

  .btn-notificacao.ativo {
    background: #00ff00 !important;
    color: #000 !important;
    cursor: default;
  }
`;
document.head.appendChild(style);
