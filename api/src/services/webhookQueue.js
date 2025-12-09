/**
 * Webhook Queue Service
 * Handles webhook delivery with exponential backoff retry logic
 */

const axios = require('axios');

class WebhookQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 second
  }

  enqueue(webhook) {
    webhook.retries = 0;
    webhook.nextRetry = Date.now();
    this.queue.push(webhook);
    this.processQueue();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const webhook = this.queue[0];

      if (webhook.nextRetry > Date.now()) {
        // Not ready to retry yet
        await this.sleep(Math.min(1000, webhook.nextRetry - Date.now()));
        continue;
      }

      try {
        await axios.post(webhook.url, webhook.payload, {
          timeout: 10000,
          headers: webhook.headers || { 'Content-Type': 'application/json' },
        });

        // Success - remove from queue
        this.queue.shift();
        console.log(`✅ Webhook delivered: ${webhook.url}`);
      } catch (err) {
        webhook.retries++;

        if (webhook.retries >= this.maxRetries) {
          // Max retries exceeded - remove and log
          this.queue.shift();
          console.error(`❌ Webhook failed after ${this.maxRetries} retries: ${webhook.url}`);
        } else {
          // Calculate exponential backoff
          const delay = this.baseDelay * Math.pow(2, webhook.retries - 1);
          webhook.nextRetry = Date.now() + delay;
          console.warn(`⚠️  Webhook retry ${webhook.retries}/${this.maxRetries} for ${webhook.url} (retry in ${delay}ms)`);
        }
      }

      await this.sleep(100);
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getQueueStatus() {
    return {
      pending: this.queue.length,
      processing: this.processing,
      webhooks: this.queue.map((w) => ({
        url: w.url,
        retries: w.retries,
        nextRetry: new Date(w.nextRetry).toISOString(),
      })),
    };
  }
}

module.exports = new WebhookQueue();
