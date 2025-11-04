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
  /**
   * The S3 bucket name used for storing files.
   */
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
   * Generates a presigned URL for downloading a private S3 object.
   * The URL expires after the specified duration (default: 15 minutes).
   *
   * @param key S3 object key to generate download URL for
   * @param expiresIn Expiration time in seconds (default: 900 = 15 minutes)
   * @returns Promise<string> Presigned URL for downloading the object
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a presigned URL for uploading a file to S3.
   * The object will be private by default.
   *
   * @param key S3 object key where the file will be stored
   * @param contentType MIME type of the file to upload
   * @param expiresIn Expiration time in seconds (default: 300 = 5 minutes)
   * @returns Promise<string> Presigned URL for uploading the file
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a presigned URL for uploading a publicly accessible file to S3.
   * Objects will be publicly accessible via bucket policy.
   *
   * @param key S3 object key where the file will be stored
   * @param contentType MIME type of the file to upload
   * @param expiresIn Expiration time in seconds (default: 300 = 5 minutes)
   * @returns Promise<string> Presigned URL for uploading the file
   */
  async getPresignedUploadUrlPublic(
    key: string,
    contentType: string,
    expiresIn: number = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      // No ACL - bucket policy will handle public access
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generates a public URL for an S3 object (for objects with public-read ACL).
   * This constructs the direct S3 URL without a signature.
   *
   * @param key S3 object key
   * @returns string Public URL for accessing the object
   */
  getPublicUrl(key: string): string {
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
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
   * Uploads a file from a local path to S3.
   *
   * @param key S3 object key where the file will be stored
   * @param filePath Local file path to upload
   * @returns Promise<void>
   */
  async uploadFromPath({ key, filePath }: { key: string; filePath: string }): Promise<void> {
    const contentType = Bun.file(filePath).type || 'application/octet-stream';
    const fileBuffer = await Bun.file(filePath).arrayBuffer();

    // Objects are private by default when BlockPublicAccess is enabled on the bucket
    await this.uploadFile(key, Buffer.from(fileBuffer), contentType);
  }

  /**
   * Uploads a file to S3 and returns the S3 key (document URL).
   * This is a convenience method for the common upload pattern.
   *
   * @param key S3 object key where the file will be stored
   * @param file File data (can be Buffer, Blob, or File)
   * @param contentType Optional MIME type forcing
   * @returns Promise<string> The S3 key for accessing the uploaded file
   */
  async uploadToS3(
    key: string,
    file: Buffer | Blob | File | { buffer: ArrayBuffer },
    contentType?: string,
  ): Promise<string> {
    let buffer: Buffer;

    // Convert file to Buffer if needed
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof Blob) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (file?.buffer) {
      buffer = Buffer.from(file.buffer);
    } else {
      throw new Error('Unsupported file type');
    }

    await this.uploadFile(key, buffer, contentType ?? Bun.file(key).type ?? 'application/octet-stream');
    return key;
  }

  /**
   * Generates a unique S3 key for a user's file with UUID.
   *
   * @param userId User ID for organizing files by user
   * @param filename Original filename to extract extension
   * @returns string Unique S3 key in format: users/{userId}/{uuid}{filename}
   */
  generateUserFileKey(userId: string, filename: string): string {
    return `users/${userId}/${crypto.randomUUID()}${filename}`;
  }
}