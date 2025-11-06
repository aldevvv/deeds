import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SignatoryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  order: number;
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsNumber()
  fileSize: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SignatoryDto)
  signatories?: SignatoryDto[];
}
