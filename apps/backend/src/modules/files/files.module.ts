import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File } from './entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    MulterModule.register({
      storage: undefined, // 메모리 스토리지 사용 (buffer)
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          // 이미지
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          // PDF
          'application/pdf',
          // Excel
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          // Word
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          // PowerPoint
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint',
          // CSV
          'text/csv',
          // Text
          'text/plain',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('허용되지 않는 파일 형식입니다.'), false);
        }
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
