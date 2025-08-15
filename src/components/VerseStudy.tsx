import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFinnishBookName } from "@/lib/bookNameMapping";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SelectedVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

interface VerseStudyProps {
  selectedVerse: SelectedVerse;
  onBack: () => void;
}

interface KJVVerseData {
  osis: string;
  plain_text: string;
  tagged_text: string;
}

interface StrongsDefinition {
  number: string;
  definition: string;
  partOfSpeech: string;
  transliteration: string;
}

const VerseStudy = ({ selectedVerse, onBack }: VerseStudyProps) => {
  const [kjvVerse, setKjvVerse] = useState<KJVVerseData | null>(null);
  const [selectedStrongsNumber, setSelectedStrongsNumber] = useState<string | null>(null);
  const [strongsDefinition, setStrongsDefinition] = useState<StrongsDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKJVVerse();
  }, [selectedVerse]);

  const fetchKJVVerse = async () => {
    try {
      setLoading(true);
      
      // Create OSIS reference from selected verse
      const osisRef = `${selectedVerse.bookName}.${selectedVerse.chapter}.${selectedVerse.verse}`;
      
      // Try to use the database function first
      const { data, error } = await supabase
        .rpc('get_kjv_verse_with_strongs', { p_osis: osisRef });

      if (error) {
        console.error('Error fetching KJV verse with function:', error);
        // Fallback to manual query
        await fetchKJVVerseManual(osisRef);
      } else if (data && Array.isArray(data) && data.length > 0) {
        setKjvVerse(data[0] as KJVVerseData);
      } else {
        // Try manual query as fallback
        await fetchKJVVerseManual(osisRef);
      }
    } catch (error) {
      console.error('Error in fetchKJVVerse:', error);
      await fetchKJVVerseManual(`${selectedVerse.bookName}.${selectedVerse.chapter}.${selectedVerse.verse}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchKJVVerseManual = async (osisRef: string) => {
    try {
      // Get KJV version ID
      const { data: kjvVersion } = await supabase
        .from('bible_versions')
        .select('id')
        .eq('code', 'KJV')
        .single();

      if (!kjvVersion) return;

      // Get verse with Strong's words
      const { data: verseData } = await supabase
        .from('verses')
        .select(`
          id,
          text,
          verse_keys!inner(osis)
        `)
        .eq('version_id', kjvVersion.id)
        .eq('verse_keys.osis', osisRef)
        .single();

      if (verseData) {
        // Get Strong's words separately
        const { data: strongsWords } = await supabase
          .from('kjv_strongs_words')
          .select('word_text, word_order, strongs_number')
          .eq('verse_id', verseData.id)
          .order('word_order');

        // Construct tagged text from Strong's words
        const words = strongsWords || [];
        const taggedText = words
          .map(word => {
            if (word.strongs_number) {
              return `${word.word_text}<${word.strongs_number}>`;
            }
            return word.word_text;
          })
          .join(' ');

        setKjvVerse({
          osis: osisRef,
          plain_text: verseData.text,
          tagged_text: taggedText || verseData.text
        });
      }
    } catch (error) {
      console.error('Error in manual KJV fetch:', error);
    }
  };

  const handleStrongsClick = (strongsNumber: string) => {
    setSelectedStrongsNumber(strongsNumber);
    // In a real implementation, you would fetch the Strong's definition
    // For now, we'll show a placeholder
    setStrongsDefinition({
      number: strongsNumber,
      definition: `Definition for Strong's ${strongsNumber} would appear here`,
      partOfSpeech: "noun/verb/adjective",
      transliteration: "transliteration here"
    });
  };

  const renderTaggedText = (taggedText: string) => {
    // Parse the tagged text and create clickable Strong's numbers
    return taggedText.split(' ').map((word, index) => {
      const strongsMatch = word.match(/^(.+?)<(.+?)>$/);
      if (strongsMatch) {
        const [, wordText, strongsNum] = strongsMatch;
        return (
          <span key={index}>
            {wordText}
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-blue-600 hover:text-blue-800 ml-0.5"
              onClick={() => handleStrongsClick(strongsNum)}
            >
              [{strongsNum}]
            </Button>
            {index < taggedText.split(' ').length - 1 ? ' ' : ''}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Takaisin
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Jaetutkimus</h1>
        </div>
      </div>

      {/* Original verse */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">
              {getFinnishBookName(selectedVerse.bookName)} {selectedVerse.chapter}:{selectedVerse.verse}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">{selectedVerse.text}</p>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* KJV with Strong's numbers */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">KJV Strong numeroilla</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Ladataan KJV-tekstiä...</div>
          ) : kjvVerse ? (
            <div className="text-lg leading-relaxed">
              {renderTaggedText(kjvVerse.tagged_text)}
            </div>
          ) : (
            <div className="text-muted-foreground">
              KJV-tekstiä ei löytynyt tälle jakeelle.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strong's definition */}
      {selectedStrongsNumber && strongsDefinition && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">Strong's {selectedStrongsNumber}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Määritelmä: </span>
                <span>{strongsDefinition.definition}</span>
              </div>
              <div>
                <span className="font-semibold">Sanaluokka: </span>
                <span>{strongsDefinition.partOfSpeech}</span>
              </div>
              <div>
                <span className="font-semibold">Translitteraatio: </span>
                <span>{strongsDefinition.transliteration}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerseStudy;