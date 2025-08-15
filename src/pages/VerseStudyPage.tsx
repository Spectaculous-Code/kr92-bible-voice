import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import VerseStudy from "@/components/VerseStudy";
import { supabase } from "@/integrations/supabase/client";
import { getEnglishBookName, englishToFinnishBookNames } from "@/lib/bookNameMapping";

interface SelectedVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

const VerseStudyPage = () => {
  const { book, chapter, verse } = useParams<{
    book: string;
    chapter: string;
    verse: string;
  }>();
  const navigate = useNavigate();
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (book && chapter && verse) {
      fetchVerseData();
    }
  }, [book, chapter, verse]);

  const fetchVerseData = async () => {
    try {
      setLoading(true);
      
      if (!book || !chapter || !verse) {
        console.log('Missing parameters:', { book, chapter, verse });
        return;
      }

      const chapterNum = parseInt(chapter);
      const verseNum = parseInt(verse);
      
      console.log('Fetching verse data for:', { book, chapterNum, verseNum });

      // Try to get the current version from localStorage or default to fin2017
      const currentVersion = localStorage.getItem('selectedBibleVersion') || 'fin2017';
      console.log('Using version:', currentVersion);

      // First, let's try to find the book name as-is, then try English mapping
      let bookName = book;
      console.log('Original book name:', bookName);
      
      // If it's a Finnish book name, try to get English equivalent
      if (Object.values(englishToFinnishBookNames).includes(book)) {
        bookName = getEnglishBookName(book);
        console.log('Mapped to English book name:', bookName);
      }

      // Fetch version data
      const { data: versionData, error: versionError } = await supabase
        .from('bible_versions')
        .select('id, code')
        .eq('code', currentVersion)
        .single();

      if (versionError || !versionData) {
        console.error('Version error:', versionError);
        // Fallback to fin2017
        const { data: fallbackVersion } = await supabase
          .from('bible_versions')
          .select('id, code')
          .eq('code', 'fin2017')
          .single();
        
        if (!fallbackVersion) {
          console.error('No fallback version found');
          return;
        }
        console.log('Using fallback version:', fallbackVersion);
      }

      const version = versionData || await supabase.from('bible_versions').select('id, code').eq('code', 'fin2017').single().then(r => r.data);
      if (!version) return;

      // Try different OSIS reference formats
      const osisFormats = [
        `${bookName}.${chapterNum}.${verseNum}`,
        `${book}.${chapterNum}.${verseNum}`,
        // Add more potential formats if needed
      ];

      console.log('Trying OSIS formats:', osisFormats);

      let verseData = null;
      let usedOsis = '';

      for (const osisRef of osisFormats) {
        console.log('Trying OSIS:', osisRef);
        
        const { data, error } = await supabase
          .from('verses')
          .select(`
            text,
            verse_keys!inner(osis)
          `)
          .eq('version_id', version.id)
          .eq('verse_keys.osis', osisRef)
          .single();

        if (error) {
          console.log('Error with OSIS', osisRef, ':', error);
        } else if (data) {
          console.log('Found verse with OSIS:', osisRef, data);
          verseData = data;
          usedOsis = osisRef;
          break;
        }
      }

      if (verseData) {
        setSelectedVerse({
          bookName: bookName,
          chapter: chapterNum,
          verse: verseNum,
          text: verseData.text
        });
        console.log('Successfully set verse data');
      } else {
        console.error('No verse found with any OSIS format');
      }
    } catch (error) {
      console.error('Error fetching verse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Ladataan jaetutkimusta...</div>
      </div>
    );
  }

  if (!selectedVerse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Jaetta ei löytynyt</div>
      </div>
    );
  }

  return <VerseStudy selectedVerse={selectedVerse} onBack={handleBack} />;
};

export default VerseStudyPage;