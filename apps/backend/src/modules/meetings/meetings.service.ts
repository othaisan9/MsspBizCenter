import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { MeetingNote } from './entities/meeting-note.entity';
import { MeetingAttendee } from './entities/meeting-attendee.entity';
import { ActionItem } from './entities/action-item.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QueryMeetingDto } from './dto/query-meeting.dto';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { ManageAttendeeDto } from './dto/manage-attendee.dto';
import {
  MeetingNoteStatus,
  AttendanceType,
  ActionItemStatus,
} from '@msspbiz/shared';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(MeetingNote)
    private readonly meetingRepository: Repository<MeetingNote>,
    @InjectRepository(MeetingAttendee)
    private readonly attendeeRepository: Repository<MeetingAttendee>,
    @InjectRepository(ActionItem)
    private readonly actionItemRepository: Repository<ActionItem>,
  ) {}

  async create(
    dto: CreateMeetingDto,
    tenantId: string,
    userId: string,
  ): Promise<MeetingNote> {
    const meeting = this.meetingRepository.create({
      ...dto,
      meetingDate: new Date(dto.meetingDate),
      tenantId,
      createdBy: userId,
      status: MeetingNoteStatus.DRAFT,
    });

    const savedMeeting = await this.meetingRepository.save(meeting);

    // 참석자 일괄 등록
    if (dto.attendeeIds && dto.attendeeIds.length > 0) {
      const attendees = dto.attendeeIds.map((userId) =>
        this.attendeeRepository.create({
          meetingId: savedMeeting.id,
          userId,
          attendanceType: AttendanceType.ATTENDED,
        }),
      );
      await this.attendeeRepository.save(attendees);
    }

    return this.findOne(savedMeeting.id, tenantId);
  }

  async findAll(query: QueryMeetingDto, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'meetingDate',
      sortOrder = 'DESC',
      meetingType,
      status,
      startDate,
      endDate,
      search,
    } = query;

    const queryBuilder = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('meeting.attendees', 'attendees')
      .leftJoinAndSelect('attendees.user', 'attendee_user')
      .leftJoinAndSelect('meeting.actionItems', 'actionItems')
      .leftJoinAndSelect('actionItems.assignee', 'assignee')
      .leftJoinAndSelect('meeting.creator', 'creator');

    // 회의 유형 필터
    if (meetingType) {
      queryBuilder.andWhere('meeting.meetingType = :meetingType', {
        meetingType,
      });
    }

    // 상태 필터
    if (status) {
      queryBuilder.andWhere('meeting.status = :status', { status });
    }

    // 날짜 범위 필터
    if (startDate && endDate) {
      queryBuilder.andWhere('meeting.meetingDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('meeting.meetingDate >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('meeting.meetingDate <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    // 검색 (제목, 내용)
    if (search) {
      queryBuilder.andWhere(
        '(meeting.title ILIKE :search OR meeting.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 정렬
    const orderField = `meeting.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, tenantId: string): Promise<MeetingNote> {
    const meeting = await this.meetingRepository.findOne({
      where: { id, tenantId },
      relations: [
        'attendees',
        'attendees.user',
        'actionItems',
        'actionItems.assignee',
        'creator',
      ],
    });

    if (!meeting) {
      throw new NotFoundException(`회의록 ID ${id}를 찾을 수 없습니다.`);
    }

    return meeting;
  }

  async update(
    id: string,
    dto: UpdateMeetingDto,
    tenantId: string,
  ): Promise<MeetingNote> {
    const meeting = await this.findOne(id, tenantId);

    // 발행된 회의록은 수정 제한 (선택적 구현)
    if (meeting.status === MeetingNoteStatus.PUBLISHED) {
      throw new ForbiddenException('발행된 회의록은 수정할 수 없습니다.');
    }

    Object.assign(meeting, {
      ...dto,
      meetingDate: dto.meetingDate ? new Date(dto.meetingDate) : meeting.meetingDate,
    });

    await this.meetingRepository.save(meeting);

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const meeting = await this.findOne(id, tenantId);
    await this.meetingRepository.remove(meeting);
  }

  async publish(id: string, tenantId: string): Promise<MeetingNote> {
    const meeting = await this.findOne(id, tenantId);

    if (meeting.status === MeetingNoteStatus.PUBLISHED) {
      throw new BadRequestException('이미 발행된 회의록입니다.');
    }

    meeting.status = MeetingNoteStatus.PUBLISHED;
    await this.meetingRepository.save(meeting);

    return this.findOne(id, tenantId);
  }

  async addAttendee(
    meetingId: string,
    dto: ManageAttendeeDto,
    tenantId: string,
  ): Promise<MeetingAttendee> {
    const meeting = await this.findOne(meetingId, tenantId);

    // 중복 체크
    const existing = await this.attendeeRepository.findOne({
      where: { meetingId, userId: dto.userId },
    });

    if (existing) {
      throw new BadRequestException('이미 등록된 참석자입니다.');
    }

    const attendee = this.attendeeRepository.create({
      meetingId,
      userId: dto.userId,
      attendanceType: dto.attendanceType || AttendanceType.ATTENDED,
    });

    return this.attendeeRepository.save(attendee);
  }

  async removeAttendee(
    meetingId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    const meeting = await this.findOne(meetingId, tenantId);

    const attendee = await this.attendeeRepository.findOne({
      where: { meetingId, userId },
    });

    if (!attendee) {
      throw new NotFoundException('참석자를 찾을 수 없습니다.');
    }

    await this.attendeeRepository.remove(attendee);
  }

  async createActionItem(
    meetingId: string,
    dto: CreateActionItemDto,
    tenantId: string,
  ): Promise<ActionItem> {
    const meeting = await this.findOne(meetingId, tenantId);

    const actionItem = this.actionItemRepository.create({
      ...dto,
      meetingId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: ActionItemStatus.PENDING,
    });

    return this.actionItemRepository.save(actionItem);
  }

  async updateActionItem(
    meetingId: string,
    itemId: string,
    dto: UpdateActionItemDto,
    tenantId: string,
  ): Promise<ActionItem> {
    const meeting = await this.findOne(meetingId, tenantId);

    const actionItem = await this.actionItemRepository.findOne({
      where: { id: itemId, meetingId },
    });

    if (!actionItem) {
      throw new NotFoundException('Action Item을 찾을 수 없습니다.');
    }

    Object.assign(actionItem, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : actionItem.dueDate,
    });

    return this.actionItemRepository.save(actionItem);
  }

  async convertActionItemToTask(
    meetingId: string,
    itemId: string,
    tenantId: string,
  ): Promise<ActionItem> {
    const meeting = await this.findOne(meetingId, tenantId);

    const actionItem = await this.actionItemRepository.findOne({
      where: { id: itemId, meetingId },
    });

    if (!actionItem) {
      throw new NotFoundException('Action Item을 찾을 수 없습니다.');
    }

    if (actionItem.taskId) {
      throw new BadRequestException('이미 Task로 변환되었습니다.');
    }

    // TODO: TasksService를 통해 실제 Task 생성
    // 현재는 placeholder로 UUID 생성
    // 실제 구현 시 TasksService.create() 호출 필요
    throw new BadRequestException(
      'Task 변환 기능은 TasksService 구현 후 활성화됩니다.',
    );

    // 예상 코드:
    // const task = await this.tasksService.create({
    //   title: actionItem.title,
    //   assigneeId: actionItem.assigneeId,
    //   dueDate: actionItem.dueDate,
    // }, tenantId, userId);
    //
    // actionItem.taskId = task.id;
    // return this.actionItemRepository.save(actionItem);
  }
}
