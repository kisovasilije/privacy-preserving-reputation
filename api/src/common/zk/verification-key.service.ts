import path from 'node:path';
import { readFile } from 'node:fs/promises';

export class VerificationKeyService {
  private static key?: unknown;

  static async getKey(): Promise<unknown> {
    if (this.key) {
      return this.key;
    }

    const keyPath = path.resolve(process.cwd(), 'zk-artifacts', 'verification_key.json');
    const raw = await readFile(keyPath, 'utf-8');
    this.key = JSON.parse(raw);
    return this.key;
  }
}
