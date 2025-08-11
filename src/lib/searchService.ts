import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: 'reference' | 'text';
  verses?: {
    id: string;
    text: string;
    verse_number: number;
    chapter_number: number;
    book_name: string;
    book_id: string;
    chapter_id: string;
  }[];
  reference?: {
    book: string;
    chapter: number;
    verses?: number[];
  };
}

// Parse Bible references like "1.Joh.1:2-5", "1Joh 2-5", "1 Joh. 2-5"
export function parseBibleReference(query: string): SearchResult['reference'] | null {
  // Clean the query
  const cleaned = query.trim().replace(/\s+/g, ' ');
  
  // Pattern for Bible references
  const patterns = [
    // "1.Joh.1:2-5" or "1 Joh. 1:2-5"
    /^(\d*\.?\s*\w+\.?)\s*(\d+):(\d+)(?:-(\d+))?$/i,
    // "1Joh 2-5" or "Joh 2-5"
    /^(\d*\.?\s*\w+\.?)\s*(\d+)(?:-(\d+))?$/i,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const bookPart = match[1].replace(/\./g, '').trim();
      const chapter = parseInt(match[2]);
      
      let verses: number[] | undefined;
      if (match[3] && match[4]) {
        // Range like 2-5
        const start = parseInt(match[3]);
        const end = parseInt(match[4]);
        verses = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      } else if (match[3]) {
        // Single verse
        verses = [parseInt(match[3])];
      }

      return {
        book: normalizeBookName(bookPart),
        chapter,
        verses
      };
    }
  }

  return null;
}

// Normalize book names to match database
function normalizeBookName(bookPart: string): string {
  const bookMappings: Record<string, string> = {
    '1joh': '1. Johannes',
    '2joh': '2. Johannes', 
    '3joh': '3. Johannes',
    'joh': 'Johannes',
    '1moos': '1. Mooses',
    '2moos': '2. Mooses',
    '3moos': '3. Mooses',
    '4moos': '4. Mooses',
    '5moos': '5. Mooses',
    'matt': 'Matteus',
    'mark': 'Markus',
    'luuk': 'Luukas',
    'apt': 'Apostolien teot',
    'room': 'Roomalaiset',
    '1kor': '1. Korinttilaiset',
    '2kor': '2. Korinttilaiset',
    'gal': 'Galatalaiset',
    'ef': 'Efesolaiset',
    'fil': 'Filippiläiset',
    'kol': 'Kolossalaiset',
    '1tess': '1. Tessalonikalaiset',
    '2tess': '2. Tessalonikalaiset',
    '1tim': '1. Timoteus',
    '2tim': '2. Timoteus',
    'tit': 'Titus',
    'filem': 'Filemon',
    'hebr': 'Heprealaiset',
    'jaak': 'Jaakob',
    '1piet': '1. Pietari',
    '2piet': '2. Pietari',
    'juud': 'Juuda',
    'ilm': 'Ilmestys'
  };

  const normalized = bookPart.toLowerCase().replace(/\s/g, '');
  return bookMappings[normalized] || bookPart;
}

// Search for Bible references
export async function searchReference(reference: SearchResult['reference']): Promise<SearchResult> {
  if (!reference) {
    return { type: 'reference', verses: [] };
  }

  try {
    let query = (supabase as any)
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapters!inner(
          chapter_number,
          books!inner(
            name,
            id
          ),
          id
        )
      `)
      .eq('chapters.books.name', reference.book)
      .eq('chapters.chapter_number', reference.chapter);

    if (reference.verses && reference.verses.length > 0) {
      query = query.in('verse_number', reference.verses);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Reference search error:', error);
      return { type: 'reference', verses: [] };
    }

    const verses = data?.map((verse: any) => ({
      id: verse.id,
      text: verse.text,
      verse_number: verse.verse_number,
      chapter_number: verse.chapters.chapter_number,
      book_name: verse.chapters.books.name,
      book_id: verse.chapters.books.id,
      chapter_id: verse.chapters.id
    })) || [];

    return {
      type: 'reference',
      verses,
      reference
    };
  } catch (error) {
    console.error('Reference search error:', error);
    return { type: 'reference', verses: [] };
  }
}

// Search for text using full-text search
export async function searchText(searchTerm: string): Promise<SearchResult> {
  if (!searchTerm.trim()) {
    return { type: 'text', verses: [] };
  }

  try {
    const { data, error } = await (supabase as any)
      .from('verses')
      .select(`
        id,
        text,
        verse_number,
        chapters!inner(
          chapter_number,
          books!inner(
            name,
            id
          ),
          id
        )
      `)
      .textSearch('text_search', searchTerm, { type: 'websearch' })
      .limit(50);

    if (error) {
      console.error('Text search error:', error);
      return { type: 'text', verses: [] };
    }

    const verses = data?.map((verse: any) => ({
      id: verse.id,
      text: verse.text,
      verse_number: verse.verse_number,
      chapter_number: verse.chapters.chapter_number,
      book_name: verse.chapters.books.name,
      book_id: verse.chapters.books.id,
      chapter_id: verse.chapters.id
    })) || [];

    return {
      type: 'text',
      verses
    };
  } catch (error) {
    console.error('Text search error:', error);
    return { type: 'text', verses: [] };
  }
}

// Main search function that determines search type
export async function performSearch(query: string): Promise<SearchResult> {
  if (!query.trim()) {
    return { type: 'text', verses: [] };
  }

  // Try to parse as Bible reference first
  const reference = parseBibleReference(query);
  if (reference) {
    return await searchReference(reference);
  }

  // Otherwise, perform text search
  return await searchText(query);
}
