// Stub de tipos para compatibilidad; Prisma no se usa realmente (backend Supabase).
declare module "@prisma/client" {
  export namespace Prisma {
    export type TransactionClient = any;
  }
  export type Prisma = Record<string, any> & { TransactionClient?: any };
  export type Match = any;
  export type Spot = any;
  export type PaymentStatus = string;
  export type UserRole = string;
  export type PaymentProvider = string;
  export class PrismaClient {}
}
