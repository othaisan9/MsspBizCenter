import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async findAll(tenantId: string): Promise<Tag[]> {
    return this.tagRepo.find({
      where: { tenantId },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async create(dto: CreateTagDto, tenantId: string): Promise<Tag> {
    const existing = await this.tagRepo.findOne({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`태그 "${dto.name}"이(가) 이미 존재합니다`);
    }

    const maxOrder = await this.tagRepo
      .createQueryBuilder('tag')
      .select('COALESCE(MAX(tag.display_order), -1)', 'max')
      .where('tag.tenant_id = :tenantId', { tenantId })
      .getRawOne();

    const tag = this.tagRepo.create({
      name: dto.name,
      tenantId,
      displayOrder: (maxOrder?.max ?? -1) + 1,
    });

    return this.tagRepo.save(tag);
  }

  async update(
    id: string,
    dto: UpdateTagDto,
    tenantId: string,
  ): Promise<Tag> {
    const tag = await this.tagRepo.findOne({
      where: { id, tenantId },
    });
    if (!tag) {
      throw new NotFoundException('태그를 찾을 수 없습니다');
    }

    if (dto.name !== tag.name) {
      const existing = await this.tagRepo.findOne({
        where: { tenantId, name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`태그 "${dto.name}"이(가) 이미 존재합니다`);
      }

      // 모든 Task에서 기존 태그명 → 새 태그명으로 변경
      await this.taskRepo
        .createQueryBuilder()
        .update(Task)
        .set({
          tags: () =>
            `array_replace(tags, '${tag.name.replace(/'/g, "''")}', '${dto.name.replace(/'/g, "''")}')`,
        })
        .where('tenant_id = :tenantId', { tenantId })
        .andWhere(':oldName = ANY(tags)', { oldName: tag.name })
        .execute();

      tag.name = dto.name;
    }

    return this.tagRepo.save(tag);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const tag = await this.tagRepo.findOne({
      where: { id, tenantId },
    });
    if (!tag) {
      throw new NotFoundException('태그를 찾을 수 없습니다');
    }

    // 모든 Task에서 해당 태그 제거
    await this.taskRepo
      .createQueryBuilder()
      .update(Task)
      .set({
        tags: () =>
          `array_remove(tags, '${tag.name.replace(/'/g, "''")}')`,
      })
      .where('tenant_id = :tenantId', { tenantId })
      .andWhere(':tagName = ANY(tags)', { tagName: tag.name })
      .execute();

    await this.tagRepo.remove(tag);
  }
}
