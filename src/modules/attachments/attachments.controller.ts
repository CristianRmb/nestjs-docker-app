import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post(':messageId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('messageId') messageId: string,
    @UploadedFile() file: any, // Using any instead of Express.Multer.File
  ) {
    return this.attachmentsService.create(messageId, {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`, // Adjust based on your file storage strategy
    });
  }

  @Get('message/:messageId')
  async getAttachmentsByMessage(@Param('messageId') messageId: string) {
    return this.attachmentsService.findByMessage(messageId);
  }

  @Get(':id')
  async getAttachment(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Delete(':id')
  async deleteAttachment(@Param('id') id: string) {
    return this.attachmentsService.delete(id);
  }

  @Get('stats/:messageId')
  async getAttachmentStats(@Param('messageId') messageId: string) {
    return this.attachmentsService.getAttachmentStats(messageId);
  }
}
