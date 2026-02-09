import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { EncryptionService } from './services/encryption.service';
import { Contract } from './entities/contract.entity';
import { ContractHistory } from './entities/contract-history.entity';
import { ContractProduct } from '../products/entities/contract-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, ContractHistory, ContractProduct])],
  controllers: [ContractsController],
  providers: [ContractsService, EncryptionService],
  exports: [ContractsService, EncryptionService],
})
export class ContractsModule {}
