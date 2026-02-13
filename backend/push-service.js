const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// VAPID Configuration
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
        this.stats = { sent: 0, failed: 0, clicks: 0, campaigns: [] };
        this.queue = [];
        this.processing = false;
    }

    // =========================================================================
    // Persistence
    // =========================================================================

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

    // =========================================================================
    // Subscription Management
    // =========================================================================

    addSubscription(subscription) {
        if (!this.subscriptions.find(s => s.endpoint === subscription.endpoint)) {
            this.subscriptions.push(subscription);
            this.saveSubscriptions();
            console.log(`[Push] Nova assinatura. Total: ${this.subscriptions.length}`);
        }
    }

    resetSubscriptions() {
        const count = this.subscriptions.length;
        this.subscriptions = [];
        this.saveSubscriptions();
        console.log(`[Push] Reset: ${count} assinaturas removidas`);
        return { removed: count };
    }

    getSubscriptionCount() {
        return this.subscriptions.length;
    }

    // =========================================================================
    // Targeting — all | sample | contains | host
    // =========================================================================

    getTargetedSubs(options = {}) {
        const { target = 'all', limit = 0, query = null } = options;
        let subs = [...this.subscriptions];

        switch (target) {
            case 'sample':
                // Random sample
                subs = subs.sort(() => Math.random() - 0.5);
                if (limit > 0) subs = subs.slice(0, limit);
                break;
            case 'contains':
                // Filter by endpoint containing query
                if (query) subs = subs.filter(s => s.endpoint.includes(query));
                break;
            case 'host':
                // Filter by host in endpoint
                if (query) subs = subs.filter(s => {
                    try { return new URL(s.endpoint).host.includes(query); }
                    catch { return false; }
                });
                break;
            case 'all':
            default:
                if (limit > 0) subs = subs.slice(0, limit);
                break;
        }

        return subs;
    }

    // =========================================================================
    // Core Send — with targeting, priority, delay
    // =========================================================================

    async sendTargeted(payload, options = {}) {
        const {
            target = 'all',
            limit = 0,
            query = null,
            priority = 5,
            delay_seconds = 0,
            dry_run = false,
            mode = 'queue',
            tag = null,
            renotify = true,
            require_interaction = false,
            silent = false
        } = options;

        const subs = this.getTargetedSubs({ target, limit, query });

        if (subs.length === 0) {
            console.log('[Push] Nenhum assinante no target');
            return { sent: 0, failed: 0, targets: 0 };
        }

        // Enhance payload with options
        const enhanced = {
            ...payload,
            tag: tag || payload.tag || 'notification',
            renotify,
            requireInteraction: require_interaction,
            silent,
            priority
        };

        if (dry_run) {
            console.log(`[Push] DRY RUN: ${subs.length} assinantes seriam notificados`);
            return { sent: 0, failed: 0, targets: subs.length, dry_run: true };
        }

        // Delay support
        if (delay_seconds > 0) {
            console.log(`[Push] Agendado para ${delay_seconds}s | ${subs.length} alvos`);
            setTimeout(() => this._executeSend(subs, enhanced), delay_seconds * 1000);
            return { sent: 0, failed: 0, targets: subs.length, scheduled: true, delay: delay_seconds };
        }

        // Queue or sync
        if (mode === 'queue') {
            this.queue.push({ subs, payload: enhanced });
            this._processQueue();
            return { sent: 0, failed: 0, targets: subs.length, queued: true };
        }

        return await this._executeSend(subs, enhanced);
    }

    async _processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const job = this.queue.shift();
            await this._executeSend(job.subs, job.payload);
        }

        this.processing = false;
    }

    async _executeSend(subs, payload) {
        console.log(`[Push] Enviando para ${subs.length} assinantes...`);

        const notificationPayload = JSON.stringify(payload);
        let sent = 0;
        let failed = 0;
        const toRemove = [];

        const promises = subs.map((sub, index) => {
            return webpush.sendNotification(sub, notificationPayload)
                .then(() => { sent++; return 'OK'; })
                .catch(err => {
                    failed++;
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        return 'REMOVE';
                    }
                    return null;
                });
        });

        const results = await Promise.all(promises);

        // Clean expired subscriptions
        const originalCount = this.subscriptions.length;
        const removedEndpoints = new Set();
        results.forEach((r, i) => {
            if (r === 'REMOVE') removedEndpoints.add(subs[i].endpoint);
        });

        if (removedEndpoints.size > 0) {
            this.subscriptions = this.subscriptions.filter(s => !removedEndpoints.has(s.endpoint));
            this.saveSubscriptions();
            console.log(`[Push] Limpeza: ${removedEndpoints.size} assinaturas expiradas removidas`);
        }

        this.stats.sent += sent;
        this.stats.failed += failed;
        this.stats.campaigns.push({
            ts: new Date().toISOString(),
            sent,
            failed,
            targets: subs.length,
            title: payload.title || 'N/A'
        });

        // Keep only last 50 campaigns
        if (this.stats.campaigns.length > 50) {
            this.stats.campaigns = this.stats.campaigns.slice(-50);
        }

        console.log(`[Push] Resultado: ${sent} enviados, ${failed} falharam`);
        return { sent, failed, targets: subs.length };
    }

    // =========================================================================
    // Legacy sendToAll (backward compatible)
    // =========================================================================

    async sendToAll(payload) {
        return this.sendTargeted(payload, { target: 'all', mode: 'sync' });
    }

    // =========================================================================
    // Notification Helpers (Signal, Green, Loss)
    // =========================================================================

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

    // =========================================================================
    // Stats & Click Tracking
    // =========================================================================

    recordClick() {
        this.stats.clicks++;
    }

    getStats() {
        return {
            total_subs: this.subscriptions.length,
            sent: this.stats.sent,
            failed: this.stats.failed,
            clicks: this.stats.clicks,
            recent_campaigns: this.stats.campaigns.slice(-10)
        };
    }
}

module.exports = new PushService();
