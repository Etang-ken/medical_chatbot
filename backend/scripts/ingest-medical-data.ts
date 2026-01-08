import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    const tags = cleaned
      .split(',')
      .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''))
      .filter(tag => tag.length > 0);
    
    return tags;
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
