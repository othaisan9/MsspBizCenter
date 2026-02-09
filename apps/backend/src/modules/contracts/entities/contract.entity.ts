import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { ContractType, ContractStatus } from '@msspbiz/shared';
import { User } from '../../auth/entities/user.entity';
import { ContractProduct } from '../../products/entities/contract-product.entity';

@Entity('contracts')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'endDate'])
@Index(['tenantId', 'contractType'])
export class Contract extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'contract_number' })
  contractNumber: string | null;

  @Column({
    type: 'enum',
    enum: ContractType,
    name: 'contract_type',
  })
  contractType: ContractType;

  @Column({ type: 'varchar', length: 255, name: 'party_a' })
  partyA: string;

  @Column({ type: 'varchar', length: 255, name: 'party_b' })
  partyB: string;

  @Column({ type: 'jsonb', nullable: true, name: 'party_b_contact' })
  partyBContact: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true, name: 'end_date' })
  endDate: Date | null;

  @Column({ type: 'text', nullable: true, name: 'amount_encrypted' })
  amountEncrypted: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'KRW' })
  currency: string | null;

  @Column({ type: 'text', nullable: true, name: 'payment_terms' })
  paymentTerms: string | null;

  // 결제 정보
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'payment_cycle' })
  paymentCycle: string | null; // PaymentCycle enum

  @Column({ type: 'boolean', default: true, name: 'vat_included' })
  vatIncluded: boolean;

  // 재무 정보 (매입) - 암호화 저장
  @Column({ type: 'text', nullable: true, name: 'purchase_price_encrypted' })
  purchasePriceEncrypted: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'purchase_commission_rate' })
  purchaseCommissionRate: number | null;

  // 재무 정보 (판매) - 암호화 저장
  @Column({ type: 'text', nullable: true, name: 'selling_price_encrypted' })
  sellingPriceEncrypted: string | null;

  @Column({ type: 'boolean', default: false, name: 'has_partner' })
  hasPartner: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'partner_name' })
  partnerName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'commission_type' })
  commissionType: string | null; // CommissionType enum

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'partner_commission' })
  partnerCommission: number | null;

  // 담당자
  @Column({ type: 'uuid', nullable: true, name: 'internal_manager_id' })
  internalManagerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'internal_manager_id' })
  internalManager: User | null;

  // 메모
  @Column({ type: 'text', nullable: true })
  memo: string | null;

  // 알림 설정
  @Column({ type: 'boolean', default: true, name: 'notify_before_30_days' })
  notifyBefore30Days: boolean;

  @Column({ type: 'boolean', default: true, name: 'notify_before_7_days' })
  notifyBefore7Days: boolean;

  @Column({ type: 'boolean', default: false, name: 'notify_on_expiry' })
  notifyOnExpiry: boolean;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.DRAFT,
  })
  status: ContractStatus;

  @Column({ type: 'boolean', nullable: true, name: 'auto_renewal' })
  autoRenewal: boolean | null;

  @Column({ type: 'int', nullable: true, name: 'renewal_notice_days' })
  renewalNoticeDays: number | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    id: string;
    filename: string;
    size: number;
    url: string;
  }> | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_contract_id' })
  parentContractId: string | null;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => Contract, (contract) => contract.renewals, { nullable: true })
  @JoinColumn({ name: 'parent_contract_id' })
  parentContract: Contract | null;

  @OneToMany(() => Contract, (contract) => contract.parentContract)
  renewals: Contract[];

  @OneToMany(() => ContractProduct, (cp) => cp.contract)
  contractProducts: ContractProduct[];
}
