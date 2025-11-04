import AbacatePay from 'abacatepay-nodejs-sdk';
import { IPixQrCode } from 'abacatepay-nodejs-sdk/dist/types';
import { RedisClient } from 'bun';

export class Abacate {
  client: ReturnType<typeof AbacatePay>;

  constructor(
    apiKey: string,
    private redis: RedisClient,
  ) {
    if (!apiKey) {
      throw new Error('Abacate API key is required');
    }

    this.client = (AbacatePay as any).default(apiKey);
  }

  /**
   * Creates a new Pix QR code payment in Abacate.
   * It sets an expiration of 5 days and stores the payment info in Redis.
   *
   * @param amount Amount in cents for the payment
   * @returns Promise<{copyPaste: string, qr: string, id: string, status: string}> QR code details
   */
  async createQR({ amount }: CreateQrParams) {
    const expiresIn = 60 * 60 * 24 * 5; // 5 days

    const { data, error } = (await this.client.pixQrCode.create({
      amount,
      description: 'Payment',
      expiresIn,
    })) as { error: string; data: IPixQrCode };

    if (error) throw new Error(error);

    this.store({
      id: data.id,
      data: { id: data.id, code: data.brCode },
      expiresIn,
    });

    return {
      code: data.brCode,
      qr: data.brCodeBase64,
      id: data.id,
      status: data.status,
    };
  }

  private async checkQRStatus({ id }: CheckQrStatusParams) {
    const { data, error } = (await this.client.pixQrCode.check({ id })) as {
      error: string;
      data: IPixQrCode;
    };
    if (error) throw new Error(error);

    return {
      status: data.status,
      expiresAt: data.expiresAt,
    };
  }

  private async store({ id, data, expiresIn }: { id: string; data: Payment; expiresIn: number }) {
    await this.redis.set(`abacate:payments:${id}`, JSON.stringify(data), 'EX', expiresIn);
  }

  /**
   * Polls Abacate for payment status updates and returns completed payments.
   * Should be run periodically to update payment statuses in the system.
   *
   * @returns Promise<{successes: string[], failures: string[]}> List of QR IDs that have been completed
   */
  async poll() {
    const successes: Payment[] = [];
    const failures: Payment[] = [];
    const pending: Payment[] = [];

    const keys = await this.redis.keys('abacate:payments:*');

    for (const key of keys) {
      try {
        const data = await this.redis.get(key);
        if (!data) continue;

        const payment = JSON.parse(data) as Payment;
        const { status, expiresAt } = await this.checkQRStatus({ id: payment.id });

        if (['EXPIRED', 'CANCELLED', 'REFUNDED'].includes(status)) {
          failures.push(payment);
          await this.redis.del(key);
          continue;
        }

        if (Date.now() > new Date(expiresAt).getTime()) {
          // Payment expired
          failures.push(payment);
          await this.redis.del(key);
          continue;
        }

        if (status !== 'PAID') {
          pending.push(payment);
          continue;
        }

        successes.push(payment);
        await this.redis.del(key);
      } catch (error) {
        console.error('Error polling Abacate payment:', error);
      }
    }

    return { successes, failures };
  }
}

interface CreateQrParams {
  amount: number;
}

interface CheckQrStatusParams {
  id: string;
}

interface Payment {
  id: string;
  code: string;
}
