import {
  GetSecretValueCommand,
  SecretsManager,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { getSecret } from '../../src/util/getSecret';

const mockSecretsManager = mockClient(SecretsManager);
mockSecretsManager
  .on(GetSecretValueCommand)
  .resolves({ SecretString: 'Secret From Secrets Manager' });

describe('getSecret functions', () => {
  it('GIVEN a variable WHEN variable not local THEN get variable from Secrets Manager.', async () => {
    const value = await getSecret('SecretVariable');

    expect(value).toBe('Secret From Secrets Manager');
  });

  it('GIVEN a variable WHEN variable found locally THEN get variable from process.env.', async () => {
    process.env.SecretVariable = 'Local Secret';
    const value = await getSecret('SecretVariable');

    expect(value).toBe('Local Secret');
  });
});
