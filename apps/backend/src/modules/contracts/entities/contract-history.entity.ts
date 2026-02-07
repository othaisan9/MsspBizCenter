import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Contract } from './contract.entity';
import { User } from '../../auth/entities/user.entity';

export enum ContractHistoryAction {
  CREATED = 'created',
  UPDATED = 'updated',
  RENEWED = 'renewed',
  TERMINATED = 'terminated',
}

@Entity('contract_history')
export class ContractHistory extends BaseEntity {
  @Column({ type: 'uuid', name: 'contract_id' })
  contractId: string;

  @Column({
    type: 'enum',
    enum: ContractHistoryAction,
  })
  action: ContractHistoryAction;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_data' })
  previousData: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'new_data' })
  newData: Record<string, any> | null;

  @Column({ type: 'uuid', name: 'changed_by' })
  changedBy: string;

  @Column({ type: 'timestamp', name: 'changed_at' })
  changedAt: Date;

  // Relations
  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by' })
  changer: User;
}
