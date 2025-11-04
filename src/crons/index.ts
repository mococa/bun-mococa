import cron from '@elysiajs/cron';
import Elysia from 'elysia';
import { updatePaymentStatus } from './update-payment-status';

import type { Services } from '../types/types';
import type { ApiDatabase } from '../db/db';

export const crons = ({ services, db }: { db: ApiDatabase; services: Services }) =>
  new Elysia()
    .use(cron(updatePaymentStatus({ services, db })));
