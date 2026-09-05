import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root and from apps/api
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase URL or Anon Key is missing');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function seedEmbeddings() {
  console.log('Fetching records from public.scheme_qa...');
  const { data: records, error } = await supabase.from('scheme_qa').select('*');

  if (error) {
    console.error('Failed to fetch records:', error);
    process.exit(1);
  }

  if (!records || records.length === 0) {
    console.log('No records found.');
    return;
  }

  console.log(`Found ${records.length} records. Starting embedding generation...`);

  let updatedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // Construct searchable text, safely skipping nulls and empty strings
    const parts = [
      record.scheme_name,
      record.category,
      record.target_beneficiary,
      record.state_or_central,
      record.difficulty_level,
      record.launched_year ? `Launched Year: ${record.launched_year}` : null,
      record.question,
      record.question_english,
      record.answer,
      record.answer_english
    ];

    const searchableText = parts
      .filter(part => part !== null && part !== undefined && String(part).trim() !== '')
      .join('\n\n');

    if (!searchableText) {
      console.log(`Skipping record ID ${record.id}: No searchable text.`);
      continue;
    }

    let retries = 0;
    let success = false;
    while (!success && retries < 5) {
      try {
        const response = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: searchableText,
          config: {
            outputDimensionality: 768,
          },
        });

        const embedding = response.embeddings?.[0]?.values;

        if (!embedding || embedding.length === 0) {
          console.error(`Failed to generate embedding for ID ${record.id}`);
          break; // move to next
        }

        // Update Supabase
        const { error: updateError } = await supabase
          .from('scheme_qa')
          .update({ embedding: `[${embedding.join(',')}]` })
          .eq('id', record.id);

        if (updateError) {
          console.error(`Failed to update DB for ID ${record.id}:`, updateError);
        } else {
          updatedCount++;
          if (updatedCount % 50 === 0) {
            console.log(`Progress: embedded ${updatedCount} / ${records.length}`);
          }
        }
        success = true;
      } catch (err: any) {
        if (err?.message?.includes('429')) {
           const delay = Math.pow(2, retries) * 1000;
           console.warn(`Rate limit hit at ID ${record.id}. Retrying in ${delay}ms...`);
           await new Promise(r => setTimeout(r, delay));
           retries++;
        } else {
           console.error(`Error processing ID ${record.id}:`, err?.message || err);
           break;
        }
      }
    }
    
    // minimal delay to prevent overwhelming
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`Done! Successfully generated and saved ${updatedCount} embeddings.`);
}

seedEmbeddings().catch(console.error);
