import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    file: any,
    folder: string = 'documents',
  ): Promise<{ path: string; url: string }> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl,
    };
  }

  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
