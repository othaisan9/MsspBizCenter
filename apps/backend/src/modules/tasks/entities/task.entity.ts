import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { TaskStatus, TaskPriority } from '@msspbiz/shared';
import { User } from '../../auth/entities/user.entity';

@Entity('weekly_tasks')
@Index(['tenantId', 'year', 'weekNumber'])
@Index(['tenantId', 'assigneeId'])
@Index(['tenantId', 'status'])
export class Task extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', name: 'week_number' })
  weekNumber: number;

  @Column({ type: 'int' })
  year: number;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({ type: 'uuid', nullable: true, name: 'assignee_id' })
  assigneeId: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'estimated_hours' })
  estimatedHours: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'actual_hours' })
  actualHours: number | null;

  @Column({ type: 'text', array: true, nullable: true, default: () => 'ARRAY[]::text[]' })
  tags: string[] | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_task_id' })
  parentTaskId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attachments: any | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => Task, (task) => task.subTasks, { nullable: true })
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks: Task[];
}
