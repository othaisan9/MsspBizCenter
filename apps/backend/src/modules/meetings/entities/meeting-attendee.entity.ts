import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AttendanceType } from '@msspbiz/shared';
import { MeetingNote } from './meeting-note.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('meeting_attendees')
@Unique(['meetingId', 'userId'])
@Index(['meetingId', 'userId'])
export class MeetingAttendee extends BaseEntity {
  @Column({ type: 'uuid', name: 'meeting_id' })
  meetingId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.ATTENDED,
    name: 'attendance_type',
  })
  attendanceType: AttendanceType;

  @ManyToOne(() => MeetingNote, (meeting) => meeting.attendees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'meeting_id' })
  meeting: MeetingNote;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
