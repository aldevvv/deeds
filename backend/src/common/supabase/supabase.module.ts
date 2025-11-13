import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SupabaseSignaturesService } from './supabase-signatures.service';

@Global()
@Module({
  providers: [SupabaseService, SupabaseSignaturesService],
  exports: [SupabaseService, SupabaseSignaturesService],
})
export class SupabaseModule {}
