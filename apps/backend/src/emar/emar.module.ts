import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { EmarController } from "./emar.controller.js";
import { EmarService } from "./emar.service.js";

@Module({
    imports: [PrismaModule],
    controllers: [EmarController],
    providers: [EmarService],
    exports: [EmarService],
})
export class EmarModule {}
