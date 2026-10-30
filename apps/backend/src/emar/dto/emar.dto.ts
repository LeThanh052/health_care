import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from "class-validator";

export class AdministerMedicationDto {
    @IsString()
    @IsNotEmpty()
    orderId!: string;

    @IsString()
    @IsNotEmpty()
    status!: "GIVEN" | "MISSED" | "REFUSED" | "HELD";

    @IsString()
    @IsOptional()
    overrideReason?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    witnessedBy?: string;
}

export class CreateMedicationOrderDto {
    @IsString()
    @IsNotEmpty()
    residentId!: string;

    @IsString()
    @IsNotEmpty()
    drugName!: string;

    @IsString()
    @IsNotEmpty()
    dosage!: string;

    @IsString()
    @IsNotEmpty()
    route!: string;

    @IsString()
    @IsNotEmpty()
    frequency!: string;

    @IsArray()
    @IsOptional()
    scheduleTimes?: string[];

    @IsBoolean()
    @IsOptional()
    isControlledSubstance?: boolean;
}
