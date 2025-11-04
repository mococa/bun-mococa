import { type CronConfig, Patterns } from '@elysiajs/cron';
import type { ApiDatabase } from '../db/db';
import type { Services } from '../types/types';

/**
 * Cron job to update payment status from AbacatePay.
 *
 * Runs every 30 seconds.
 *
 * @param db - The database instance
 * @param services - The services container
 *
 * @returns CronConfig object for the update-payment-status job
 */
export function updatePaymentStatus({
  db,
  services,
}: { db: ApiDatabase; services: Services }): CronConfig<'update-payment-status'> {
  return {
    name: 'update-payment-status',
    pattern: Patterns.everySeconds(30),
    run: async () => {
      console.log('Running payment status update...');
      // Poll AbacatePay for payment updates
      const { failures, successes } = await services.payments.abacate.poll();

      if (failures.length > 0) {
        console.log(`${failures.length} payment(s) failed or expired`);
        // TODO: Update payment records in database as failed
      }

      if (successes.length > 0) {
        console.log(`${successes.length} payment(s) succeeded`);
        // TODO: Update payment records in database as paid
      }
    },
  };
}
