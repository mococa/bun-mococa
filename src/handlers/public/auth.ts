/**
 * Public authentication handlers for login, registration, and password reset.
 * These endpoints do not require authentication and handle user onboarding.
 */

/* ---------- External ---------- */
import { Elysia, t } from 'elysia';
import { cookie } from "@elysiajs/cookie";

/* ---------- Types ---------- */
import { AppContext } from '../../types/types';
import { Provider, UserRole } from '../../services/enums';

/**
 * @description
 * Creates public authentication route handlers for user registration and login.
 * Includes email/password validation and confirmation code workflows.
 * 
 * @returns Elysia instance with /auth prefix and authentication routes
 */
export function handlers() {
  return new Elysia<"/auth", AppContext>({ prefix: '/auth' })
    .use(cookie())
    .get('/oauth/:provider', async ({ params, redirect, services, setCookie, sessionId }) => {
      if (sessionId) throw new AlreadyLoggedIn();

      const { provider } = params;

      const validProvider = Object.values(Provider).includes(provider as Provider);
      if (!validProvider) throw new UnsupportedProvider();

      const setCookies = (name: string, value: string, exp: number) => {
        setCookie(name, value, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
          maxAge: exp,
          expires: new Date(Date.now() + exp * 1000),
        });
      }

      const redirectUri = await services.auth.oauth.getAuthUrl(provider as Provider, setCookies);
      redirect(redirectUri);
    })
    .get('/oauth/callback/:provider', async ({ params, query, services, cookie, sessionId }) => {
      if (sessionId) throw new AlreadyLoggedIn();

      const { provider } = params;

      const validProvider = Object.values(Provider).includes(provider as Provider);
      if (!validProvider) throw new UnsupportedProvider();

      const { code, state } = query;
      if (!code || !state) throw new Error('Missing code or state in OAuth callback');

      const getCookie = (name: string) => String(cookie[name].value || '');

      const user = await services.auth.oauth.exchangeCodeForProfile(provider as Provider, code as string, state as string, getCookie);

      // find or create user in database (db not setup yet, so using dummy userId 1)

      // create session
      sessionId = await services.auth.sessions.createSession({ userId: 1, role: UserRole.USER });

      // return session token and basic user info
      return { user, sessionId };
    })
    /** Login with email + password */
    .post('/login', async ({ body, services, sessionId }) => {
      if (sessionId) throw new AlreadyLoggedIn();

      const error = await services.aws.cognito
        .login(body.email, body.password)
        .then(() => null)
        .catch((err) => {
          if (err.name === 'NotAuthorizedException') return new InvalidCredentials();
          if (err.name === 'UserNotConfirmedException') return new UserNotConfirmed();
          return new LoginError();
        });

      if (error) throw error;

      // find user by email (db not setup yet, so using dummy userId 1)

      // create session
      sessionId = await services.auth.sessions.createSession({ userId: 1, role: UserRole.USER });

      // return session token and basic user info

      const { email, password } = body;
      return { email, password, sessionId };
    }, { body: schemas.login })
    /** Register with email + password */
    .post('/register', async ({ body, services, sessionId }) => {
        if (sessionId) throw new AlreadyLoggedIn();

        const error = await services.aws.cognito.register(body.email, body.password).then(() => null).catch((err) => {
          if (err.name === 'UsernameExistsException') return new UserAlreadyExists();
          return new RegistrationError();
        });

        if (error) throw error;

        services.notifications.notify('users.registration', {
          email: body.email,
          userId: 1,
        })

        const { email, password } = body;
        return { email, password };
    }, { body: schemas.register})
    /** Confirm email with code sent to user's email */
    .post('/confirm-email', async ({ body, services, sessionId }) => {
        if (sessionId) throw new AlreadyLoggedIn();

        const error = await services.aws.cognito
          .confirmEmail(body.email, body.code)
          .then(() => null)
          .catch((err) => {
            if (err.name === 'UserNotFoundException') return new InvalidCredentials();
            if (err.name === 'CodeMismatchException') return new CodeMismatch();
            return new RegistrationError();
          });

        if (error) throw error;

        const { email, code } = body;
        return { email, code };
    }, { body: schemas.confirmEmail })
    /** Resend confirmation code to user's email */
    .post('/resend-confirmation-code', async ({ body, services, sessionId }) => {
        if (sessionId) throw new AlreadyLoggedIn();

        const error = await services.aws.cognito
          .resendConfirmationCode(body.email)
          .then(() => null)
          .catch((err) => {
            if (err.name === 'UserNotFoundException') return new InvalidCredentials();
            return new RegistrationError();
          });

        if (error) throw error;

        const { email } = body;
        return { email };
    }, { body: schemas.resendConfirmationCode })
    /** Initiate forgot password flow, sending code to user's email */
    .post('/forgot-password', async ({ body, sessionId, services }) => {
        if (sessionId) throw new AlreadyLoggedIn();

        const error = await services.aws.cognito
          .forgotPassword(body.email)
          .then(() => null)
          .catch((err) => {
            if (err.name === 'UserNotFoundException') return new InvalidCredentials();
            return new RegistrationError();
          });

        if (error) throw error;

        const { email } = body;
        return { email };
    }, { body: schemas.forgotPassword })
    /** Complete password reset with code and new password */
    .post('/reset-password', async ({ body, sessionId, services }) => {
        if (sessionId) throw new AlreadyLoggedIn();

        const { email, code, newPassword } = body;
        const error = await services.aws.cognito
          .resetPassword(email, code, newPassword)
          .then(() => null)
          .catch((err) => {
            if (err.name === 'UserNotFoundException') return new InvalidCredentials();
            if (err.name === 'CodeMismatchException') return new CodeMismatch();
            return new RegistrationError();
          });

        if (error) throw error;

        return { email, code, newPassword };
    }, { body: schemas.resetPassword });
}

/* ---------- Errors ---------- */
class AlreadyLoggedIn extends Error {
  status: number = 400;
  name = "AlreadyLoggedInError";

  constructor() {
    super(JSON.stringify({ message: 'Already logged in' }));
  }
}

class InvalidCredentials extends Error {
  status: number = 401;
  name = "InvalidCredentialsError";
  
  constructor() {
    super(JSON.stringify({ message: 'Incorrect email, username and/or password' }));
  }
}

class UserNotConfirmed extends Error {
  status: number = 403;
  name = "UserNotConfirmedError";

  constructor() {
    super(JSON.stringify({ message: 'User not confirmed. Please check your email for the confirmation code.' }));
  }
}

class CodeMismatch extends Error {
  status: number = 400;
  name = "CodeMismatchError";

  constructor() {
    super(JSON.stringify({ message: 'Invalid confirmation code.' }));
  }
}

class UserAlreadyExists extends Error {
  status: number = 409;
  name = "UserAlreadyExistsError";

  constructor() {
    super(JSON.stringify({ message: 'A user with this email already exists.' }));
  }
}

class RegistrationError extends Error {
  status: number = 500;
  name = "RegistrationError";

  constructor() {
    super(JSON.stringify({ message: 'Registration failed. Please try again later.' }));
  }
}

class LoginError extends Error {
  status: number = 500;
  name = "LoginError";

  constructor() {
    super(JSON.stringify({ message: 'Login failed. Please try again later.' }));
  }
}

class UnsupportedProvider extends Error {
  status: number = 400;
  name = "UnsupportedProviderError";

  constructor() {
    super(JSON.stringify({ message: 'Unsupported OAuth provider.' }));
  }
}

/* ---------- Schemas ---------- */

/**
 * Email validation schema with format checking.
 */
const emailSchema = t.String({format: 'email', error: 'Invalid email format' });

/**
 * Strong password validation schema requiring uppercase, lowercase, and numbers.
 */
const passwordSchema = t.String({minLength: 8, maxLength: 128, pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$', error: 'Password must be 8-128 characters long, include at least one uppercase letter, one lowercase letter, and one number' });

/**
 * 6-digit numeric confirmation code validation schema.
 */
const codeSchema = t.String({minLength: 6, maxLength: 6, pattern: '^[0-9]{6}$', error: 'Invalid confirmation code format' });

/**
 * Collection of validation schemas for different authentication endpoints.
 */
const schemas = {
    login: t.Object({
      email: emailSchema,
      password: passwordSchema,
    }),
    register: t.Object({
      email: emailSchema,
      password: passwordSchema,
    }),
    confirmEmail:  t.Object({
      email: emailSchema,
      code: codeSchema,
    }),
    forgotPassword: t.Object({
      email: emailSchema,
    }),
    resendConfirmationCode: t.Object({
      email: emailSchema,
    }),
    resetPassword: t.Object({
      email: emailSchema,
      code: codeSchema,
      newPassword: passwordSchema,
    }),
}