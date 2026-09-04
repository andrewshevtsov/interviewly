import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { UsersService } from "./users.service.ts";

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) { }

    @Get()
    async findAll() {
        const users = await this.userService.users({});
        return users.map(user => {
            const { ...safe } = user;
            return safe;
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const user = await this.userService.user({ id });

        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }

        const { ...safe } = user;
        return safe;
    }
}

