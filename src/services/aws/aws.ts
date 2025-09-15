import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';


/**
 * AWS service wrapper that handles S3 operations with presigned URLs and direct uploads.
 */
export class AWS {
  private s3Client: S3Client;
  private cognitoClient: CognitoIdentityProviderClient;

  /**
   * An instance of the AWS S3 client used for interacting with Amazon Simple Storage Service.
   */
  s3: S3;

  /**
   * Instance of the Cognito service used for authentication and user management.
   */
  cognito: Cognito;

  /**
   * Initializes the AWS service with S3 client configuration.
   */
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.s3 = new S3(this.s3Client);
    this.cognito = new Cognito(this.cognitoClient);
  }
}

/**
 * AWS Cognito authentication service wrapper.
 * Handles user registration, login, email confirmation, and password reset flows.
 */
class Cognito {
  clientId: string = process.env.COGNITO_CLIENT_ID;

  /**
   * Initializes Cognito client with AWS region configuration.
   */
  constructor(private client: CognitoIdentityProviderClient) {}

  /**
   * Authenticates user with email and password via Cognito.
   * 
   * @param email User's email address
   * @param password User's password
   * @returns Promise<InitiateAuthCommandOutput> Cognito authentication response
   */
  async login(email: string, password: string) {
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    return await this.client.send(command);
  }

  /**
   * Registers a new user in Cognito with email, password, and name.
   * 
   * @param email User's email address
   * @param password User's chosen password
   * @returns Promise<SignUpCommandOutput> Cognito registration response
   */
  async register(email: string, password: string) {
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    });

    return await this.client.send(command);
  }

  /**
   * Confirms user email address with verification code.
   * 
   * @param email User's email address
   * @param confirmationCode 6-digit confirmation code from email
   * @returns Promise<ConfirmSignUpCommandOutput> Cognito confirmation response
   */
  async confirmEmail(email: string, confirmationCode: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    return await this.client.send(command);
  }

  /**
   * Initiates password reset flow by sending reset code to user's email.
   * 
   * @param email User's email address
   * @returns Promise<ForgotPasswordCommandOutput> Cognito forgot password response
   */
  async forgotPassword(email: string) {
    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
    });

    return await this.client.send(command);
  }

  /**
   * Completes password reset with confirmation code and new password.
   * 
   * @param email User's email address
   * @param confirmationCode Reset code from email
   * @param newPassword User's new password
   * @returns Promise<ConfirmForgotPasswordCommandOutput> Cognito reset response
   */
  async resetPassword(email: string, confirmationCode: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    return await this.client.send(command);
  }

  /**
   * Resends email confirmation code to user.
   * 
   * @param email User's email address
   * @returns Promise<ResendConfirmationCodeCommandOutput> Cognito resend response
   */
  async resendConfirmationCode(email: string) {
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: email,
    });

    return await this.client.send(command);
  }
}

class S3 {
  bucket: string = process.env.S3_BUCKET || '';
  constructor(private s3Client: S3Client) {}

  /**
   * Generates a presigned URL for downloading/accessing an S3 object.
   * 
   * @param key S3 object key
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   * @returns Promise<string> Presigned URL for accessing the object
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a presigned URL for uploading an object to S3.
   * 
   * @param key S3 object key where the file will be stored
   * @param contentType MIME type of the file to upload
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   * @returns Promise<string> Presigned URL for uploading the object
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Directly uploads a file buffer to S3.
   * 
   * @param key S3 object key where the file will be stored
   * @param file File data as Buffer
   * @param contentType MIME type of the file
   * @returns Promise<void>
   */
  async uploadFile(key: string, file: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generates a unique S3 key for a user's file with timestamp and UUID.
   * 
   * @param userId User ID for organizing files by user
   * @param filename Original filename to extract extension
   * @returns string Unique S3 key in format: users/{userId}/{timestamp}_{uuid}.{ext}
   */
  generateUserFileKey(userId: number, filename: string): string {
    return `users/${userId}/${crypto.randomUUID()}${filename}`;
  }
}