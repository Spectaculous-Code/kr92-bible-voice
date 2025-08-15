import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import VerseStudy from "@/components/VerseStudy";
import { supabase } from "@/integrations/supabase/client";
import { getEnglishBookName } from "@/lib/bookNameMapping";

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
      
      if (!book || !chapter || !verse) return;

      // Get the English book name for database lookup
      const englishBookName = getEnglishBookName(book);
      const chapterNum = parseInt(chapter);
      const verseNum = parseInt(verse);

      // Create OSIS reference
      const osisRef = `${englishBookName}.${chapterNum}.${verseNum}`;

      // Fetch verse text from default version (fin2017)
      const { data: finVersion } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', 'fin2017')
        .single();

      if (!finVersion) return;

      const { data: verseData } = await supabase
        .from('verses')
        .select(`
          text,
          verse_keys!inner(osis)
        `)
        .eq('version_id', finVersion.id)
        .eq('verse_keys.osis', osisRef)
        .single();

      if (verseData) {
        setSelectedVerse({
          bookName: englishBookName,
          chapter: chapterNum,
          verse: verseNum,
          text: verseData.text
        });
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
        <div className="text-lg">Ladataan jaketutkimusta...</div>
      </div>
    );
  }

  if (!selectedVerse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Jaketta ei löytynyt</div>
      </div>
    );
  }

  return <VerseStudy selectedVerse={selectedVerse} onBack={handleBack} />;
};

export default VerseStudyPage;