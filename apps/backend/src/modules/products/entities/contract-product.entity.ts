import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';
import { Contract } from '../../contracts/entities/contract.entity';

@Entity('contract_products')
@Index(['tenantId', 'contractId'])
export class ContractProduct extends TenantBaseEntity {
  @Column({ type: 'uuid', name: 'contract_id' })
  contractId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', nullable: true, name: 'product_option_id' })
  productOptionId: string | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Contract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductOption, { nullable: true })
  @JoinColumn({ name: 'product_option_id' })
  productOption: ProductOption | null;
}
