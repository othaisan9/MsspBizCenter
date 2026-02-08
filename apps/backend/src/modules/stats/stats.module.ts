import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Task } from '../tasks/entities/task.entity';
import { MeetingNote } from '../meetings/entities/meeting-note.entity';
import { Contract } from '../contracts/entities/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, MeetingNote, Contract])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
