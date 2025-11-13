import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseSignaturesService } from '../common/supabase/supabase-signatures.service';
import { CreateSavedSignatureDto } from './dto/create-saved-signature.dto';

@Injectable()
export class SavedSignaturesService {
  constructor(
    private prisma: PrismaService,
    private supabaseSignatures: SupabaseSignaturesService,
  ) {}

  async create(userId: string, dto: CreateSavedSignatureDto) {
    // Convert base64 to buffer
    const base64Data = dto.imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = dto.imageData.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    // Upload to Supabase
    const { url, path } = await this.supabaseSignatures.uploadSignature(
      buffer,
      userId,
      mimeType,
    );

    // Save to database
    const savedSignature = await this.prisma.savedSignature.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        imageUrl: url,
      },
    });

    return savedSignature;
  }

  async findAllByUser(userId: string) {
    return this.prisma.savedSignature.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const signature = await this.prisma.savedSignature.findFirst({
      where: { id, userId },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    return signature;
  }

  async delete(id: string, userId: string) {
    const signature = await this.findOne(id, userId);

    // Extract path from URL
    const urlParts = signature.imageUrl.split('/signatures/');
    const filePath = urlParts[1];

    // Delete from Supabase
    if (filePath) {
      await this.supabaseSignatures.deleteSignature(filePath);
    }

    // Delete from database
    await this.prisma.savedSignature.delete({
      where: { id },
    });

    return { message: 'Signature deleted successfully' };
  }
}
