import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from '../../../../generated/prisma';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
