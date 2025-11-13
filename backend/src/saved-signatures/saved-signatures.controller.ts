import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SavedSignaturesService } from './saved-signatures.service';
import { CreateSavedSignatureDto } from './dto/create-saved-signature.dto';

@Controller('saved-signatures')
@UseGuards(JwtAuthGuard)
export class SavedSignaturesController {
  constructor(private readonly savedSignaturesService: SavedSignaturesService) {}

  @Post()
  async create(@Req() req, @Body() dto: CreateSavedSignatureDto) {
    return this.savedSignaturesService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Req() req) {
    return this.savedSignaturesService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    return this.savedSignaturesService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    return this.savedSignaturesService.delete(id, req.user.userId);
  }
}
