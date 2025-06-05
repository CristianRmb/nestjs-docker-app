import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Attachment } from '../../../generated/prisma';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    messageId: string,
    data: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url?: string;
    },
  ): Promise<Attachment> {
    return this.prisma.attachment.create({
      data: {
        messageId,
        filename: data.originalName, // Use originalName as filename
        url: data.url || '',
        mimeType: data.mimeType,
        size: data.size,
      },
      include: {
        message: true,
      },
    });
  }

  async findByMessage(messageId: string): Promise<Attachment[]> {
    return this.prisma.attachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<Attachment | null> {
    return this.prisma.attachment.findUnique({
      where: { id },
      include: {
        message: true,
      },
    });
  }

  async delete(id: string): Promise<Attachment> {
    return this.prisma.attachment.delete({
      where: { id },
    });
  }

  async getAttachmentStats(messageId: string): Promise<{
    totalCount: number;
    totalSize: number;
    types: { mimeType: string; count: number }[];
  }> {
    const attachments = await this.prisma.attachment.findMany({
      where: { messageId },
      select: {
        mimeType: true,
        size: true,
      },
    });

    const totalCount = attachments.length;
    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);

    const typeMap = new Map<string, number>();
    attachments.forEach((att) => {
      typeMap.set(att.mimeType, (typeMap.get(att.mimeType) || 0) + 1);
    });

    const types = Array.from(typeMap.entries()).map(([mimeType, count]) => ({
      mimeType,
      count,
    }));

    return { totalCount, totalSize, types };
  }
}
