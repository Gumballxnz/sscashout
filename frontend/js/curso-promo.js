/* ========================================
   CURSO PROMO - JavaScript
   Sistema Milionário - Pop-up Inteligente
======================================== */

(function () {
  'use strict';

  // Configurações
  const CONFIG = {
    whatsappLink: 'https://wa.me/258869422557?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20o%20curso%20Sistema%20Milion%C3%A1rio',
    signalTrigger: 2, // Após 2 sinais (sem timer)
    storageKey: 'curso_popup_shown',
    storageDismissKey: 'curso_popup_dismissed',
    dismissCooldown: 24 * 60 * 60 * 1000 // 24 horas
  };

  let signalCount = 0;
  let popupShown = false;
  let timeoutId = null;

  // Verificar se o pop-up já foi mostrado recentemente
  function wasRecentlyDismissed() {
    const dismissed = localStorage.getItem(CONFIG.storageDismissKey);
    if (!dismissed) return false;

    const dismissedTime = parseInt(dismissed, 10);
    const now = Date.now();

    return (now - dismissedTime) < CONFIG.dismissCooldown;
  }

  // Criar e inserir o HTML do pop-up
  function createPopupHTML() {
    const popupHTML = `
      <div id="cursoPopupOverlay" class="curso-popup-overlay">
        <div class="curso-popup">
          <button class="curso-popup-close" id="cursoPopupClose" aria-label="Fechar">&times;</button>
          
          <div class="curso-popup-header">
            <div class="curso-popup-emoji">🚀</div>
            <h3>Sistema Milionário</h3>
            <p>O curso que vai mudar seus resultados</p>
          </div>
          
          <div class="curso-popup-body">
            <p class="curso-popup-question">
              Quer <strong>dominar o Aviator</strong> e lucrar de verdade?
            </p>
            
            <div class="curso-popup-features">
              <div class="curso-popup-feature">
                <div class="curso-popup-feature-icon">🎯</div>
                <div class="curso-popup-feature-text">
                  <strong>Como Pegar Rosa</strong>
                  Técnicas exclusivas para acertar
                </div>
              </div>
            
            <div class="curso-popup-price-box">
              <div class="curso-popup-price-label">Investimento único</div>
              <div class="curso-popup-price">497 <small>MT</small></div>
            </div>
            
            <a href="${CONFIG.whatsappLink}" target="_blank" class="curso-popup-cta" id="cursoPopupCTA">
              Quero o Curso Agora
            </a>
            
            <button class="curso-popup-skip" id="cursoPopupSkip">
              Agora não, obrigado
            </button>
          </div>
        </div>
      </div>
    `;

    // Inserir no body
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Adicionar event listeners
    document.getElementById('cursoPopupClose').addEventListener('click', closePopup);
    document.getElementById('cursoPopupSkip').addEventListener('click', dismissPopup);
    document.getElementById('cursoPopupOverlay').addEventListener('click', function (e) {
      if (e.target === this) closePopup();
    });

    // Track clique no CTA
    document.getElementById('cursoPopupCTA').addEventListener('click', function () {
      trackEvent('curso_popup_cta_click');
      closePopup();
    });
  }

  // Mostrar pop-up
  function showPopup() {
    if (popupShown || wasRecentlyDismissed()) return;

    popupShown = true;
    const overlay = document.getElementById('cursoPopupOverlay');
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      trackEvent('curso_popup_shown');
    }
  }

  // Fechar pop-up (temporário)
  function closePopup() {
    const overlay = document.getElementById('cursoPopupOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Dispensar pop-up (não mostrar por 24h)
  function dismissPopup() {
    localStorage.setItem(CONFIG.storageDismissKey, Date.now().toString());
    closePopup();
    trackEvent('curso_popup_dismissed');
  }

  // Rastrear eventos (opcional - pode integrar com analytics)
  function trackEvent(eventName) {
    console.log('[CursoPromo]', eventName);
    // Se tiver Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('trackCustom', eventName);
    }
  }

  // Observar novos sinais
  function observeSignals() {
    // Observar mudanças no slot de sinais
    const signalSlot = document.getElementById('signal-slot');
    if (!signalSlot) return;

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length > 0) {
          signalCount++;
          console.log('[CursoPromo] Sinal detectado:', signalCount);

          if (signalCount >= CONFIG.signalTrigger && !popupShown) {
            showPopup();
          }
        }
      });
    });

    observer.observe(signalSlot, { childList: true, subtree: true });
  }

  // Inicializar
  function init() {
    // Criar HTML do pop-up
    createPopupHTML();

    // Observar sinais
    observeSignals();

    // Pop-up aparece apenas após sinais (sem timer)
    console.log('[CursoPromo] Inicializado - aguardando', CONFIG.signalTrigger, 'sinais');
  }

  // Aguardar DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expor funções globalmente (para debug ou uso manual)
  window.CursoPromo = {
    show: showPopup,
    close: closePopup,
    dismiss: dismissPopup,
    reset: function () {
      localStorage.removeItem(CONFIG.storageDismissKey);
      popupShown = false;
      signalCount = 0;
      console.log('[CursoPromo] Reset completo');
    }
  };

})();
