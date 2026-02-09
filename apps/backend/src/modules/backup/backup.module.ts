import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
// 엔티티 import
import { Task } from '../tasks/entities/task.entity';
import { MeetingNote } from '../meetings/entities/meeting-note.entity';
import { MeetingAttendee } from '../meetings/entities/meeting-attendee.entity';
import { ActionItem } from '../meetings/entities/action-item.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { ContractProduct } from '../products/entities/contract-product.entity';
import { ContractHistory } from '../contracts/entities/contract-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductOption } from '../products/entities/product-option.entity';
import { User } from '../auth/entities/user.entity';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      MeetingNote,
      MeetingAttendee,
      ActionItem,
      Contract,
      ContractProduct,
      ContractHistory,
      Product,
      ProductOption,
      User,
    ]),
    ContractsModule, // EncryptionService export됨
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
