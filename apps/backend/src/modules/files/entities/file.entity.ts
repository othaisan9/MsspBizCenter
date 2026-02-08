import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('files')
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'uploadedById'])
export class File extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'original_name' })
  originalName: string;

  @Column({ type: 'varchar', length: 255, name: 'stored_name' })
  storedName: string;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'entity_type',
    nullable: true,
  })
  entityType: string | null;

  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entityId: string | null;

  @Column({ type: 'uuid', name: 'uploaded_by_id' })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_id' })
  uploadedBy: User;
}
