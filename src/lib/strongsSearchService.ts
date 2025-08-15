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

    // Search for verses that contain this Strong's number
    // First, get all verses that have Strong's words with this number
    const { data: strongsWords, error: strongsError } = await supabase
      .from('kjv_strongs_words')
      .select(`
        verse_id,
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
      .eq('strongs_number', strongsNumber);

    if (strongsError) {
      console.error('Error searching Strong\'s words:', strongsError);
      return {
        verses: [],
        total_count: 0,
        search_term: strongsNumber
      };
    }

    // Transform the data to match the expected format
    const verses = strongsWords?.map(item => ({
      id: item.verses.id,
      book_name: item.verses.chapters.books.name,
      chapter_number: item.verses.chapters.chapter_number,
      verse_number: item.verses.verse_number,
      text: item.verses.text,
      version_code: item.verses.bible_versions.code,
      book_id: item.verses.chapters.books.id,
      chapter_id: item.verses.chapters.id
    })) || [];

    // Remove duplicates (same verse might have multiple words with the same Strong's number)
    const uniqueVerses = verses.filter((verse, index, self) => 
      index === self.findIndex(v => v.id === verse.id)
    );

    console.log(`Found ${uniqueVerses.length} verses with Strong's ${strongsNumber}`);

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