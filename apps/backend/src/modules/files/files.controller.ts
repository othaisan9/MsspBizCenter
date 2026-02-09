import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FilesService } from './files.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';
import type { RequestUser } from '@msspbiz/shared';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityType: {
          type: 'string',
          description: '연결할 엔티티 타입 (task, meeting, contract)',
          nullable: true,
        },
        entityId: {
          type: 'string',
          format: 'uuid',
          description: '연결할 엔티티 ID',
          nullable: true,
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: '파일 업로드 성공', type: FileResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: RequestUser,
  ): Promise<FileResponseDto> {
    const uploadedFile = await this.filesService.upload(
      file,
      user.id,
      user.tenantId,
      dto.entityType,
      dto.entityId,
    );

    return {
      id: uploadedFile.id,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
      entityType: uploadedFile.entityType,
      entityId: uploadedFile.entityId,
      uploadedById: uploadedFile.uploadedById,
      createdAt: uploadedFile.createdAt,
    };
  }

  @Get()
  @ApiOperation({ summary: '파일 목록 조회 (엔티티별)' })
  @ApiQuery({ name: 'entityType', required: true, example: 'task' })
  @ApiQuery({ name: 'entityId', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: '파일 목록 조회 성공', type: [FileResponseDto] })
  async getFiles(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<FileResponseDto[]> {
    const files = await this.filesService.findByEntity(
      entityType,
      entityId,
      user.tenantId,
    );

    return files.map((file) => ({
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      entityType: file.entityType,
      entityId: file.entityId,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: '파일 정보 조회' })
  @ApiResponse({ status: 200, description: '파일 정보 조회 성공', type: FileResponseDto })
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<FileResponseDto> {
    const file = await this.filesService.findOne(id, user.tenantId);

    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      entityType: file.entityType,
      entityId: file.entityId,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: '파일 다운로드' })
  @ApiResponse({ status: 200, description: '파일 다운로드 성공' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.findOne(id, user.tenantId);
    const filePath = await this.filesService.getFilePath(id, user.tenantId);

    const fileStream = fs.createReadStream(filePath);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      'Content-Length': file.size,
    });

    return new StreamableFile(fileStream);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: '파일 삭제 (OWNER, ADMIN만 가능)' })
  @ApiResponse({ status: 204, description: '파일 삭제 성공' })
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<void> {
    await this.filesService.delete(id, user.id, user.tenantId);
  }
}
