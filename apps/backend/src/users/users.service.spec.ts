import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

describe("UsersService", () => {
    let service: UsersService;
    let prisma: { user: { findMany: jest.Mock } };

    beforeEach(async () => {
        prisma = {
            user: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService, { provide: PrismaService, useValue: prisma }],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    it("should return physicians and nurses from database", async () => {
        prisma.user.findMany.mockResolvedValue([
            {
                id: "1",
                firstName: "Robert",
                middleName: null,
                lastName: "Chen",
                email: "chen@facility.org",
                status: "ACTIVE",
                isDeleted: false,
                role: { roleName: "Physician" },
            },
            {
                id: "2",
                firstName: "Julia",
                middleName: null,
                lastName: "Rivera",
                email: "rivera@facility.org",
                status: "ACTIVE",
                isDeleted: false,
                role: { roleName: "Nurse (RN/LPN)" },
            },
            {
                id: "3",
                firstName: "Sarah",
                middleName: null,
                lastName: "Director",
                email: "don@facility.org",
                status: "ACTIVE",
                isDeleted: false,
                role: { roleName: "DON (Director of Nursing)" },
            },
        ]);

        const result = await service.findClinicians();
        expect(result.physicians).toHaveLength(1);
        expect(result.physicians[0].name).toBe("Dr. Robert Chen");
        expect(result.physicians[0].role).toBe("Physician");

        expect(result.nurses).toHaveLength(2);
        expect(result.nurses[0].name).toBe("Julia Rivera, RN");
        expect(result.nurses[1].name).toBe("Sarah Director, DON");
    });
});
