import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/guards/access-token.guard.js";
import { AdministerMedicationDto, CreateMedicationOrderDto } from "./dto/emar.dto.js";
import { EmarService } from "./emar.service.js";

@ApiTags("emar")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("api/emar")
export class EmarController {
    constructor(private readonly emarService: EmarService) {}

    @Get("residents")
    @ApiOperation({ summary: "Get list of residents for eMAR medication administration" })
    getResidents() {
        return this.emarService.getResidents();
    }

    @Get("residents/:id")
    @ApiOperation({ summary: "Get medication orders and administration logs for a resident" })
    getResidentMedications(@Param("id") id: string) {
        return this.emarService.getResidentMedications(id);
    }

    @Post("administer")
    @ApiOperation({ summary: "Record administration of a medication dose" })
    administer(@Body() dto: AdministerMedicationDto, @Req() request: any) {
        return this.emarService.administer(dto, request.user?.sub);
    }

    @Post("orders")
    @ApiOperation({ summary: "Prescribe / create a new medication order" })
    createOrder(@Body() dto: CreateMedicationOrderDto, @Req() request: any) {
        return this.emarService.createOrder(dto, request.user?.sub);
    }
}
