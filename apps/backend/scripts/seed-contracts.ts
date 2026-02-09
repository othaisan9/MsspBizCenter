import 'reflect-metadata';
process.on('unhandledRejection', (err) => { console.error('UNHANDLED REJECTION:', err); process.exit(1); });
process.on('uncaughtException', (err) => { console.error('UNCAUGHT EXCEPTION:', err); process.exit(1); });
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { UserRole, ContractStatus, ContractType, ProductStatus } from '@msspbiz/shared';

// Entities
import { Tenant } from '../src/modules/auth/entities/tenant.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { Contract } from '../src/modules/contracts/entities/contract.entity';
import { ContractHistory } from '../src/modules/contracts/entities/contract-history.entity';
import { Product } from '../src/modules/products/entities/product.entity';
import { ProductOption } from '../src/modules/products/entities/product-option.entity';
import { ContractProduct } from '../src/modules/products/entities/contract-product.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { MeetingNote } from '../src/modules/meetings/entities/meeting-note.entity';
import { MeetingAttendee } from '../src/modules/meetings/entities/meeting-attendee.entity';
import { ActionItem } from '../src/modules/meetings/entities/action-item.entity';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity';
import { File as FileEntity } from '../src/modules/files/entities/file.entity';
import { AiSettings } from '../src/modules/ai/entities/ai-settings.entity';
import { Tag } from '../src/modules/tags/entities/tag.entity';

// Product definitions
const PRODUCTS = [
  { code: 'SM', name: 'StealthMole', vendor: 'StealthMole', description: '다크웹/텔레그램 위협 인텔리전스 플랫폼' },
  { code: 'BOIIM', name: 'THE BOIIM', vendor: 'NSHC', description: '외부 위협 모니터링 서비스' },
  { code: 'TR', name: 'ThreatRecon', vendor: 'NSHC', description: '위협 정찰 플랫폼' },
  { code: 'TR-RPT', name: 'TR Report', vendor: 'NSHC', description: '위협 인텔리전스 리포트' },
  { code: 'DI', name: 'deep.insight', vendor: 'NSHC', description: '심층 보안 분석 서비스' },
  { code: 'RFI', name: 'RFI', vendor: 'NSHC', description: 'Request for Intelligence' },
];

const SM_OPTIONS = [
  { code: 'DT', name: 'DarkWeb Tracker', type: '플랫폼' },
  { code: 'TT', name: 'Telegram Tracker', type: '플랫폼' },
  { code: 'FF', name: 'Face Finder', type: '플랫폼' },
  { code: 'CDS', name: 'Compromised Data Set', type: '플랫폼' },
  { code: 'CB', name: 'Combo Binder', type: '플랫폼' },
  { code: 'CL', name: 'Credential Lookout', type: '플랫폼' },
  { code: 'RM', name: 'Risk Monitoring', type: '모니터링' },
  { code: 'LM', name: 'Leak Monitoring', type: '모니터링' },
  { code: 'GM', name: 'Group Monitoring', type: '모니터링' },
  { code: 'DM', name: 'Domain Monitoring', type: '모니터링' },
  { code: 'UB', name: 'URL Breach', type: '플랫폼' },
  { code: 'ULP', name: 'User Leaked Password', type: '플랫폼' },
  { code: 'API', name: 'API Access', type: 'API' },
];

const BOIIM_OPTIONS = [
  { code: 'ULP', name: '유출계정 탐지', type: '플랫폼' },
  { code: 'DT', name: '다크웹 유출데이터 탐지', type: '플랫폼' },
  { code: 'SIMILAR_DOMAIN', name: '유사도메인 탐지', type: '플랫폼' },
  { code: 'TI-RPT', name: '위협인텔리전스 보고서', type: '리포트' },
  { code: 'DI', name: 'Deep Insight', type: '리포트' },
];

const SALES_REPS = [
  { name: '임정택', email: 'jt.lim@nshc.net' },
  { name: '김성령', email: 'sr.kim@nshc.net' },
  { name: '이원희', email: 'wh.lee@nshc.net' },
  { name: '이용환', email: 'yh.lee@nshc.net' },
  { name: '장홍석', email: 'hs.jang@nshc.net' },
];

// Create DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'msspbiz',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'msspbiz',
  entities: [
    Tenant,
    User,
    Contract,
    ContractHistory,
    Product,
    ProductOption,
    ContractProduct,
    Task,
    MeetingNote,
    MeetingAttendee,
    ActionItem,
    AuditLog,
    FileEntity,
    AiSettings,
    Tag,
  ],
  synchronize: false,
  logging: false,
});

// Status mapping function
function mapStatus(csvStatus: string): ContractStatus {
  const s = csvStatus?.trim() || '';
  if (s.includes('계약확정') || s.includes('진행중')) return ContractStatus.ACTIVE;
  if (s === '계약완료(신규)') return ContractStatus.ACTIVE;
  if (s === '계약완료(갱신)') return ContractStatus.RENEWED;
  if (s === '계약종료') return ContractStatus.EXPIRED;
  if (s === 'PoC/Demo종료') return ContractStatus.EXPIRED;
  if (s.startsWith('PoC') || s.startsWith('Demo')) return ContractStatus.POC_DEMO;
  return ContractStatus.DRAFT;
}

// Parse date from YYYY/MM/DD format
function parseDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const [year, month, day] = dateStr.trim().split('/').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

// Parse license period from "YYYY/MM/DD → YYYY/MM/DD" format
function parseLicensePeriod(periodStr: string): { startDate: Date | null; endDate: Date | null } {
  if (!periodStr || !periodStr.includes('→')) {
    return { startDate: null, endDate: null };
  }
  const [start, end] = periodStr.split('→').map((s) => s.trim());
  return {
    startDate: parseDate(start),
    endDate: parseDate(end),
  };
}

// Parse account field (계정)
function parseAccounts(accountField: string): Array<{ platform?: string; email?: string }> {
  if (!accountField || !accountField.trim()) return [];

  const accounts: Array<{ platform?: string; email?: string }> = [];
  const lines = accountField.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentPlatform: string | undefined;

  for (const line of lines) {
    // Platform marker: [PlatformName]
    const platformMatch = line.match(/^\[([^\]]+)\]$/);
    if (platformMatch) {
      currentPlatform = platformMatch[1];
      continue;
    }

    // Email line: starts with - or mailto:
    if (line.startsWith('-') || line.startsWith('mailto:')) {
      let email = line.replace(/^-\s*/, '').replace(/^mailto:/, '').trim();
      if (email) {
        accounts.push({ platform: currentPlatform, email });
      }
    }
  }

  return accounts;
}

// Parse product names from comma-separated string
function parseProductNames(productField: string): string[] {
  if (!productField || !productField.trim()) return [];
  return productField
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // Handle typo: "TEH BOIIM" → "THE BOIIM"
      if (p === 'TEH BOIIM') return 'THE BOIIM';
      return p;
    });
}

// Parse module quantities from "공급 내역" field
function parseModuleQuantities(supplyDetail: string): Array<{ code: string; quantity: number }> {
  if (!supplyDetail || !supplyDetail.trim()) return [];

  const modules: Array<{ code: string; quantity: number }> = [];
  // Match patterns like: DT(3,000) or RM(1,00) or CL(500)
  const regex = /([A-Z_]{2,5})\s*\(([0-9,]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(supplyDetail)) !== null) {
    const code = match[1];
    const quantityStr = match[2].replace(/,/g, ''); // Remove commas
    const quantity = parseInt(quantityStr, 10);
    if (!isNaN(quantity)) {
      modules.push({ code, quantity });
    }
  }

  return modules;
}

// CSV Parser (manual state machine for complex CSV with multi-line fields)
function parseCSV(content: string): Array<Record<string, string>> {
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const lines = content.split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const headerLine = lines[0];
  const headers: string[] = [];
  let inQuote = false;
  let currentField = '';

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      headers.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  headers.push(currentField.trim());

  // Parse rows
  const rows: Array<Record<string, string>> = [];
  let currentRow: string[] = [];
  currentField = '';
  inQuote = false;

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        currentRow.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }

    // If we're still in a quote, this field continues on the next line
    if (inQuote) {
      currentField += '\n';
      continue;
    }

    // End of row
    currentRow.push(currentField);
    currentField = '';

    // Create row object
    if (currentRow.length === headers.length) {
      const rowObj: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        rowObj[headers[i]] = currentRow[i].trim();
      }
      rows.push(rowObj);
    }

    currentRow = [];
  }

  return rows;
}

// Encryption helper (same as EncryptionService)
function encryptAmount(plaintext: string, encryptionKey: Buffer): string {
  const algorithm = 'aes-256-gcm';
  const ivLength = 16;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

async function main() {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: npx tsx scripts/seed-contracts.ts <tenantId>');
    process.exit(1);
  }

  console.log('🚀 Starting contract seed...');
  console.log(`   Tenant ID: ${tenantId}`);

  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    // 1. Get owner user for createdBy
    const owner = await qr.manager.findOne(User, { where: { tenantId, role: UserRole.OWNER } });
    if (!owner) {
      throw new Error('Owner user not found for tenant');
    }
    const createdBy = owner.id;
    console.log(`✅ Found owner: ${owner.name} (${owner.email})`);

    // Get encryption key from env
    const encryptionKeyStr = process.env.CONTRACT_ENCRYPTION_KEY;
    if (!encryptionKeyStr || encryptionKeyStr.length !== 64) {
      throw new Error('CONTRACT_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    const encryptionKey = Buffer.from(encryptionKeyStr, 'hex');

    // 2. Create products
    console.log('\n📦 Creating products...');
    const productMap = new Map<string, Product>();

    for (let i = 0; i < PRODUCTS.length; i++) {
      const p = PRODUCTS[i];
      const product = qr.manager.create(Product, {
        tenantId,
        code: p.code,
        name: p.name,
        vendor: p.vendor,
        description: p.description,
        status: ProductStatus.ACTIVE,
        displayOrder: i,
      });
      await qr.manager.save(product);
      productMap.set(p.name, product);
      console.log(`   ✓ ${p.name} (${p.code})`);
    }

    // 3. Create product options
    console.log('\n🔧 Creating product options...');
    const smProduct = productMap.get('StealthMole');
    const boiimProduct = productMap.get('THE BOIIM');

    const optionMap = new Map<string, ProductOption>();

    if (smProduct) {
      for (let i = 0; i < SM_OPTIONS.length; i++) {
        const opt = SM_OPTIONS[i];
        const option = qr.manager.create(ProductOption, {
          tenantId,
          productId: smProduct.id,
          code: opt.code,
          name: opt.name,
          type: opt.type,
          isActive: true,
          displayOrder: i,
        });
        await qr.manager.save(option);
        optionMap.set(`SM:${opt.code}`, option);
      }
      console.log(`   ✓ StealthMole: ${SM_OPTIONS.length} options`);
    }

    if (boiimProduct) {
      for (let i = 0; i < BOIIM_OPTIONS.length; i++) {
        const opt = BOIIM_OPTIONS[i];
        const option = qr.manager.create(ProductOption, {
          tenantId,
          productId: boiimProduct.id,
          code: opt.code,
          name: opt.name,
          type: opt.type,
          isActive: true,
          displayOrder: i,
        });
        await qr.manager.save(option);
        optionMap.set(`BOIIM:${opt.code}`, option);
      }
      console.log(`   ✓ THE BOIIM: ${BOIIM_OPTIONS.length} options`);
    }

    // 4. Create sales users
    console.log('\n👤 Creating sales representatives...');
    const userMap = new Map<string, User>();

    for (const rep of SALES_REPS) {
      // Check if user already exists
      let user = await qr.manager.findOne(User, {
        where: { tenantId, email: rep.email },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash('Welcome123!', 12);
        user = qr.manager.create(User, {
          tenantId,
          email: rep.email,
          name: rep.name,
          passwordHash,
          role: UserRole.SALES,
          isActive: true,
        });
        await qr.manager.save(user);
        console.log(`   ✓ ${rep.name} (${rep.email})`);
      } else {
        console.log(`   ⊙ ${rep.name} (already exists)`);
      }

      userMap.set(rep.name, user);
    }

    // 5. Parse CSV
    console.log('\n📄 Reading CSV file...');
    const csvPath = path.resolve(__dirname, '../../../tmp/MSSP계약관리(StealthMole) 184c7b83391380c4815ee32a3049e395.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvRows = parseCSV(csvContent);
    console.log(`   ✓ Found ${csvRows.length} rows`);

    // 6. Create contracts
    console.log('\n📝 Creating contracts...');
    let contractCount = 0;
    let contractProductCount = 0;

    for (const row of csvRows) {
      const title = row['사업(계약)명'];
      if (!title || !title.trim()) {
        console.log('   ⊘ Skipping row with empty title');
        continue;
      }

      const contractDate = parseDate(row['계약일']);
      const customerName = row['고객사'];
      const accountField = row['계정'];
      const supplyDetail = row['공급 내역(매입1)'];
      const productNames = parseProductNames(row['공급제품']);
      const licensePeriod = row['라이선스기간'];
      const vendor = row['매입1'];
      const salesRepName = row['영업담당'];
      const status = mapStatus(row['영업상태']);

      // Parse dates
      const { startDate, endDate } = parseLicensePeriod(licensePeriod);

      // Parse accounts
      const partyBContact = parseAccounts(accountField);

      // Parse sales rep
      let internalManagerId: string | null = null;
      if (salesRepName && salesRepName.trim()) {
        const names = salesRepName.split(',').map((n) => n.trim());
        const primaryName = names[0];

        // Skip partner or special cases
        if (!primaryName.includes('파트너') && !primaryName.includes('기타')) {
          const salesUser = userMap.get(primaryName);
          if (salesUser) {
            internalManagerId = salesUser.id;
          }
        }
      }

      // Create contract
      const contract = qr.manager.create(Contract, {
        tenantId,
        title,
        contractNumber: null,
        contractType: ContractType.LICENSE,
        partyA: '(주)오타이산',
        partyB: customerName,
        partyBContact,
        startDate: startDate || contractDate || new Date(),
        endDate,
        status,
        internalManagerId,
        createdBy,
        description: supplyDetail,
        vatIncluded: true,
        notifyBefore30Days: true,
        notifyBefore7Days: true,
        notifyOnExpiry: false,
      });

      await qr.manager.save(contract);
      contractCount++;

      // Parse module quantities
      const modules = parseModuleQuantities(supplyDetail);

      // Create contract-product links
      for (const productName of productNames) {
        const product = productMap.get(productName);
        if (!product) {
          console.log(`   ⚠️  Product not found: ${productName}`);
          continue;
        }

        // If product has modules, create links for each module
        if (modules.length > 0 && (productName === 'StealthMole' || productName === 'THE BOIIM')) {
          const productPrefix = productName === 'StealthMole' ? 'SM' : 'BOIIM';

          for (const mod of modules) {
            const optionKey = `${productPrefix}:${mod.code}`;
            const option = optionMap.get(optionKey);

            if (option) {
              const cp = qr.manager.create(ContractProduct, {
                tenantId,
                contractId: contract.id,
                productId: product.id,
                productOptionId: option.id,
                quantity: mod.quantity,
              });
              await qr.manager.save(cp);
              contractProductCount++;
            }
          }
        } else {
          // No modules, just link the product
          const cp = qr.manager.create(ContractProduct, {
            tenantId,
            contractId: contract.id,
            productId: product.id,
            productOptionId: null,
            quantity: 1,
          });
          await qr.manager.save(cp);
          contractProductCount++;
        }
      }

      console.log(`   ✓ ${title} (${customerName}) - ${status}`);
    }

    await qr.commitTransaction();

    console.log('\n✅ Seed completed successfully!');
    console.log(`   Products: ${PRODUCTS.length}`);
    console.log(`   Product Options: ${SM_OPTIONS.length + BOIIM_OPTIONS.length}`);
    console.log(`   Sales Reps: ${SALES_REPS.length}`);
    console.log(`   Contracts: ${contractCount}`);
    console.log(`   Contract-Product Links: ${contractProductCount}`);
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('\n❌ Seed failed:', err);
    throw err;
  } finally {
    await qr.release();
    await AppDataSource.destroy();
  }
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
