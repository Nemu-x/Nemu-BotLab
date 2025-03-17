import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateBotCommandDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 