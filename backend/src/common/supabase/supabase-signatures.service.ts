import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseSignaturesService {
  constructor(private supabaseService: SupabaseService) {}

  async uploadSignature(
    file: Buffer,
    userId: string,
    mimeType: string,
  ): Promise<{ path: string; url: string }> {
    const fileExt = mimeType.split('/')[1] || 'png';
    const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from('signatures')
      .upload(filePath, file, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload signature failed: ${error.message}`);
    }

    const { data: urlData } = this.supabaseService
      .getClient()
      .storage.from('signatures')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl,
    };
  }

  async deleteSignature(filePath: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .storage.from('signatures')
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete signature failed: ${error.message}`);
    }
  }
}
