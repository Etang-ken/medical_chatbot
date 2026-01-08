import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not set. Ensure medical_chatbot/.env exists and contains DATABASE_URL.');
  process.exit(1);
}

const maskedDbUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
console.log(`🔌 Using DATABASE_URL: ${maskedDbUrl}`);

const prisma = new PrismaClient();

interface CSVRow {
  short_question: string;
  short_answer: string;
  tags: string;
  label: string;
}

function cleanTags(tagsString: string): string[] {
  try {
    if (!tagsString || tagsString.trim() === '') {
      return [];
    }

    let cleaned = tagsString.trim();

    const extracted: string[] = [];
    const quotedTokenRegex = /'([^']+)'|\"([^\"]+)\"/g;
    let match: RegExpExecArray | null;

    while ((match = quotedTokenRegex.exec(cleaned)) !== null) {
      const token = (match[1] ?? match[2] ?? '').trim();
      if (token) {
        extracted.push(token);
      }
    }

    let tags: string[];
    if (extracted.length > 0) {
      tags = extracted;
    } else {
      cleaned = cleaned.replace(/^\[|\]$/g, '');
      tags = cleaned
        .split(/[\s,]+/)
        .map((tag) => tag.trim().replace(/^['\"]|['\"]$/g, ''))
        .filter((tag) => tag.length > 0);
    }

    const normalized = tags
      .map((t) => t.toLowerCase())
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter((t) => t.length > 0);

    return Array.from(new Set(normalized));
  } catch (error) {
    console.error('Error cleaning tags:', tagsString, error);
    return [];
  }
}

async function ingestMedicalData() {
  const csvPath = path.join(__dirname, '../../../medical_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log('🚀 Starting medical data ingestion...');
  console.log(`📁 Reading from: ${csvPath}`);

  const records: Array<{
    question: string;
    answer: string;
    tags: string[];
    label: number;
  }> = [];

  let rowCount = 0;
  let errorCount = 0;

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        try {
          rowCount++;
          
          const question = row.short_question?.trim();
          const answer = row.short_answer?.trim();
          const label = parseInt(row.label, 10);

          if (!question || !answer || isNaN(label)) {
            errorCount++;
            if (errorCount <= 5) {
              console.warn(`⚠️  Skipping invalid row ${rowCount}:`, { question, answer, label });
            }
            return;
          }

          const tags = cleanTags(row.tags);

          records.push({
            question,
            answer,
            tags,
            label,
          });

          if (rowCount % 10000 === 0) {
            console.log(`📊 Processed ${rowCount} rows...`);
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error processing row ${rowCount}:`, error);
        }
      })
      .on('end', () => {
        console.log(`✅ CSV parsing complete. Total rows: ${rowCount}, Valid records: ${records.length}, Errors: ${errorCount}`);
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });

  console.log('\n💾 Clearing existing medical knowledge...');
  await prisma.medicalKnowledge.deleteMany({});

  console.log('💾 Inserting records into database...');
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      await prisma.medicalKnowledge.createMany({
        data: batch,
        skipDuplicates: true,
      });
      
      insertedCount += batch.length;
      console.log(`✅ Inserted ${insertedCount}/${records.length} records...`);
    } catch (error) {
      console.error(`❌ Error inserting batch starting at ${i}:`, error);
    }
  }

  console.log('\n🎉 Ingestion complete!');
  console.log(`📊 Total records inserted: ${insertedCount}`);

  const sampleRecords = await prisma.medicalKnowledge.findMany({
    take: 3,
  });

  console.log('\n📋 Sample records:');
  sampleRecords.forEach((record: any, idx: number) => {
    console.log(`\n${idx + 1}. Question: ${record.question.substring(0, 100)}...`);
    console.log(`   Answer: ${record.answer.substring(0, 100)}...`);
    console.log(`   Tags: ${JSON.stringify(record.tags)}`);
    console.log(`   Label: ${record.label}`);
  });

  await prisma.$disconnect();
}

ingestMedicalData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
