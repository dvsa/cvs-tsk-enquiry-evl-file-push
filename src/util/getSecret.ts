import { SecretsManager } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const envVariable: string | undefined = process.env[secretName.replace(/\//g, '-')];
  if (envVariable !== undefined) {
    return envVariable.replace(/\\n/g, '\n');
  }

  const secretsManager = new SecretsManager();
  const secretValue = await secretsManager.getSecretValue({
    SecretId: secretName,
  });
  return secretValue.SecretString;
}

export { getSecret };
