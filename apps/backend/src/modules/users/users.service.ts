import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.ts";
import { Prisma, User } from "../../prisma/generated/client.ts";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async user(userWhereInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
        return this.prisma.user.findUnique({ where: userWhereInput });
    }

    async users(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserWhereUniqueInput;
        where?: Prisma.UserWhereInput;
        orderBy?: Prisma.UserOrderByWithRelationInput;
    }): Promise<User[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.user.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }


    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }



}
