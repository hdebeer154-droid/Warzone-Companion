import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MatchQueryDto {
  @IsOptional() @IsString() mode?: string;
  @IsOptional() @IsString() map?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize: number = 20;
}

export class CreateMatchDto {
  @IsOptional() @IsString() externalMatchId?: string;
  @IsOptional() @IsString() mode?: string;
  @IsOptional() @IsString() map?: string;
  @IsOptional() @IsString() playlist?: string;
  @IsOptional() @IsString() startedAt?: string;
  @IsOptional() @IsString() endedAt?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) kills?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) deaths?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) assists?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) placement?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) damage?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) xp?: number;
}
