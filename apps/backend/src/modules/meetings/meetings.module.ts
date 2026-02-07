import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { MeetingNote } from './entities/meeting-note.entity';
import { MeetingAttendee } from './entities/meeting-attendee.entity';
import { ActionItem } from './entities/action-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingNote, MeetingAttendee, ActionItem]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
