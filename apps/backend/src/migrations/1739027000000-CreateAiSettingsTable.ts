import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAiSettingsTable1739027000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ai_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '20',
            default: "'anthropic'",
          },
          {
            name: 'api_key_encrypted',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'default_model',
            type: 'varchar',
            length: '100',
            default: "'claude-sonnet-4-5-20250929'",
          },
          {
            name: 'fast_model',
            type: 'varchar',
            length: '100',
            default: "'claude-haiku-4-5-20251001'",
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'monthly_budget_limit',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'ollama_base_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
            default: "'http://localhost:11434'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // tenant_id에 유니크 인덱스 생성
    await queryRunner.createIndex(
      'ai_settings',
      new TableIndex({
        name: 'IDX_ai_settings_tenant_id_unique',
        columnNames: ['tenant_id'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('ai_settings', 'IDX_ai_settings_tenant_id_unique');
    await queryRunner.dropTable('ai_settings');
  }
}
