import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
