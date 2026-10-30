import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/guards/access-token.guard.js";
import { ReportsService } from "./reports.service.js";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller("api/reports")
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Get("summary")
    @ApiOperation({ summary: "Get executive aggregated reporting summary" })
    getSummary() {
        return this.reportsService.getSummary();
    }

    @Get("census")
    @ApiOperation({ summary: "Get resident census and demographic distribution" })
    getCensus() {
        return this.reportsService.getCensus();
    }

    @Get("incidents")
    @ApiOperation({ summary: "Get comprehensive safety and incident report" })
    getIncidents() {
        return this.reportsService.getIncidents();
    }

    @Get("medications")
    @ApiOperation({ summary: "Get eMAR medication administration adherence log" })
    getMedications() {
        return this.reportsService.getMedicationAdherence();
    }
}
