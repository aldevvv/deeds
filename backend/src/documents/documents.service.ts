import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../common/r2/r2.service';
import { DocumentStatus } from '@prisma/client';
import { PDFDocument } from 'pdf-lib';

interface CreateDocumentDto {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  signatories?: Array<{ userId: string; order: number }>;
}

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
  ) {}

  async getUserDocuments(userId: string, status?: DocumentStatus) {
    const where: any = {
      OR: [
        { createdById: userId },
        { signatures: { some: { userId } } },
      ],
    };

    if (status) {
      where.status = status;
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }

  async getDocumentById(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { createdById: userId },
          { signatures: { some: { userId } } },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                adminTitle: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getDocumentStats(userId: string) {
    const [total, pending, signed, completed] = await Promise.all([
      this.prisma.document.count({
        where: {
          OR: [
            { createdById: userId },
            { signatures: { some: { userId } } },
          ],
        },
      }),
      this.prisma.document.count({
        where: {
          status: DocumentStatus.PENDING,
          OR: [
            { createdById: userId },
            { signatures: { some: { userId } } },
          ],
        },
      }),
      this.prisma.document.count({
        where: {
          status: DocumentStatus.SIGNED,
          OR: [
            { createdById: userId },
            { signatures: { some: { userId } } },
          ],
        },
      }),
      this.prisma.document.count({
        where: {
          status: DocumentStatus.COMPLETED,
          OR: [
            { createdById: userId },
            { signatures: { some: { userId } } },
          ],
        },
      }),
    ]);

    return {
      total,
      pending,
      signed,
      completed,
    };
  }

  async getGlobalStats() {
    const [total, pending, signed, rejected, completed] = await Promise.all([
      this.prisma.document.count(),
      this.prisma.document.count({
        where: { status: DocumentStatus.PENDING },
      }),
      this.prisma.document.count({
        where: { status: DocumentStatus.SIGNED },
      }),
      this.prisma.document.count({
        where: { status: DocumentStatus.REJECTED },
      }),
      this.prisma.document.count({
        where: { status: DocumentStatus.COMPLETED },
      }),
    ]);

    return {
      total,
      pending,
      signed,
      rejected,
      completed,
    };
  }

  async uploadFile(userId: string, file: any) {
    const { path } = await this.r2Service.uploadFile(file, 'documents');

    return {
      filePath: path,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  async createDocument(userId: string, dto: CreateDocumentDto) {
    if (dto.signatories && dto.signatories.length > 0) {
      const userIds = dto.signatories.map((s) => s.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          adminTitle: true,
        },
      });

      if (users.length !== userIds.length) {
        throw new BadRequestException('Some signatories not found');
      }

      // Sort signatories by hierarchy
      const titleHierarchy: Record<string, number> = {
        SENIOR_MANAGER: 1,
        MANAGER_SUB_BIDANG: 2,
        ASISTEN_MANAGER: 3,
      };

      const sortedSignatories = dto.signatories
        .map((sig) => {
          const user = users.find((u) => u.id === sig.userId);
          const adminTitle = user?.adminTitle || '';
          return {
            ...sig,
            adminTitle,
            titlePriority: titleHierarchy[adminTitle] || 999,
          };
        })
        .sort((a, b) => {
          // If same title, keep original order
          if (a.titlePriority === b.titlePriority) {
            return a.order - b.order;
          }
          // Sort by hierarchy (lower number = higher priority)
          return a.titlePriority - b.titlePriority;
        })
        .map((sig, index) => ({
          userId: sig.userId,
          order: index + 1,
        }));

      dto.signatories = sortedSignatories;
    }

    const status = dto.signatories && dto.signatories.length > 0 
      ? DocumentStatus.PENDING 
      : DocumentStatus.DRAFT;

    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        status,
        createdById: userId,
        signatures: dto.signatories
          ? {
              create: dto.signatories.map((s) => ({
                userId: s.userId,
                order: s.order,
                status: 'PENDING',
              })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        signatures: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return document;
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      where: {
        role: 'ADMIN',
        adminTitle: {
          not: null,
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        adminTitle: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  async getAllMySignatures(userId: string) {
    const signatures = await this.prisma.signature.findMany({
      where: {
        userId,
      },
      include: {
        document: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            signatures: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    adminTitle: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return signatures.map(sig => {
      // Find the current signature order that needs to be signed
      const currentSig = sig.document.signatures.find(s => s.status === 'PENDING' && s.signedAt === null);
      
      return {
        ...sig.document,
        uploader: sig.document.createdBy, // Add uploader alias
        currentSignatureOrder: currentSig?.order || sig.order,
        mySignature: {
          id: sig.id,
          order: sig.order,
          status: sig.status,
        },
      };
    });
  }

  async signDocument(userId: string, signatureId: string) {
    const signature = await this.prisma.signature.findUnique({
      where: { id: signatureId },
      include: {
        document: {
          include: {
            signatures: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    if (signature.userId !== userId) {
      throw new BadRequestException('Not authorized to sign this document');
    }

    if (signature.status !== 'PENDING') {
      throw new BadRequestException('Signature already processed');
    }

    // Check if it's the correct order
    const previousSignatures = signature.document.signatures.filter(
      s => s.order < signature.order
    );
    const allPreviousSigned = previousSignatures.every(s => s.signedAt !== null);

    if (!allPreviousSigned) {
      throw new BadRequestException('Previous signers have not signed yet');
    }

    // Update signature
    await this.prisma.signature.update({
      where: { id: signatureId },
      data: {
        status: 'SIGNED',
        signedAt: new Date(),
      },
    });

    // Check if all signatures are complete
    const allSignatures = signature.document.signatures;
    const allSigned = allSignatures.every(
      s => s.id === signatureId || s.signedAt !== null
    );

    if (allSigned) {
      await this.prisma.document.update({
        where: { id: signature.documentId },
        data: {
          status: DocumentStatus.COMPLETED,
        },
      });
    } else {
      await this.prisma.document.update({
        where: { id: signature.documentId },
        data: {
          status: DocumentStatus.SIGNED,
        },
      });
    }

    return { message: 'Document signed successfully' };
  }

  async rejectDocument(userId: string, signatureId: string, reason?: string) {
    const signature = await this.prisma.signature.findUnique({
      where: { id: signatureId },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    if (signature.userId !== userId) {
      throw new BadRequestException('Not authorized to reject this document');
    }

    if (signature.status !== 'PENDING') {
      throw new BadRequestException('Signature already processed');
    }

    await this.prisma.signature.update({
      where: { id: signatureId },
      data: {
        status: 'REJECTED',
      },
    });

    await this.prisma.document.update({
      where: { id: signature.documentId },
      data: {
        status: DocumentStatus.REJECTED,
      },
    });

    return { message: 'Document rejected successfully' };
  }

  async signDocumentWithSignature(
    userId: string,
    signatureId: string,
    signatureImage: string,
    position: { x: number; y: number; width: number; height: number; page: number },
  ) {

    
    const signature = await this.prisma.signature.findUnique({
      where: { id: signatureId },
      include: {
        document: {
          include: {
            signatures: {
              include: {
                user: true, // Include user data for re-embedding
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found');
    }

    if (signature.userId !== userId) {
      throw new BadRequestException('Not authorized to sign this document');
    }

    if (signature.status !== 'PENDING') {
      throw new BadRequestException('Signature already processed');
    }

    // Check if it's the correct order
    const previousSignatures = signature.document.signatures.filter(
      s => s.order < signature.order
    );
    const allPreviousSigned = previousSignatures.every(s => s.signedAt !== null);

    if (!allPreviousSigned) {
      throw new BadRequestException('Previous signers have not signed yet');
    }

    try {
      // Download PDF from R2 - use signedFileUrl if exists (for multiple signatures), otherwise use original fileUrl
      const fileToDownload = signature.document.signedFileUrl || signature.document.fileUrl;
      console.log('[MULTI-SIGNATURE] Loading PDF:', {
        documentId: signature.documentId,
        fileUrl: fileToDownload,
        hasSignedVersion: !!signature.document.signedFileUrl,
      });
      
      const pdfBuffer = await this.r2Service.downloadFile(fileToDownload);
      const pdfBytes = pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength) as ArrayBuffer;
      console.log('[MULTI-SIGNATURE] PDF loaded, size:', pdfBytes.byteLength);

      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // RE-EMBED ALL PREVIOUSLY SIGNED SIGNATURES FIRST
      // Get all signatures that are already signed (except current one)
      console.log('[MULTI-SIGNATURE] All document signatures:', signature.document.signatures.map(s => ({
        id: s.id,
        userId: s.userId,
        status: s.status,
        order: s.order,
        hasSignatureData: !!s.signatureData,
        isCurrent: s.id === signatureId,
      })));
      
      const previousSignatures = signature.document.signatures.filter(
        sig => sig.status === 'SIGNED' && sig.signatureData && sig.id !== signatureId
      );

      console.log(`[MULTI-SIGNATURE] Re-embedding ${previousSignatures.length} previous signatures:`, 
        previousSignatures.map(s => ({ id: s.id, order: s.order })));

      for (const prevSig of previousSignatures) {
        try {
          if (!prevSig.signatureData) continue;
          
          const sigData = JSON.parse(prevSig.signatureData);
          const prevPosition = sigData.position;
          const prevSignatureImage = sigData.signatureImage;
          
          console.log(`[MULTI-SIGNATURE] Previous signature ${prevSig.id}:`, {
            hasPosition: !!prevPosition,
            hasImage: !!prevSignatureImage,
            page: prevPosition?.page,
          });
          
          if (prevPosition && prevPosition.page && prevSignatureImage) {
            const prevPage = pages[prevPosition.page - 1];
            if (prevPage) {
              const { height: prevPageHeight } = prevPage.getSize();
              
              // Re-embed the previous signature image
              const prevSignatureImageBytes = Buffer.from(
                prevSignatureImage.replace(/^data:image\/\w+;base64,/, ''),
                'base64',
              );
              
              let prevEmbeddedImage;
              if (prevSignatureImage.includes('image/png')) {
                prevEmbeddedImage = await pdfDoc.embedPng(prevSignatureImageBytes);
              } else {
                prevEmbeddedImage = await pdfDoc.embedJpg(prevSignatureImageBytes);
              }
              
              // Draw previous signature on PDF
              prevPage.drawImage(prevEmbeddedImage, {
                x: prevPosition.x,
                y: prevPageHeight - prevPosition.y - prevPosition.height,
                width: prevPosition.width,
                height: prevPosition.height,
              });
              
              console.log(`[MULTI-SIGNATURE] ✓ Successfully re-embedded signature ${prevSig.id} on page ${prevPosition.page}`);
            }
          }
        } catch (e) {
          // Log error but continue with other signatures
          console.error(`[MULTI-SIGNATURE] ✗ Error re-embedding signature ${prevSig.id}:`, e);
          // Don't throw - continue with other signatures
        }
      }
      
      console.log('[MULTI-SIGNATURE] Finished re-embedding previous signatures, now adding new signature');

      // NOW ADD THE NEW SIGNATURE
      const page = pages[position.page - 1]; // PDF pages are 0-indexed

      if (!page) {
        throw new BadRequestException('Invalid page number');
      }

      // Convert base64 signature image to bytes
      const signatureImageBytes = Buffer.from(
        signatureImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );

      // Embed signature image
      let embeddedImage;
      if (signatureImage.includes('image/png')) {
        embeddedImage = await pdfDoc.embedPng(signatureImageBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(signatureImageBytes);
      }

      // Get page dimensions
      const { height: pageHeight } = page.getSize();

      // Draw NEW signature on PDF (flip Y coordinate because PDF coordinate system starts from bottom)
      page.drawImage(embeddedImage, {
        x: position.x,
        y: pageHeight - position.y - position.height,
        width: position.width,
        height: position.height,
      });

      // Save modified PDF
      const signedPdfBytes = await pdfDoc.save();
      console.log('[MULTI-SIGNATURE] PDF saved with all signatures, new size:', signedPdfBytes.byteLength);

      // Upload signed PDF to R2 with new name
      const originalFileName = signature.document.fileName;
      const fileExt = originalFileName.split('.').pop();
      const baseName = originalFileName.replace(`.${fileExt}`, '');
      const signedFileName = `${baseName}_signed_${Date.now()}.${fileExt}`;

      const signedFile = {
        originalname: signedFileName,
        buffer: Buffer.from(signedPdfBytes),
        mimetype: 'application/pdf',
        size: signedPdfBytes.byteLength,
      };

      const { path: signedFilePath } = await this.r2Service.uploadFile(
        signedFile as any,
        'documents',
      );
      console.log('[MULTI-SIGNATURE] Uploaded signed PDF to:', signedFilePath);

      // Update signature record - STORE SIGNATURE IMAGE for re-embedding later
      await this.prisma.signature.update({
        where: { id: signatureId },
        data: {
          status: 'SIGNED',
          signedAt: new Date(),
          signatureData: JSON.stringify({
            position,
            signatureImage, // Store the base64 image for re-embedding
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // Check if all signatures are complete
      const allSignatures = signature.document.signatures;
      const allSigned = allSignatures.every(
        s => s.id === signatureId || s.signedAt !== null
      );

      // Update document with signed PDF path (keep original fileUrl, update signedFileUrl)
      if (allSigned) {
        console.log('[MULTI-SIGNATURE] All signatures complete, marking as COMPLETED');
        await this.prisma.document.update({
          where: { id: signature.documentId },
          data: {
            status: DocumentStatus.COMPLETED,
            signedFileUrl: signedFilePath, // Store signed PDF separately
          },
        });
      } else {
        console.log('[MULTI-SIGNATURE] Partially signed, marking as SIGNED');
        await this.prisma.document.update({
          where: { id: signature.documentId },
          data: {
            status: DocumentStatus.SIGNED,
            signedFileUrl: signedFilePath, // Store partially signed PDF
          },
        });
      }

      console.log('[MULTI-SIGNATURE] ✓✓✓ SUCCESS - Document signed successfully ✓✓✓');
      return { message: 'Document signed successfully with signature embedded' };
    } catch (error) {
      console.error('Error embedding signature:', error);
      throw new BadRequestException('Failed to embed signature in PDF');
    }
  }

  async getSignedUrl(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: true,
        signatures: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access (creator or signatory)
    const isCreator = document.createdById === userId;
    const isSignatory = document.signatures.some((sig) => sig.userId === userId);

    if (!isCreator && !isSignatory) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Generate signed URL valid for 1 hour
    const signedUrl = await this.r2Service.getSignedUrl(document.fileUrl, 3600);

    return { url: signedUrl };
  }

  async downloadDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        createdBy: true,
        signatures: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access (creator or signatory)
    const isCreator = document.createdById === userId;
    const isSignatory = document.signatures.some((sig) => sig.userId === userId);

    if (!isCreator && !isSignatory) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // Use signed file if available, otherwise use original file
    const fileUrl = document.signedFileUrl || document.fileUrl;
    const buffer = await this.r2Service.downloadFile(fileUrl);

    return {
      blob: buffer,
      fileName: document.fileName,
    };
  }
}
