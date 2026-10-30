import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

describe("UsersController", () => {
    let controller: UsersController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: {} }],
        }).compile();

        controller = module.get<UsersController>(UsersController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    it("should call usersService.findClinicians when getClinicians is called", async () => {
        const mockResult = { physicians: [], nurses: [] };
        const usersService = {
            findClinicians: jest.fn().mockResolvedValue(mockResult),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: usersService }],
        }).compile();

        const ctrl = module.get<UsersController>(UsersController);
        const result = await ctrl.getClinicians();
        expect(usersService.findClinicians).toHaveBeenCalled();
        expect(result).toBe(mockResult);
    });
});
