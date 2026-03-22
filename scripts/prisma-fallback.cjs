const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const clientDir = path.join(repoRoot, 'node_modules', '.prisma', 'client');
fs.mkdirSync(clientDir, { recursive: true });

const runtimeJs = `
function createResult(action) {
  switch (action) {
    case 'findMany':
    case 'aggregateRaw':
    case 'findRaw':
    case 'groupBy':
    case 'createManyAndReturn':
      return [];
    case 'count':
      return 0;
    case 'aggregate':
      return {};
    case 'deleteMany':
    case 'updateMany':
    case 'createMany':
      return { count: 0 };
    case 'findUnique':
    case 'findUniqueOrThrow':
    case 'findFirst':
    case 'findFirstOrThrow':
      return null;
    default:
      return {};
  }
}

function createModelProxy() {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return async function () {
        return createResult(prop);
      };
    }
  });
}

class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        if (prop.startsWith('$')) {
          if (prop === '$transaction') {
            return async (arg) => {
              if (Array.isArray(arg)) return Promise.all(arg);
              if (typeof arg === 'function') return arg(target);
              return arg;
            };
          }
          return async () => undefined;
        }
        return createModelProxy();
      }
    });
  }

  async $connect() {}
  async $disconnect() {}
  async $executeRaw() { return 0; }
  async $queryRaw() { return []; }
  async $runCommandRaw() { return {}; }
}

const enumFactory = (values) => Object.freeze(Object.fromEntries(values.map((value) => [value, value])));

const UserRole = enumFactory(['SUPER_ADMIN', 'ADMIN', 'STAFF', 'IT', 'COACH', 'TEACHER']);
const NotificationType = enumFactory(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ACTION', 'ALERT']);

const Prisma = {
  DbNull: null,
  JsonNull: null,
  AnyNull: null
};

module.exports = { PrismaClient, Prisma, UserRole, NotificationType };
`;

const runtimeDts = `
export type AnyRecord = Record<string, any>;
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'IT' | 'COACH' | 'TEACHER';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION' | 'ALERT';

export const UserRole: Record<UserRole, UserRole>;
export const NotificationType: Record<NotificationType, NotificationType>;

export namespace Prisma {
  const DbNull: null;
  const JsonNull: null;
  const AnyNull: null;
  type TransactionClient = PrismaClient;
}

export class PrismaClient {
  [key: string]: any;
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction(arg: any): Promise<any>;
  $executeRaw(...args: any[]): Promise<number>;
  $queryRaw(...args: any[]): Promise<any[]>;
  $runCommandRaw(...args: any[]): Promise<any>;
}
`;

for (const file of ['default.js', 'index.js', 'edge.js']) {
  fs.writeFileSync(path.join(clientDir, file), runtimeJs);
}
for (const file of ['default.d.ts', 'index.d.ts', 'edge.d.ts']) {
  fs.writeFileSync(path.join(clientDir, file), runtimeDts);
}

console.log('Created Prisma fallback client in node_modules/.prisma/client');
