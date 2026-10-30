import { Controller, Get, Post, Body, Patch, Param, Put, Query } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { UpdateUserDto } from "./dto/update-user.dto.js";
import { UpdateStatusDto } from "./dto/update-status.dto.js";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

@ApiTags("users")
@Controller("api/users")
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({ summary: "Create a new user" })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get("clinicians")
    @ApiOperation({ summary: "Get clinical staff (physicians and nurses) from database" })
    getClinicians() {
        return this.usersService.findClinicians();
    }

    @Get()
    @ApiOperation({ summary: "Get a list of users" })
    findAll(
        @Query("page") page?: string,
        @Query("limit") limit?: string,
        @Query("search") search?: string,
        @Query("role") role?: string,
        @Query("status") status?: string,
    ) {
        return this.usersService.findAll(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
            search,
            role,
            status,
        );
    }

    @Get(":id")
    @ApiOperation({ summary: "Get a user by ID" })
    findOne(@Param("id") id: string) {
        return this.usersService.findOne(id);
    }

    @Put(":id")
    @ApiOperation({ summary: "Update a user" })
    update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Update a user status" })
    updateStatus(@Param("id") id: string, @Body() updateStatusDto: UpdateStatusDto) {
        return this.usersService.updateStatus(id, updateStatusDto);
    }
}
