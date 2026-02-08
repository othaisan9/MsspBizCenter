import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@msspbiz/shared';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 팀원 추가 (같은 테넌트에 새 사용자 생성)
   */
  async create(
    dto: CreateUserDto,
    tenantId: string,
    currentUser: { role: UserRole },
  ) {
    // 이메일 중복 체크
    const existing = await this.userRepository.findOne({
      where: { email: dto.email, tenantId },
    });
    if (existing) {
      throw new ConflictException('이미 등록된 이메일입니다.');
    }

    // ADMIN 역할 부여는 OWNER만 가능
    if (dto.role === UserRole.ADMIN && currentUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('ADMIN 역할은 OWNER만 부여할 수 있습니다.');
    }
    if (dto.role === UserRole.OWNER) {
      throw new ForbiddenException('OWNER 역할은 부여할 수 없습니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role || UserRole.VIEWER,
      tenantId,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    const { passwordHash: _, ...result } = saved;
    return result;
  }

  /**
   * 사용자 목록 조회 (페이지네이션 + 필터)
   */
  async findAll(tenantId: string, query: QueryUserDto) {
    const { page = 1, limit = 20, search, role } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.name = Like(`%${search}%`);
      // 이메일 검색도 추가하려면 다음 사용 (OR 조건):
      // where: [
      //   { tenantId, name: Like(`%${search}%`) },
      //   { tenantId, email: Like(`%${search}%`) },
      // ]
    }

    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      select: [
        'id',
        'email',
        'name',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 사용자 상세 조회
   */
  async findOne(id: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      select: [
        'id',
        'email',
        'name',
        'role',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * 사용자 수정
   */
  async update(
    id: string,
    tenantId: string,
    updateUserDto: UpdateUserDto,
    currentUser: { id: string; role: UserRole },
  ) {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 자기 자신의 역할 변경 금지
    if (id === currentUser.id && updateUserDto.role && updateUserDto.role !== user.role) {
      throw new BadRequestException('Cannot change your own role');
    }

    // OWNER만 ADMIN 역할 부여 가능
    if (
      updateUserDto.role === UserRole.OWNER &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only OWNER can assign OWNER role');
    }

    if (
      updateUserDto.role === UserRole.ADMIN &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new ForbiddenException('Only OWNER can assign ADMIN role');
    }

    // 업데이트
    Object.assign(user, updateUserDto);
    const updated = await this.userRepository.save(user);

    // 비밀번호 해시 제거
    const { passwordHash, ...result } = updated;
    return result;
  }

  /**
   * 사용자 비활성화 (삭제 대신)
   */
  async deactivate(id: string, tenantId: string, currentUserId: string) {
    // 자기 자신 비활성화 금지
    if (id === currentUserId) {
      throw new BadRequestException('Cannot deactivate yourself');
    }

    const user = await this.userRepository.findOne({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'User deactivated successfully' };
  }
}
