/**
 * Validates that all required environment variables are set.
 * Exits the process with error code 1 if any required variables are missing.
 * 
 * @throws Process exit with code 1 if required environment variables are missing
 */
export function checkEnv(): void {
  const environment = process.env.ENV;
  const development = environment !== "production";

  if (development && !process.env.ENV) {
    console.error("Error: ENV environment variable is not set.\n");
    process.exit(1);
  }

  const requiredEnvs = [
    "LISTEN_ADDR",
    "DATABASE_URI", 
    "S3_BUCKET",
    "COGNITO_CLIENT_ID",
    "OAUTH_REDIRECT_URI_BASE",
    "ABACATE_API_KEY",
    "REDIS_URL",
  ];

  const missing = requiredEnvs.filter(env => !process.env[env]);
  if (!missing.length) return;

  let errStr = "[FATAL]\nSome required environment variables are not set.\nPlease check your .env file or environment configuration:\n";
  
  for (const env of missing) {
    errStr += ` - ${env}\n`;
  }

  console.error(errStr);
  console.error(
    "Exiting application due to missing environment variables.\n" +
    "Please set the required variables and try again.\n" +
    "They are listed in the .env.example file in the root directory.\n\n"
  );
  process.exit(1);
}
