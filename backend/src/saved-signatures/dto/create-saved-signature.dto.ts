import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export enum SignatureType {
  WRITE = 'WRITE',
  UPLOAD = 'UPLOAD',
  TYPE = 'TYPE',
}

export class CreateSavedSignatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(SignatureType)
  @IsNotEmpty()
  type: SignatureType;

  @IsString()
  @IsNotEmpty()
  imageData: string; // base64 image
}
