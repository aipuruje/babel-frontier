// Mock Prisma Client with explicit type annotations

interface UserModel {
    id: number;
    telegramId: bigint;
    username: string | null;
    firstName: string;
    authMethod: string;
    phoneNumber: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
}

export class PrismaClient {
    user = {
        findUnique: async function (query?: any): Promise<UserModel | null> {
            console.log('Mock: findUnique called with:', query);
            return null;
        },

        create: async function (params?: any): Promise<UserModel> {
            console.log('Mock: Creating user:', params?.data);
            const result: UserModel = {
                id: 1,
                telegramId: params?.data?.telegramId || BigInt(0),
                username: params?.data?.username || null,
                firstName: params?.data?.firstName || 'User',
                authMethod: params?.data?.authMethod || 'email',
                phoneNumber: params?.data?.phoneNumber || null,
                email: params?.data?.email || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastActive: params?.data?.lastActive || new Date()
            };
            return result;
        },

        update: async function (params?: any): Promise<UserModel> {
            console.log('Mock: Updating user:', params);
            const result: UserModel = {
                id: 1,
                telegramId: params?.where?.telegramId || BigInt(0),
                username: params?.data?.username || null,
                firstName: params?.data?.firstName || 'User',
                authMethod: params?.data?.authMethod || 'email',
                phoneNumber: params?.data?.phoneNumber || null,
                email: params?.data?.email || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastActive: params?.data?.lastActive || new Date()
            };
            return result;
        }
    };
}
