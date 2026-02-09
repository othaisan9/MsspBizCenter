import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesignProductModel1739028000000 implements MigrationInterface {
  name = 'RedesignProductModel1739028000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. product_options에 type 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE "product_options"
      ADD COLUMN "type" varchar(50) NULL
    `);

    // 2. 기존 products.product_type 값을 각 product_options.type으로 복사
    await queryRunner.query(`
      UPDATE "product_options" po
      SET "type" = p."product_type"
      FROM "products" p
      WHERE po."product_id" = p."id"
      AND p."product_type" IS NOT NULL
    `);

    // 3. products에서 product_type 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "product_type"
    `);

    // 4. PostgreSQL orphan enum type 정리
    await queryRunner.query(`
      DROP TYPE IF EXISTS "products_product_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. products에 product_type enum 복원
    await queryRunner.query(`
      CREATE TYPE "products_product_type_enum" AS ENUM ('platform', 'report', 'consulting', 'other')
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "product_type" "products_product_type_enum" NOT NULL DEFAULT 'other'
    `);

    // 2. product_options.type 값을 products.product_type으로 역복사 (첫 번째 옵션 기준)
    await queryRunner.query(`
      UPDATE "products" p
      SET "product_type" = COALESCE(
        (SELECT po."type"::text::"products_product_type_enum"
         FROM "product_options" po
         WHERE po."product_id" = p."id"
         AND po."type" IN ('platform', 'report', 'consulting', 'other')
         LIMIT 1),
        'other'
      )
    `);

    // 3. product_options에서 type 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE "product_options"
      DROP COLUMN IF EXISTS "type"
    `);
  }
}
