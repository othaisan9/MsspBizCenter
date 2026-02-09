# Products Module Documentation

## Overview

The Products module manages product and product option master data for contracts. It supports multi-tenancy with tenant-based data isolation.

## File Structure

```
apps/backend/src/modules/products/
├── entities/
│   ├── product.entity.ts          # Product master entity
│   ├── product-option.entity.ts   # Product options entity
│   └── contract-product.entity.ts # Product-Contract junction table
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── create-product-option.dto.ts
│   └── update-product-option.dto.ts
├── products.controller.ts
├── products.service.ts
└── products.module.ts
```

## Database Schema

### products

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| tenant_id | UUID | Tenant ID |
| code | VARCHAR(50) | Product code (unique per tenant) |
| name | VARCHAR(255) | Product name |
| description | TEXT | Product description (nullable) |
| status | ENUM | ACTIVE / INACTIVE (default: ACTIVE) |
| vendor | VARCHAR(255) | Vendor name (nullable) |
| display_order | INT | Display order (default: 0) |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

> **Note**: `product_type` 컬럼은 v0.1.0-alpha.10에서 제거됨. 파생제품 유형은 `product_options.type`으로 이동.

**Indexes:**
- `idx_products_tenant_status` (tenant_id, status)
- `idx_products_tenant_code` (tenant_id, code) - UNIQUE

### product_options

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| tenant_id | UUID | Tenant ID |
| product_id | UUID | Foreign Key to products |
| code | VARCHAR(50) | Option code |
| name | VARCHAR(255) | Option name |
| type | VARCHAR(50) | Derived product type (nullable, user-defined) |
| description | TEXT | Option description (nullable) |
| is_active | BOOLEAN | Active status (default: true) |
| display_order | INT | Display order (default: 0) |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

**Indexes:**
- `idx_product_options_tenant_product` (tenant_id, product_id)

**Relations:**
- ON DELETE CASCADE (when product is deleted, options are deleted)

### contract_products

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| tenant_id | UUID | Tenant ID |
| contract_id | UUID | Foreign Key to contracts |
| product_id | UUID | Foreign Key to products |
| product_option_id | UUID | Foreign Key to product_options (nullable) |
| quantity | INT | Quantity (default: 1) |
| notes | TEXT | Notes (nullable) |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

**Indexes:**
- `idx_contract_products_tenant_contract` (tenant_id, contract_id)

**Relations:**
- ON DELETE CASCADE (when contract is deleted, contract_products are deleted)

## API Endpoints

Base path: `/api/v1/products`

### Product Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | All roles | Get all products with options |
| POST | `/` | ADMIN+ | Create new product |
| GET | `/:id` | All roles | Get product by ID |
| PATCH | `/:id` | ADMIN+ | Update product |
| DELETE | `/:id` | OWNER only | Delete product (soft delete to INACTIVE) |

### Product Option Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/:id/options` | ADMIN+ | Add option to product |
| PATCH | `/:id/options/:optionId` | ADMIN+ | Update product option |
| DELETE | `/:id/options/:optionId` | ADMIN+ | Delete product option (hard delete) |

## Role-based Access Control

- **OWNER**: Full access (including delete)
- **ADMIN**: Create, update products and options
- **EDITOR/ANALYST/VIEWER**: Read-only access

## Service Methods

### ProductsService

```typescript
// Product CRUD
findAll(tenantId: string): Promise<Product[]>
findOne(id: string, tenantId: string): Promise<Product>
create(dto: CreateProductDto, tenantId: string): Promise<Product>
update(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product>
remove(id: string, tenantId: string, hardDelete?: boolean): Promise<void>

// Product Option CRUD
addOption(productId: string, dto: CreateProductOptionDto, tenantId: string): Promise<ProductOption>
updateOption(productId: string, optionId: string, dto: UpdateProductOptionDto, tenantId: string): Promise<ProductOption>
removeOption(productId: string, optionId: string, tenantId: string): Promise<void>
```

## Validation Rules

### CreateProductDto
- `code`: Required, max 50 chars, unique per tenant
- `name`: Required, max 255 chars
- `description`: Optional
- `vendor`: Optional, max 255 chars
- `displayOrder`: Optional, integer >= 0

### CreateProductOptionDto
- `code`: Required, max 50 chars
- `name`: Required, max 255 chars
- `type`: Optional, max 50 chars (파생제품 유형, 프리셋: 플랫폼/서비스/리포트/API/컨설팅/라이선스/기타)
- `description`: Optional
- `isActive`: Optional, boolean (default: true)
- `displayOrder`: Optional, integer >= 0

## Error Handling

- **404 Not Found**: Product or option not found
- **409 Conflict**: Duplicate product code or option code
- **403 Forbidden**: Insufficient permissions

## Example Usage

### Create Product

```bash
POST /api/v1/products
Authorization: Bearer <token>

{
  "code": "stealthmole",
  "name": "StealthMole",
  "description": "DarkWeb 위협 인텔리전스",
  "vendor": "StealthMole Inc.",
  "displayOrder": 0
}
```

### Add Product Option

```bash
POST /api/v1/products/{productId}/options
Authorization: Bearer <token>

{
  "code": "DT",
  "name": "Dark Tracer",
  "type": "플랫폼",
  "description": "DarkWeb 추적 서비스",
  "isActive": true,
  "displayOrder": 0
}
```

### Get All Products

```bash
GET /api/v1/products
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "code": "stealthmole",
    "name": "StealthMole",
    "status": "ACTIVE",
    "vendor": "StealthMole Inc.",
    "options": [
      {
        "id": "uuid",
        "code": "DT",
        "name": "Dark Tracer",
        "type": "플랫폼",
        "isActive": true
      }
    ]
  }
]
```

## Integration with Contracts

The `contract_products` table links contracts to products and their options. This allows:
- Multiple products per contract
- Optional product options selection
- Quantity tracking
- Additional notes per product

## Future Enhancements

- [ ] Product pricing information
- [ ] Product SKU management
- [ ] Product categories/tags
- [ ] Product lifecycle management
- [ ] Bulk import/export
- [ ] Product usage analytics
