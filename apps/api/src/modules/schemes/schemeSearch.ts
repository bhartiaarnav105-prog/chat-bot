import { supabase } from './supabaseClient';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

export interface SchemeMatch {
  scheme: any;
  score: number;
  matchReasons: string[];
}

// 1. Concept Map
const conceptMap: Record<string, string[]> = {
  farmer: ['farmer', 'farmers', 'kisan', 'kisaan', 'किसान', 'कृषक', 'खेती'],
  agriculture: ['agriculture', 'agricultural', 'crop', 'crops', 'farming', 'farm', 'fasal', 'फसल', 'खेती', 'कृषि'],
  student: ['student', 'students', 'education', 'school', 'college', 'scholarship', 'विद्यार्थी', 'छात्र', 'छात्रा', 'शिक्षा', 'छात्रवृत्ति'],
  women: ['woman', 'women', 'female', 'girl', 'ladki', 'mahila', 'महिला', 'लड़की', 'बेटी'],
  employment: ['job', 'jobs', 'employment', 'work', 'rojgar', 'naukri', 'रोजगार', 'नौकरी'],
  housing: ['house', 'home', 'housing', 'ghar', 'आवास', 'घर'],
  health: ['health', 'hospital', 'medical', 'treatment', 'healthcare', 'स्वास्थ्य', 'इलाज'],
  financial_support: ['money', 'financial', 'finance', 'loan', 'income', 'assistance', 'economic', 'आर्थिक', 'पैसा', 'सहायता', 'ऋण'],
  insurance: ['insurance', 'crop insurance', 'bima', 'बीमा']
};

const stopWords = new Set([
  'i', 'am', 'a', 'an', 'the', 'is', 'are', 'for', 'to', 'of', 'and', 'or', 'in', 'on', 'with',
  'need', 'want', 'help', 'me', 'my', 'please', 'tell', 'give', 'about', 'any', 'there',
  'mujhe', 'mujhko', 'mere', 'mera', 'meri', 'ke', 'ki', 'ka', 'liye', 'hai', 'hain', 'kya',
  'ko', 'se', 'aur', 'ek', 'koi', 'chahiye', 'batao', 'bataye', 'sarkari', 'yojana', 'scheme',
  'explain', 'what', 'will', 'get', 'from', 'can', 'how', 'show', 'step', 'by', 'does', 'this', 'provide'
]);

const intentMap: Record<string, string[]> = {
  benefits: ['benefit', 'benefits', 'fayda', 'fayde', 'labh', 'लाभ', 'फायदा', 'फायदे'],
  eligibility: ['eligibility', 'eligible', 'patrata', 'पात्रता', 'who can'],
  application: ['apply', 'application', 'aavedan', 'आवेदन'],
  documents: ['document', 'documents', 'kagaz', 'kagzat', 'दस्तावेज', 'कागज'],
  amount: ['amount', 'money', 'paisa', 'paise', 'रकम', 'पैसा'],
  subsidy: ['subsidy', 'सब्सिडी'],
  status: ['status', 'स्थिति'],
  deadline: ['deadline', 'antim tithi', 'अंतिम तिथि']
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  normalized = normalized.replace(/[^\w\s\u0900-\u097F]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

export async function fallbackKeywordSearch(transcript: string, normalizedQuery: string, meaningfulKeywords: string[]): Promise<SchemeMatch[]> {
  console.log(`\n[FALLBACK KEYWORD SEARCH] Executing fallback for: ${transcript}`);
  const detectedConcepts: string[] = [];
  const expandedTerms = new Set<string>();

  for (const [concept, synonyms] of Object.entries(conceptMap)) {
    let conceptMatched = false;
    for (const token of meaningfulKeywords) {
      if (synonyms.includes(token)) {
        conceptMatched = true;
        break;
      }
    }
    if (conceptMatched) {
      detectedConcepts.push(concept);
      synonyms.forEach(syn => expandedTerms.add(syn));
    }
  }

  const { data, error } = await supabase.from('scheme_qa').select('*').limit(200);

  if (error) {
    console.error(`[SUPABASE ERROR]`, error.message || 'Unknown error');
    return [];
  }

  const records = data || [];
  const detectedSchemes = new Set<string>();
  
  for (const r of records) {
    const sName = (r.scheme_name || '').trim().toLowerCase();
    if (sName && sName.length > 3 && normalizedQuery.includes(sName)) {
      detectedSchemes.add(r.scheme_name);
      detectedConcepts.push(r.scheme_name);
    }
  }

  const rankedResults: SchemeMatch[] = records.map(record => {
    let score = 0;
    const matchReasons: string[] = [];
    
    const schemeName = (record.scheme_name || '').toLowerCase();
    const category = (record.category || '').toLowerCase();
    const beneficiaryType = (record.target_beneficiary || '').toLowerCase();
    const question = (record.question || '').toLowerCase();
    const questionEnglish = (record.question_english || '').toLowerCase();
    const answer = (record.answer || '').toLowerCase();
    const answerEnglish = (record.answer_english || '').toLowerCase();

    if (schemeName && schemeName.length > 3 && normalizedQuery.includes(schemeName)) {
      score += 100;
      matchReasons.push('Exact phrase match in scheme name');
    }

    let matchedConceptsCount = 0;
    const matchedTerms: string[] = [];
    
    const checkTerm = (term: string) => {
      let termScore = 0;
      let matched = false;

      if (schemeName.includes(term)) { termScore += 25; matched = true; }
      else if (category.includes(term)) { termScore += 20; matched = true; }
      else if (beneficiaryType.includes(term)) { termScore += 20; matched = true; }
      else if (question.includes(term)) { termScore += 8; matched = true; }
      else if (questionEnglish.includes(term)) { termScore += 8; matched = true; }
      else if (answer.includes(term)) { termScore += 8; matched = true; }
      else if (answerEnglish.includes(term)) { termScore += 8; matched = true; }

      return { termScore, matched };
    };

    for (const concept of detectedConcepts) {
      const synonyms = conceptMap[concept];
      let conceptScore = 0;
      let conceptMatched = false;
      
      if (synonyms) {
        for (const syn of synonyms) {
          const { termScore, matched } = checkTerm(syn);
          if (matched) {
            if (termScore > conceptScore) conceptScore = termScore;
            if (!matchedTerms.includes(syn)) matchedTerms.push(syn);
            conceptMatched = true;
          }
        }
      }

      if (conceptMatched) {
        score += conceptScore;
        matchedConceptsCount++;
      }
    }

    for (const kw of meaningfulKeywords) {
      if (!Array.from(expandedTerms).includes(kw)) {
        const { termScore, matched } = checkTerm(kw);
        if (matched) {
          score += termScore;
          if (!matchedTerms.includes(kw)) matchedTerms.push(kw);
        }
      }
    }

    if (matchedTerms.length > 0) {
       matchReasons.push(`Matched terms: ${matchedTerms.join(', ')}`);
    }

    return {
      scheme: record,
      score,
      matchReasons,
      matchedTerms
    };
  });

  const validResults = rankedResults.filter(r => r.score >= 10);
  validResults.sort((a, b) => b.score - a.score);
  return validResults.slice(0, 5);
}

export async function searchSchemes(transcript: string): Promise<SchemeMatch[]> {
  console.log(`\n[SEMANTIC SEARCH] Query:\n${transcript}`);
  const normalizedQuery = normalizeText(transcript);
  
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MISSING_KEY') {
    try {
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: transcript,
        config: {
          outputDimensionality: 768,
        },
      });
      
      const embedding = response.embeddings?.[0]?.values;
      
      if (embedding && embedding.length > 0) {
        console.log(`\n[EMBEDDING] Generated: successfully (768 dimensions)`);
        
        const { data, error } = await supabase.rpc('match_schemes', {
          query_embedding: `[${embedding.join(',')}]`,
          match_count: 10
        });
        
        if (error) {
          console.error('[VECTOR SEARCH ERROR]', error);
        } else if (data && data.length > 0) {
          console.log(`\n[VECTOR SEARCH] Results:`);
          data.forEach((r: any) => console.log(`${r.scheme_name}: ${r.similarity}`));
          
          console.log(`\n[VECTOR SEARCH] Top similarity: ${data[0].similarity}`);
          
          // Using a reasonable threshold that can be tuned based on logs
          const SIMILARITY_THRESHOLD = 0.55; 
          
          const validSemanticMatches = data.filter((r: any) => r.similarity >= SIMILARITY_THRESHOLD);
          
          if (validSemanticMatches.length > 0) {
            console.log(`\n[SELECTED SCHEME]:\n${validSemanticMatches[0].scheme_name}`);
            
            return validSemanticMatches.map((r: any) => ({
              scheme: r,
              score: r.similarity * 100, 
              matchReasons: ['Semantic match']
            }));
          } else {
            console.log(`\n[VECTOR SEARCH] No results passed threshold of ${SIMILARITY_THRESHOLD}. Falling back...`);
          }
        } else {
          console.log(`\n[VECTOR SEARCH] No results returned from RPC. Falling back...`);
        }
      }
    } catch (err: any) {
      console.error('[SEMANTIC SEARCH ERROR]', err.message || err);
    }
  } else {
    console.log(`\n[SEMANTIC SEARCH] Skipped. GEMINI_API_KEY is not configured.`);
  }
  
  // Fallback to keyword search
  const rawTokens = normalizedQuery.split(' ');
  const meaningfulKeywords = Array.from(new Set(rawTokens.filter(token => !stopWords.has(token) && token.length > 1)));
  
  return fallbackKeywordSearch(transcript, normalizedQuery, meaningfulKeywords);
}
