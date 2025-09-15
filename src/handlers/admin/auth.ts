/* ---------- External ---------- */
import { Elysia, t } from 'elysia';

/* ---------- Types ---------- */
import { AppContext } from '../../types/types';

export function handlers() {
  return new Elysia<"/auth", AppContext>({ prefix: '/auth' })
    .post('/login', async ({ body, store }) => {
      const { email, password } = body;
      return { email, password };
    }, { body: schemas.login })
    .post('/register', async ({ body }) => {
      const { email, password } = body;
      return { email, password };
    }, { body: schemas.register })
    .post('/confirm-email', async ({ body }) => {
      const { email, code } = body;
      return { email, code };
    }, { body: schemas.confirmRequest })
    .post('/forgot-password', async ({ body }) => {
      const { email } = body;
      return { email };
    }, { body: schemas.resetPasswordRequest })
    .post('/reset-password', async ({ body }) => {
      const { email, code, newPassword } = body;
      return { email, code, newPassword };
    }, { body: schemas.resetPassword });
}

/* ---------- Schemas ---------- */
const emailSchema = t.String({ format: 'email', error: 'Invalid email format' });
const passwordSchema = t.String({ minLength: 8, maxLength: 128, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$', error: 'Password must be 8-128 characters long, include at least one uppercase letter, one lowercase letter, and one number' });
const codeSchema = t.String({ minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$', error: 'Invalid confirmation code format' });

const schemas = {
  login: t.Object({
    email: emailSchema,
    password: passwordSchema,
  }),
  register: t.Object({
    email: emailSchema,
    password: passwordSchema,
  }),
  confirmRequest: t.Object({
    email: emailSchema,
    code: codeSchema,
  }),
  resetPasswordRequest: t.Object({
    email: emailSchema,
  }),
  resetPassword: t.Object({
    email: emailSchema,
    code: codeSchema,
    newPassword: passwordSchema,
  }),
}