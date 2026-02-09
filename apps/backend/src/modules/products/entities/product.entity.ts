import { Entity, Column, OneToMany, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { ProductStatus } from '@msspbiz/shared';
import { ProductOption } from './product-option.entity';

@Entity('products')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'code'], { unique: true })
export class Product extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor: string | null;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @OneToMany(() => ProductOption, (option) => option.product, { cascade: true })
  options: ProductOption[];
}
