import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateProductsTables1707392400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create products table
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'product_type',
            type: 'enum',
            enum: ['platform', 'report', 'consulting', 'other'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'vendor',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for products
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_tenant_status',
        columnNames: ['tenant_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'idx_products_tenant_code',
        columnNames: ['tenant_id', 'code'],
        isUnique: true,
      }),
    );

    // Create product_options table
    await queryRunner.createTable(
      new Table({
        name: 'product_options',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for product_options
    await queryRunner.createIndex(
      'product_options',
      new TableIndex({
        name: 'idx_product_options_tenant_product',
        columnNames: ['tenant_id', 'product_id'],
      }),
    );

    // Create foreign key for product_options -> products
    await queryRunner.createForeignKey(
      'product_options',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create contract_products table
    await queryRunner.createTable(
      new Table({
        name: 'contract_products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contract_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_option_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'int',
            default: 1,
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index for contract_products
    await queryRunner.createIndex(
      'contract_products',
      new TableIndex({
        name: 'idx_contract_products_tenant_contract',
        columnNames: ['tenant_id', 'contract_id'],
      }),
    );

    // Create foreign keys for contract_products
    await queryRunner.createForeignKey(
      'contract_products',
      new TableForeignKey({
        columnNames: ['contract_id'],
        referencedTableName: 'contracts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'contract_products',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedTableName: 'products',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'contract_products',
      new TableForeignKey({
        columnNames: ['product_option_id'],
        referencedTableName: 'product_options',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop contract_products table (will auto-drop foreign keys)
    await queryRunner.dropTable('contract_products', true);

    // Drop product_options table (will auto-drop foreign keys)
    await queryRunner.dropTable('product_options', true);

    // Drop products table
    await queryRunner.dropTable('products', true);
  }
}
