import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentStatus } from '@prisma/client';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get('stats')
  async getDocumentStats(@Request() req) {
    return this.documentsService.getDocumentStats(req.user.userId);
  }

  @Get('stats/global')
  async getGlobalStats() {
    return this.documentsService.getGlobalStats();
  }

  @Get('users/all')
  async getAllUsers() {
    return this.documentsService.getAllUsers();
  }

  @Get('pending-signatures')
  async getPendingSignatures(@Request() req) {
    return this.documentsService.getAllMySignatures(req.user.userId);
  }
  
  @Get('my-signatures')
  async getMySignatures(@Request() req) {
    return this.documentsService.getAllMySignatures(req.user.userId);
  }

  @Get('preview/:id')
  async previewDocument(
    @Param('id') documentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { blob, fileName } = await this.documentsService.downloadDocument(
      req.user.userId,
      documentId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    const buffer = Buffer.from(await blob.arrayBuffer());
    res.send(buffer);
  }

  @Get('view/:id')
  async getSignedUrl(@Param('id') documentId: string, @Request() req) {
    return this.documentsService.getSignedUrl(req.user.userId, documentId);
  }

  @Get('download/:id')
  async downloadDocument(
    @Param('id') documentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const { blob, fileName } = await this.documentsService.downloadDocument(
      req.user.userId,
      documentId,
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    const buffer = Buffer.from(await blob.arrayBuffer());
    res.send(buffer);
  }

  @Get(':id')
  async getDocumentById(@Request() req, @Param('id') id: string) {
    return this.documentsService.getDocumentById(id, req.user.userId);
  }

  @Get()
  async getUserDocuments(
    @Request() req,
    @Query('status') status?: DocumentStatus,
  ) {
    return this.documentsService.getUserDocuments(req.user.userId, status);
  }

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF, DOC, and DOCX are allowed');
    }

    // Validate file size (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 100MB');
    }

    return this.documentsService.uploadFile(req.user.userId, file);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(@Request() req, @Body() dto: CreateDocumentDto) {
    return this.documentsService.createDocument(req.user.userId, dto);
  }

  @Post('sign/:signatureId')
  @HttpCode(HttpStatus.OK)
  async signDocument(@Request() req, @Param('signatureId') signatureId: string) {
    return this.documentsService.signDocument(req.user.userId, signatureId);
  }

  @Post('sign/:signatureId/with-signature')
  @HttpCode(HttpStatus.OK)
  async signDocumentWithSignature(
    @Request() req,
    @Param('signatureId') signatureId: string,
    @Body() body: { signatureImage: string; position: any },
  ) {
    return this.documentsService.signDocumentWithSignature(
      req.user.userId,
      signatureId,
      body.signatureImage,
      body.position,
    );
  }

  @Post('reject/:signatureId')
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @Request() req,
    @Param('signatureId') signatureId: string,
    @Body() body: { reason?: string },
  ) {
    return this.documentsService.rejectDocument(req.user.userId, signatureId, body.reason);
  }
}
