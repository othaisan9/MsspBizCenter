import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';

@Entity('tags')
@Index(['tenantId', 'name'], { unique: true })
export class Tag extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;
}
