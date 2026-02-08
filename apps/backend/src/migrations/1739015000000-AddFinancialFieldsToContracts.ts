import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddFinancialFieldsToContracts1739015000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 결제 정보 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'payment_cycle',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'vat_included',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );

    // 재무 정보 (매입) 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'purchase_price_encrypted',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'purchase_commission_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
      }),
    );

    // 재무 정보 (판매) 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'selling_price_encrypted',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'has_partner',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'partner_name',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'commission_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'partner_commission',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    );

    // 담당자 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'internal_manager_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // 메모 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'memo',
        type: 'text',
        isNullable: true,
      }),
    );

    // 알림 설정 필드
    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'notify_before_30_days',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'notify_before_7_days',
        type: 'boolean',
        default: true,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'contracts',
      new TableColumn({
        name: 'notify_on_expiry',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Foreign key for internal_manager_id -> users
    await queryRunner.createForeignKey(
      'contracts',
      new TableForeignKey({
        columnNames: ['internal_manager_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'fk_contracts_internal_manager',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('contracts', 'fk_contracts_internal_manager');

    // Drop columns in reverse order
    await queryRunner.dropColumn('contracts', 'notify_on_expiry');
    await queryRunner.dropColumn('contracts', 'notify_before_7_days');
    await queryRunner.dropColumn('contracts', 'notify_before_30_days');
    await queryRunner.dropColumn('contracts', 'memo');
    await queryRunner.dropColumn('contracts', 'internal_manager_id');
    await queryRunner.dropColumn('contracts', 'partner_commission');
    await queryRunner.dropColumn('contracts', 'commission_type');
    await queryRunner.dropColumn('contracts', 'partner_name');
    await queryRunner.dropColumn('contracts', 'has_partner');
    await queryRunner.dropColumn('contracts', 'selling_price_encrypted');
    await queryRunner.dropColumn('contracts', 'purchase_commission_rate');
    await queryRunner.dropColumn('contracts', 'purchase_price_encrypted');
    await queryRunner.dropColumn('contracts', 'vat_included');
    await queryRunner.dropColumn('contracts', 'payment_cycle');
  }
}
