import * as crypto from 'crypto';

if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => crypto.randomUUID(),
  };
} 