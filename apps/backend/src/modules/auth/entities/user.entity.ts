import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/base.entity';
import { UserRole, UserAffiliation } from '@msspbiz/shared';
import { Tenant } from './tenant.entity';

@Entity('users')
@Index(['tenantId', 'email'], { unique: true })
export class User extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserAffiliation,
    default: UserAffiliation.INTERNAL,
  })
  affiliation: UserAffiliation;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'affiliation_name' })
  affiliationName: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
