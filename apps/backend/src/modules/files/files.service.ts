import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async upload(
    file: Express.Multer.File,
    userId: string,
    tenantId: string,
    entityType?: string,
    entityId?: string,
  ): Promise<File> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Path traversal 방지: tenantId 검증
    if (!/^[a-zA-Z0-9\-]+$/.test(tenantId)) {
      throw new BadRequestException('Invalid tenant ID');
    }

    // uploads/{tenantId}/{yyyy-MM}/{uuid}.{ext}
    const ext = path.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    const relativePath = path.join(tenantId, `${year}-${month}`);
    const uploadDir = path.join(process.cwd(), 'uploads', relativePath);
    const filePath = path.join(uploadDir, storedName);

    // 디렉토리 생성
    await fs.mkdir(uploadDir, { recursive: true });

    // 파일 저장
    await fs.writeFile(filePath, file.buffer);

    // DB 기록
    const fileEntity = this.fileRepository.create({
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      size: file.size,
      path: path.join(relativePath, storedName),
      entityType: entityType || null,
      entityId: entityId || null,
      uploadedById: userId,
      tenantId,
    });

    return this.fileRepository.save(fileEntity);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<File[]> {
    return this.fileRepository.find({
      where: {
        entityType,
        entityId,
        tenantId,
      },
      relations: ['uploadedBy'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string, tenantId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, tenantId },
      relations: ['uploadedBy'],
    });

    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    return file;
  }

  async delete(id: string, userId: string, tenantId: string): Promise<void> {
    const file = await this.findOne(id, tenantId);

    // 업로드한 사용자만 삭제 가능 (또는 권한 확인 로직 추가)
    if (file.uploadedById !== userId) {
      throw new ForbiddenException('파일을 삭제할 권한이 없습니다.');
    }

    // 물리 파일 삭제
    const filePath = path.join(process.cwd(), 'uploads', file.path);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // 파일이 이미 삭제되었을 수 있음
      console.error('파일 삭제 실패:', error);
    }

    // DB 삭제
    await this.fileRepository.remove(file);
  }

  async getFilePath(id: string, tenantId: string): Promise<string> {
    const file = await this.findOne(id, tenantId);
    return path.join(process.cwd(), 'uploads', file.path);
  }
}
