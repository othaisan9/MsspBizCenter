import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { MeetingType, MeetingNoteStatus } from '@msspbiz/shared';
import { User } from '../../auth/entities/user.entity';
import { MeetingAttendee } from './meeting-attendee.entity';
import { ActionItem } from './action-item.entity';

export interface AgendaItem {
  title: string;
  description?: string;
}

export interface DecisionItem {
  title: string;
  description?: string;
}

export interface AttachmentItem {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
}

@Entity('meeting_notes')
@Index(['tenantId', 'meetingDate'])
@Index(['tenantId', 'status'])
export class MeetingNote extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'timestamp', name: 'meeting_date' })
  meetingDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({
    type: 'enum',
    enum: MeetingType,
    default: MeetingType.REGULAR,
    name: 'meeting_type',
  })
  meetingType: MeetingType;

  @Column({ type: 'jsonb', nullable: true })
  agenda?: AgendaItem[];

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'jsonb', nullable: true })
  decisions?: DecisionItem[];

  @Column({ type: 'jsonb', nullable: true })
  attachments?: AttachmentItem[];

  @Column({
    type: 'enum',
    enum: MeetingNoteStatus,
    default: MeetingNoteStatus.DRAFT,
  })
  status: MeetingNoteStatus;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => MeetingAttendee, (attendee) => attendee.meeting, {
    cascade: true,
  })
  attendees: MeetingAttendee[];

  @OneToMany(() => ActionItem, (item) => item.meeting, { cascade: true })
  actionItems: ActionItem[];
}
