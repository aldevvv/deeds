import { Module } from '@nestjs/common';
import { SavedSignaturesController } from './saved-signatures.controller';
import { SavedSignaturesService } from './saved-signatures.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SavedSignaturesController],
  providers: [SavedSignaturesService],
  exports: [SavedSignaturesService],
})
export class SavedSignaturesModule {}
