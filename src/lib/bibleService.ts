import { supabase } from "@/integrations/supabase/client";

export interface BibleBook {
  id: string;
  name: string;
  testament: string;
  chapters_count: number;
  book_order: number;
}

export interface BibleChapter {
  id: string;
  chapter_number: number;
  verses_count: number;
  book_id: string;
}

export interface BibleVerse {
  id: string;
  verse_number: number;
  text: string;
  audio_url?: string;
}

export interface BibleVersion {
  id: string;
  code: string;
  name: string;
  language: string;
}

export interface ChapterWithVerses {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

// Get all Bible versions
export const getBibleVersions = async (): Promise<BibleVersion[]> => {
  const { data, error } = await supabase
    .from('bible_versions')
    .select('*')
    .eq('is_active', true)
    .order('code');

  if (error) {
    console.error('Error fetching Bible versions:', error);
    return [];
  }

  return data || [];
};

// Get all books for the default version
export const getBibleBooks = async (versionCode: string = 'finprfinni'): Promise<BibleBook[]> => {
  // First get the version
  const { data: version, error: versionError } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', versionCode)
    .single();

  if (versionError || !version) {
    console.error('Error fetching version:', versionError);
    return [];
  }

  // Get books for this specific version
  const { data: rawData, error } = await supabase
    .from('books')
    .select('id, name, testament, chapters_count, book_order')
    .eq('version_id', version.id)
    .order('book_order');

  if (error) {
    console.error('Error fetching books:', error);
    return [];
  }

  if (!rawData) return [];
  
  const books: BibleBook[] = rawData.map((book: any) => ({
    id: book.id,
    name: book.name,
    testament: book.testament,
    chapters_count: book.chapters_count,
    book_order: book.book_order
  }));
  
  return books;
};

// Get chapter with verses
export const getChapterData = async (bookName: string, chapterNumber: number, versionCode: string = 'finprfinni'): Promise<ChapterWithVerses | null> => {
  try {
    // Get the version first
    const { data: version, error: versionError } = await supabase
      .from('bible_versions')
      .select('id')
      .eq('code', versionCode)
      .single();

    if (versionError || !version) {
      console.error('Error fetching version:', versionError);
      return null;
    }

    // Get the book for this specific version
    const { data: books, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('name', bookName)
      .eq('version_id', version.id)
      .single();

    if (bookError || !books) {
      console.error('Error fetching book:', bookError);
      return null;
    }

    // Get the chapter
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id')
      .eq('book_id', books.id)
      .eq('chapter_number', chapterNumber)
      .single();

    if (chapterError || !chapter) {
      console.error('Error fetching chapter:', chapterError);
      return null;
    }

    // Get verses for this chapter
    const { data: verses, error: versesError } = await supabase
      .from('verses')
      .select('*')
      .eq('chapter_id', chapter.id)
      .eq('version_id', version.id)
      .order('verse_number');

    if (versesError) {
      console.error('Error fetching verses:', versesError);
      return null;
    }

    return {
      book: bookName,
      chapter: chapterNumber,
      verses: verses || []
    };
  } catch (error) {
    console.error('Error in getChapterData:', error);
    return null;
  }
};

// Get chapters for a book
export const getBookChapters = async (bookName: string, versionCode: string = 'finprfinni'): Promise<number> => {
  // First get the version
  const { data: version, error: versionError } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', versionCode)
    .single();

  if (versionError || !version) {
    console.error('Error fetching version:', versionError);
    return 0;
  }

  const { data, error } = await supabase
    .from('books')
    .select('chapters_count')
    .eq('name', bookName)
    .eq('version_id', version.id)
    .single();

  if (error) {
    console.error('Error fetching book chapters:', error);
    return 0;
  }

  return data?.chapters_count || 0;
};

// Get next chapter data (book and chapter number)
export const getNextChapter = async (currentBookName: string, currentChapter: number, versionCode: string = 'finprfinni'): Promise<{book: string, chapter: number} | null> => {
  // First get the version
  const { data: version, error: versionError } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', versionCode)
    .single();

  if (versionError || !version) {
    console.error('Error fetching version:', versionError);
    return null;
  }

  // First get the current book
  const { data: currentBook, error: bookError } = await supabase
    .from('books')
    .select('id, chapters_count, book_order')
    .eq('name', currentBookName)
    .eq('version_id', version.id)
    .single();

  if (bookError || !currentBook) {
    console.error('Error fetching current book:', bookError);
    return null;
  }

  // If there's a next chapter in the same book
  if (currentChapter < currentBook.chapters_count) {
    return {
      book: currentBookName,
      chapter: currentChapter + 1
    };
  }

  // Otherwise, get the next book
  const { data: nextBook, error: nextBookError } = await supabase
    .from('books')
    .select('name, chapters_count')
    .eq('version_id', version.id)
    .gt('book_order', currentBook.book_order)
    .order('book_order')
    .limit(1)
    .single();

  if (nextBookError || !nextBook) {
    // No next book available
    return null;
  }

  return {
    book: nextBook.name,
    chapter: 1
  };
};

// Get previous chapter data (book and chapter number)
export const getPreviousChapter = async (currentBookName: string, currentChapter: number, versionCode: string = 'finprfinni'): Promise<{book: string, chapter: number} | null> => {
  // First get the version
  const { data: version, error: versionError } = await supabase
    .from('bible_versions')
    .select('id')
    .eq('code', versionCode)
    .single();

  if (versionError || !version) {
    console.error('Error fetching version:', versionError);
    return null;
  }

  // First get the current book
  const { data: currentBook, error: bookError } = await supabase
    .from('books')
    .select('id, chapters_count, book_order')
    .eq('name', currentBookName)
    .eq('version_id', version.id)
    .single();

  if (bookError || !currentBook) {
    console.error('Error fetching current book:', bookError);
    return null;
  }

  // If there's a previous chapter in the same book
  if (currentChapter > 1) {
    return {
      book: currentBookName,
      chapter: currentChapter - 1
    };
  }

  // Otherwise, get the previous book
  const { data: prevBook, error: prevBookError } = await supabase
    .from('books')
    .select('name, chapters_count')
    .eq('version_id', version.id)
    .lt('book_order', currentBook.book_order)
    .order('book_order', { ascending: false })
    .limit(1)
    .single();

  if (prevBookError || !prevBook) {
    // No previous book available
    return null;
  }

  return {
    book: prevBook.name,
    chapter: prevBook.chapters_count
  };
};
