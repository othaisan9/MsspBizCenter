import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@msspbiz/shared';
import { BackupService } from './backup.service';
import { Readable } from 'stream';

@ApiTags('backup')
@ApiBearerAuth()
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'JSON 형식으로 데이터 내보내기' })
  @ApiQuery({
    name: 'modules',
    required: false,
    description: '쉼표로 구분된 모듈 목록 (tasks,meetings,contracts,products,users). 비어있으면 전체',
    example: 'tasks,meetings,contracts',
  })
  @ApiResponse({
    status: 200,
    description: 'JSON 파일 다운로드',
  })
  async exportJson(
    @Query('modules') modulesParam: string,
    @CurrentUser('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const modules = modulesParam
      ? modulesParam.split(',').map((m) => m.trim())
      : [];

    const data = await this.backupService.exportJson(tenantId, modules);

    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf-8');
    const stream = Readable.from(buffer);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `backup-${timestamp}.json`;

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(stream);
  }

  @Get('export/csv')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'CSV 형식으로 데이터 내보내기' })
  @ApiQuery({
    name: 'modules',
    required: false,
    description: '쉼표로 구분된 모듈 목록 (tasks,meetings,contracts,products,users). 비어있으면 전체',
    example: 'tasks,meetings,contracts',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV 파일 다운로드',
  })
  async exportCsv(
    @Query('modules') modulesParam: string,
    @CurrentUser('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const modules = modulesParam
      ? modulesParam.split(',').map((m) => m.trim())
      : [];

    const csvData = await this.backupService.exportCsv(tenantId, modules);

    // UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
    const bom = '\uFEFF';
    const buffer = Buffer.from(bom + csvData, 'utf-8');
    const stream = Readable.from(buffer);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `backup-${timestamp}.csv`;

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(stream);
  }

  @Post('import/preview')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'JSON 파일 업로드하여 미리보기 (실제 가져오기 전)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON 백업 파일',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '미리보기 결과 (모듈별 건수)',
    schema: {
      example: {
        version: '1.0',
        exportedAt: '2026-02-09T12:00:00.000Z',
        counts: {
          tasks: 120,
          meetings: 45,
          contracts: 30,
          products: 15,
          users: 10,
        },
      },
    },
  })
  async importPreview(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: 'application/json' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let data: any;
    try {
      data = JSON.parse(file.buffer.toString('utf-8'));
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }

    return this.backupService.importPreview(data);
  }

  @Post('import')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'JSON 파일 업로드하여 실제 가져오기 (트랜잭션 처리)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON 백업 파일',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '가져오기 성공 (모듈별 생성 건수)',
    schema: {
      example: {
        tasks: { created: 120 },
        meetings: { created: 45 },
        contracts: { created: 30 },
        products: { created: 15 },
        users: { created: 0 },
      },
    },
  })
  async importData(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: 'application/json' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let data: any;
    try {
      data = JSON.parse(file.buffer.toString('utf-8'));
    } catch (error) {
      throw new BadRequestException('Invalid JSON format');
    }

    return this.backupService.importData(tenantId, data);
  }
}
