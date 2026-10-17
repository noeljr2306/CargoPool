const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mappings = [
  { keyword: 'dried hibiscus', hsCode: '1211.90', description: 'Dried hibiscus flowers, used for infusions' },
  { keyword: 'hibiscus', hsCode: '0603.90', description: 'Hibiscus (general/fresh flowers)' },
  { keyword: 'shea butter', hsCode: '1515.90', description: 'Shea butter, unrefined' },
  { keyword: 'cocoa beans', hsCode: '1801.00', description: 'Cocoa beans, whole or broken, raw or roasted' },
  { keyword: 'textile', hsCode: '5208.00', description: 'Woven cotton textiles' },
  { keyword: 'leather bag', hsCode: '4202.21', description: 'Handbags with outer surface of leather' },
  { keyword: 'wooden craft', hsCode: '4420.10', description: 'Wood carvings and ornaments' },
  { keyword: 'ground nuts', hsCode: '1202.41', description: 'Groundnuts (peanuts), in shell' },
  { keyword: 'palm oil', hsCode: '1511.10', description: 'Crude palm oil' },
  { keyword: 'ginger', hsCode: '0910.11', description: 'Ginger, neither crushed nor ground' },
];

async function main() {
  for (const m of mappings) {
    await prisma.hsCodeMapping.create({ data: m });
  }
  console.log(`Seeded ${mappings.length} HS code mappings`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());