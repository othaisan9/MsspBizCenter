import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ActionItemStatus } from '@msspbiz/shared';
import { MeetingNote } from './meeting-note.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('action_items')
export class ActionItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'uuid', name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @Column({ type: 'timestamp', name: 'due_date', nullable: true })
  dueDate?: Date;

  @Column({
    type: 'enum',
    enum: ActionItemStatus,
    default: ActionItemStatus.PENDING,
  })
  status: ActionItemStatus;

  @Column({ type: 'uuid', name: 'task_id', nullable: true })
  taskId?: string;

  @ManyToOne(() => MeetingNote, (meeting) => meeting.actionItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id' })
  meeting: MeetingNote;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;
}
