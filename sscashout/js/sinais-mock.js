/**
 * SIMULADOR DE SINAIS - Sistema Cashout PRO (Perfect Match)
 * APENAS PARA TESTES E DESENVOLVIMENTO
 */

'use strict';

class SinaisMock {
    constructor() {
        this.sinais = [];
        this.history = [];
        this.trendVelas = Array.from({ length: 30 }, () => Math.random() * 2 + 1);
        this.stats = { vitorias: 88, derrotas: 19, total: 107, taxaAcerto: 82.2 }; // Valores da imagem original para parecer real
        this.isActive = false;
        this.intervalId = null;
        this._sparkPrev = null;
        this._sparkAnim = null;
    }

    // --- Lógica de Sparkline (Gráfico) ---
    _resample(arr, n) {
        if (!arr || !arr.length) return Array.from({ length: n }, () => 0);
        const out = [];
        for (let i = 0; i < n; i++) {
            const t = (arr.length - 1) * (i / (n - 1));
            const a = Math.floor(t), b = Math.min(arr.length - 1, a + 1);
            const f = t - a;
            out.push(arr[a] + (arr[b] - arr[a]) * f);
        }
        return out;
    }

    _sparkPaths(values) {
        const n = values.length;
        const minV = Math.min(...values);
        const maxV = Math.max(...values);
        const pad = 0.12;
        const lo = minV - (maxV - minV) * pad;
        const hi = maxV + (maxV - minV) * pad || (minV + 1);
        const pts = values.map((v, i) => {
            const x = (i / (n - 1)) * 100;
            const y = 30 - ((v - lo) / (hi - lo)) * 28 - 1;
            return { x, y };
        });
        let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
        for (let i = 1; i < pts.length; i++) {
            const p0 = pts[i - 1], p1 = pts[i];
            const cx = ((p0.x + p1.x) / 2).toFixed(2);
            const cy = ((p0.y + p1.y) / 2).toFixed(2);
            d += ` Q ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} ${cx} ${cy}`;
        }
        d += ` T ${pts[pts.length - 1].x.toFixed(2)} ${pts[pts.length - 1].y.toFixed(2)}`;
        const area = d + ` L 100 30 L 0 30 Z`;
        return { d, area };
    }

    renderSpark() {
        const svg = document.getElementById("sparkline");
        if (!svg) return;
        if (!svg.__init) {
            svg.innerHTML = `<path class="area" d="" fill="rgba(22, 163, 74, 0.2)"></path><path class="line" d="" stroke="#16A34A" stroke-width="1.5" fill="none"></path>`;
            svg.__init = true;
        }
        const path = svg.querySelector("path.line");
        const area = svg.querySelector("path.area");
        const next = this._resample(this.trendVelas, 30);
        const { d, area: ad } = this._sparkPaths(next);
        path.setAttribute("d", d);
        area.setAttribute("d", ad);
    }

    // --- Lógica de UI ---
    updateVelaAtiva(valor) {
        const liveValor = document.getElementById("live-valor");
        const liveDot = document.getElementById("live-dot");
        if (liveValor) liveValor.textContent = valor.toFixed(2) + "x";
        if (liveDot) {
            liveDot.classList.remove("green", "red", "wait");
            liveDot.classList.add(valor >= 2 ? "green" : "red");
            setTimeout(() => {
                liveDot.classList.remove("green", "red");
                liveDot.classList.add("wait");
            }, 1200);
        }
        // Adiciona à tendência
        this.trendVelas.push(valor);
        if (this.trendVelas.length > 30) this.trendVelas.shift();
        this.renderSpark();
    }

    gerarSinal() {
        const mult = (Math.random() < 0.7) ? (Math.random() * 2 + 1.2).toFixed(2) : (Math.random() * 5 + 3).toFixed(2);
        const signalData = {
            apos: (Math.random() * 2 + 1).toFixed(2),
            cash: mult,
            status: "wait",
            timestamp: new Date().toISOString()
        };

        this.renderSignalCard(signalData);
        if (window.notificacoes) window.notificacoes.notificarSinal(mult);

        // Resolve sinal após 15s
        setTimeout(() => {
            const isGreen = Math.random() < 0.82;
            signalData.status = isGreen ? "green" : "loss";
            this.renderSignalCard(signalData);
            this.addHistorico(signalData, isGreen ? mult : (Math.random() * 1.5 + 1).toFixed(2));
            setTimeout(() => document.getElementById("signal-slot").innerHTML = "", 5000);
        }, 15000);
    }

    renderSignalCard(data) {
        const slot = document.getElementById("signal-slot");
        if (!slot) return;
        const cls = data.status;
        const badge = cls === "green" ? "GREEN" : cls === "loss" ? "LOSS" : "AGUARDANDO";
        const title = cls === "wait" ? "ENTRADA CONFIRMADA" : (cls === "green" ? "VITÓRIA CONFIRMADA" : "SINAL ENCERRADO");

        slot.innerHTML = `
      <div class="signal-pop ${cls} pulse signal-enter" style="background: var(--pill); border: 1px solid var(--stroke); border-radius: 16px; padding: 16px; margin-bottom: 10px;">
        <div class="top" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div class="title" style="font-weight: 700; font-size: 14px;"><span class="dot"></span> ${title}</div>
          <div class="badge" style="padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: ${cls === 'green' ? '#16A34A' : (cls === 'loss' ? '#EF4444' : '#F59E0B')}; color: #fff;">${badge}</div>
        </div>
        <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
          <div class="cell"><span style="display: block; font-size: 10px; color: var(--muted);">Depois de</span><strong style="font-size: 16px;">${data.apos}x</strong></div>
          <div class="cell"><span style="display: block; font-size: 10px; color: var(--muted);">Cashout</span><strong style="font-size: 16px;">${data.cash}x</strong></div>
          <div class="cell"><span style="display: block; font-size: 10px; color: var(--muted);">Tentar</span><strong style="font-size: 16px;">3 Vezes</strong></div>
        </div>
      </div>
    `;
    }

    addHistorico(data, velaFinal) {
        const target = document.querySelector(".history[data-table='historico']");
        if (!target) return;
        const li = document.createElement("li");
        const hora = new Date().toLocaleTimeString("pt-PT", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        li.innerHTML = `
      <div class="time" style="font-size: 12px; color: var(--muted); font-weight: 600;">${hora}</div>
      <div class="meta" style="display: flex; gap: 4px;">
        <span class="chip" style="background: #111923; padding: 4px 8px; border-radius: 999px; font-size: 11px;">Apos: ${data.apos}x</span>
        <span class="chip" style="background: #111923; padding: 4px 8px; border-radius: 999px; font-size: 11px;">Cash: ${data.cash}x</span>
        <span class="chip" style="background: #111923; padding: 4px 8px; border-radius: 999px; font-size: 11px;">Vela: ${velaFinal}x</span>
      </div>
      <div class="badge pill ${data.status}" style="padding: 6px 12px; border-radius: 999px; font-weight: 700; font-size: 11px; background: ${data.status === 'green' ? '#16A34A' : '#EF4444'}; color: #fff;">${data.status.toUpperCase()}</div>
    `;
        target.prepend(li);
        if (target.children.length > 5) target.lastElementChild.remove();
    }

    iniciar() {
        this.isActive = true;
        document.getElementById("leadGate").style.display = "none";

        // CSS extra para o gráfico e sinal
        const style = document.createElement('style');
        style.textContent = `
          #sparkline path.area { fill: rgba(22, 163, 74, 0.4); }
          #sparkline path.line { stroke: #22c55e; stroke-width: 2; }
          .signal-pop.pulse { animation: pulse 1.5s infinite; }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
            100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
          }
          .signal-pop.green { border-color: #16a34a !important; box-shadow: 0 0 20px rgba(22,163,74,0.4) !important; }
          .signal-pop.loss { border-color: #ef4444 !important; box-shadow: 0 0 20px rgba(239,68,68,0.4) !important; }
        `;
        document.head.appendChild(style);

        const subtitle = document.querySelector("[data-subtitle='connection']");
        if (subtitle) subtitle.textContent = "Aguarde entrada";

        // Simulador de velas de fundo
        setInterval(() => {
            this.updateVelaAtiva(Math.random() * 3 + 1);
        }, 5000);

        // Gera primeiro sinal
        setTimeout(() => this.gerarSinal(), 2000);
        this.renderSpark();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sinaisMock = new SinaisMock();
    window.sinaisMock.iniciar();
});
