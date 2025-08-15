import { supabase } from "@/integrations/supabase/client";

export interface StrongsSearchResult {
  verses: Array<{
    id: string;
    book_name: string;
    chapter_number: number;
    verse_number: number;
    text: string;
    version_code: string;
    book_id: string;
    chapter_id: string;
  }>;
  total_count: number;
  search_term: string;
}

export const searchByStrongsNumber = async (strongsNumber: string): Promise<StrongsSearchResult> => {
  try {
    console.log('Searching for Strong\'s number:', strongsNumber);

    // Clean the Strong's number (remove G/H prefix if present for search)
    const cleanNumber = strongsNumber.replace(/^[GH]/, '');
    console.log('Cleaned Strong\'s number:', cleanNumber);

    // First, let's check what Strong's numbers exist in the database
    const { data: allStrongsWords, error: debugError } = await supabase
      .from('kjv_strongs_words')
      .select('strongs_number')
      .limit(10);
    
    console.log('Sample Strong\'s numbers in database:', allStrongsWords);

    // Try different search patterns
    const searchPatterns = [
      strongsNumber,           // G3588
      cleanNumber,             // 3588
      `G${cleanNumber}`,       // G3588
      `H${cleanNumber}`,       // H3588 (for Hebrew)
      strongsNumber.padStart(5, '0'), // 03588
      `G${cleanNumber.padStart(4, '0')}`, // G3588
      `H${cleanNumber.padStart(5, '0')}`  // H08416
    ];

    console.log('Trying search patterns:', searchPatterns);

    let foundResults = null;

    for (const pattern of searchPatterns) {
      console.log('Trying pattern:', pattern);
      
      const { data: strongsWords, error: strongsError } = await supabase
        .from('kjv_strongs_words')
        .select(`
          verse_id,
          strongs_number,
          word_text,
          verses!inner(
            id,
            text,
            chapter_id,
            version_id,
            verse_number,
            chapters!inner(
              id,
              chapter_number,
              book_id,
              books!inner(
                id,
                name
              )
            ),
            bible_versions!inner(
              code
            )
          )
        `)
        .eq('strongs_number', pattern);

      if (strongsError) {
        console.error(`Error with pattern ${pattern}:`, strongsError);
        continue;
      }

      console.log(`Found ${strongsWords?.length || 0} results with pattern:`, pattern);
      
      if (strongsWords && strongsWords.length > 0) {
        foundResults = strongsWords;
        console.log('Success with pattern:', pattern);
        console.log('Sample result:', strongsWords[0]);
        break;
      }
    }

    if (!foundResults) {
      console.log('No results found with any pattern');
      return {
        verses: [],
        total_count: 0,
        search_term: strongsNumber
      };
    }

    // Transform the data to match the expected format
    const verses = foundResults.map(item => ({
      id: item.verses.id,
      book_name: item.verses.chapters.books.name,
      chapter_number: item.verses.chapters.chapter_number,
      verse_number: item.verses.verse_number,
      text: item.verses.text,
      version_code: item.verses.bible_versions.code,
      book_id: item.verses.chapters.books.id,
      chapter_id: item.verses.chapters.id
    }));

    // Remove duplicates (same verse might have multiple words with the same Strong's number)
    const uniqueVerses = verses.filter((verse, index, self) => 
      index === self.findIndex(v => v.id === verse.id)
    );

    console.log(`Found ${uniqueVerses.length} unique verses with Strong's ${strongsNumber}`);

    return {
      verses: uniqueVerses,
      total_count: uniqueVerses.length,
      search_term: strongsNumber
    };

  } catch (error) {
    console.error('Error in Strong\'s search:', error);
    return {
      verses: [],
      total_count: 0,
      search_term: strongsNumber
    };
  }
};