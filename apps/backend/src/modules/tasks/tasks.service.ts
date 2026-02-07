import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { TaskStatus } from '@msspbiz/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(
    dto: CreateTaskDto,
    tenantId: string,
    userId: string,
  ): Promise<Task> {
    const task = this.taskRepository.create({
      ...dto,
      tenantId,
      createdBy: userId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return await this.taskRepository.save(task);
  }

  async findAll(query: QueryTaskDto, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      priority,
      assigneeId,
      weekNumber,
      year,
      search,
    } = query;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .where('task.tenantId = :tenantId', { tenantId });

    // Filters
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }
    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }
    if (weekNumber !== undefined) {
      queryBuilder.andWhere('task.weekNumber = :weekNumber', { weekNumber });
    }
    if (year !== undefined) {
      queryBuilder.andWhere('task.year = :year', { year });
    }

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'status',
      'priority',
      'dueDate',
      'weekNumber',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`task.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        page,
        perPage: limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, tenantId },
      relations: ['assignee', 'creator', 'subTasks'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    tenantId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, tenantId);

    Object.assign(task, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    });

    return await this.taskRepository.save(task);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const task = await this.findOne(id, tenantId);
    await this.taskRepository.remove(task);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    tenantId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, tenantId);
    task.status = status;
    return await this.taskRepository.save(task);
  }

  async assignTask(
    id: string,
    assigneeId: string,
    tenantId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, tenantId);
    task.assigneeId = assigneeId;
    return await this.taskRepository.save(task);
  }

  async findWeekly(
    year: number,
    weekNumber: number,
    tenantId: string,
  ): Promise<Task[]> {
    return await this.taskRepository.find({
      where: {
        tenantId,
        year,
        weekNumber,
      },
      relations: ['assignee', 'creator'],
      order: {
        priority: 'ASC',
        createdAt: 'DESC',
      },
    });
  }
}
