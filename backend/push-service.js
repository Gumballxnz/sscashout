const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Configuração VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BFn16L8jss17LfCkfQ6OSxTXx4iFDka3vL71A4Y7yH3xc0HD3VlzGNW5xpxSWleARBrAAx5DKtGkxCIxe34rNgg';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'H_uX7VLnJSE5sdbCYruuGNiQ0mbdXo2VQXLAcgPl3F8';

webpush.setVapidDetails(
    'mailto:suporte@sscashout.online',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

class PushService {
    constructor() {
        this.subscriptionsPath = path.join(__dirname, 'subscriptions.json');
        this.subscriptions = this.loadSubscriptions();
    }

    loadSubscriptions() {
        try {
            if (fs.existsSync(this.subscriptionsPath)) {
                return JSON.parse(fs.readFileSync(this.subscriptionsPath, 'utf8'));
            }
        } catch (e) {
            console.error('[Push] Erro ao carregar assinaturas:', e.message);
        }
        return [];
    }

    saveSubscriptions() {
        try {
            fs.writeFileSync(this.subscriptionsPath, JSON.stringify(this.subscriptions, null, 2));
        } catch (e) {
            console.error('[Push] Erro ao salvar assinaturas:', e.message);
        }
    }

    addSubscription(subscription) {
        // Evita duplicatas pelo endpoint
        if (!this.subscriptions.find(s => s.endpoint === subscription.endpoint)) {
            this.subscriptions.push(subscription);
            this.saveSubscriptions();
            console.log(`[Push] Nova assinatura adicionada. Total: ${this.subscriptions.length}`);
        }
    }

    async sendToAll(payload) {
        console.log(`[Push] Enviando para ${this.subscriptions.size || this.subscriptions.length} assinantes...`);

        const notificationPayload = JSON.stringify(payload);

        const promises = this.subscriptions.map((sub, index) => {
            return webpush.sendNotification(sub, notificationPayload)
                .catch(err => {
                    console.error(`[Push] Erro no assinante ${index}:`, err.statusCode);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Assinatura expirada ou removida pelo usuário
                        return 'REMOVE';
                    }
                    return null;
                });
        });

        const results = await Promise.all(promises);

        // Limpeza de assinaturas inválidas
        const originalCount = this.subscriptions.length;
        this.subscriptions = this.subscriptions.filter((sub, index) => results[index] !== 'REMOVE');

        if (this.subscriptions.length !== originalCount) {
            this.saveSubscriptions();
            console.log(`[Push] Limpeza concluída. ${originalCount - this.subscriptions.length} assinaturas removidas.`);
        }
    }

    async notifySignal(data) {
        await this.sendToAll({
            title: '📊 ENTRADA CONFIRMADA',
            body: `Aposta sugerida após ${data.apos_de}x. Alvo: ${data.cashout}x. BOA SORTE! 🚀`,
            icon: '/images/icon-192.png',
            badge: '/favicon.ico',
            tag: 'signal-alert',
            data: { url: '/' }
        });
    }

    async notifyGreen(data) {
        await this.sendToAll({
            title: '✅ GREEN CONQUISTADO!',
            body: `A vela parou em ${data.vela_final}x. Meta de ${data.cashout}x batida com sucesso! 💰`,
            icon: '/images/icon-192.png',
            badge: '/favicon.ico',
            tag: 'result-alert',
            data: { url: '/' }
        });
    }

    async notifyLoss(data) {
        await this.sendToAll({
            title: '❌ LOSS NO ROUND',
            body: `A vela parou em ${data.vela_final}x. Meta de ${data.cashout}x não atingida desta vez.`,
            icon: '/images/icon-192.png',
            badge: '/favicon.ico',
            tag: 'result-alert',
            data: { url: '/' }
        });
    }
}

module.exports = new PushService();
