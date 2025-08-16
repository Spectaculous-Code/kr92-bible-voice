import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LexiconData {
  strongs_number: string;
  language: string;
  lemma: string;
  transliterations: string[];
  pronunciations: string[];
  derivation: string;
  part_of_speech: string;
  definition_short: string;
  definition_lit: string;
  definition_long: string;
  notes: string;
  compare: string[];
  see_also: string[];
}

interface LexiconCardProps {
  strongsNumber: string;
  onSearch: () => void;
  isSearching?: boolean;
  onStrongsLink?: (strongsNumber: string) => void;
}

const LexiconCard = ({ strongsNumber, onSearch, isSearching = false, onStrongsLink }: LexiconCardProps) => {
  const [lexiconData, setLexiconData] = useState<LexiconData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedTexts, setProcessedTexts] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (strongsNumber) {
      fetchLexiconData();
    }
  }, [strongsNumber]);

  useEffect(() => {
    // Process texts when lexicon data changes
    if (lexiconData) {
      const textsToProcess: {[key: string]: string} = {};
      
      if (lexiconData.derivation) {
        textsToProcess.derivation = lexiconData.derivation;
      }
      if (lexiconData.notes) {
        textsToProcess.notes = lexiconData.notes;
      }
      if (lexiconData.definition_long) {
        // Split definition_long by semicolon and process each part separately
        lexiconData.definition_long.split(';').forEach((part, index) => {
          textsToProcess[`definition_long_${index}`] = part.trim();
        });
      }
      
      // Process all texts asynchronously
      Object.entries(textsToProcess).forEach(async ([key, text]) => {
        const processed = await parseAndRenderStrongsText(text);
        setProcessedTexts(prev => ({ ...prev, [key]: processed }));
      });
    }
  }, [lexiconData]);

  const fetchLexiconData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean the Strong's number - handle multiple numbers by taking the first one
      const firstNumber = strongsNumber.split(', ')[0];
      // Normalize Strong's number by removing leading zeros (H0085 -> H85)
      const normalizedNumber = firstNumber.replace(/^([HG])0+/, '$1');
      console.log('Fetching lexicon data for:', firstNumber, 'normalized to:', normalizedNumber);
      
      // Query the strongs_lexicon table directly
      const { data, error } = await supabase
        .from('strongs_lexicon' as any)
        .select('*')
        .eq('strongs_number', normalizedNumber)
        .limit(1);

      if (error) {
        console.error('Error fetching lexicon data:', error);
        setError('Lexicon data not found');
      } else if (data && Array.isArray(data) && data.length > 0) {
        const lexiconEntry = data[0] as unknown as LexiconData;
        setLexiconData(lexiconEntry);
        console.log('Lexicon data fetched:', lexiconEntry);
      } else {
        setError('No lexicon data found for this Strong\'s number');
      }
    } catch (error) {
      console.error('Error in fetchLexiconData:', error);
      setError('Failed to fetch lexicon data');
    } finally {
      setLoading(false);
    }
  };

  const formatTransliterations = (transliterations: string[], pronunciations: string[]) => {
    if (!transliterations?.length && !pronunciations?.length) return null;
    
    const translit = transliterations?.[0] || '';
    const pronun = pronunciations?.join(' | ') || '';
    
    if (translit && pronun) {
      return `(${pronun})`;
    }
    return pronun ? `(${pronun})` : '';
  };

  const fetchStrongsName = async (strongsNum: string): Promise<string> => {
    try {
      // Normalize Strong's number by removing leading zeros (H0085 -> H85)
      const normalizedNum = strongsNum.replace(/^([HG])0+/, '$1');
      
      const { data, error } = await supabase
        .from('strongs_lexicon' as any)
        .select('lemma')
        .eq('strongs_number', normalizedNum)
        .limit(1);
      
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const entry = data[0] as unknown as { lemma: string };
        return entry.lemma || strongsNum;
      }
    } catch (error) {
      console.error('Error fetching Strong\'s name:', error);
    }
    return strongsNum;
  };

  const parseAndRenderStrongsText = async (text: string): Promise<string> => {
    // Extract all Strong's numbers from text like "from [[H8130]]", "[[G2189]]", or "(h0085)"
    const bracketMatches = text.match(/\[\[([GH]\d+)\]\]/g) || [];
    const parenMatches = text.match(/\(([gh]\d+)\)/gi) || [];
    
    let processedText = text;
    
    // Process bracket format [[H1234]]
    for (const match of bracketMatches) {
      const strongsNum = match.replace(/\[\[|\]\]/g, '');
      const normalizedNum = strongsNum.replace(/^([HG])0+/, '$1'); // Remove leading zeros
      const englishName = await fetchStrongsName(strongsNum);
      const linkElement = `<span class="cursor-pointer text-primary hover:text-primary/80 underline" data-strongs="${normalizedNum}">${englishName}</span>`;
      processedText = processedText.replace(match, linkElement);
    }
    
    // Process parentheses format (h0085) - replace entirely with quoted English name
    for (const match of parenMatches) {
      const strongsNum = match.replace(/\(|\)/g, '').toUpperCase(); // Convert h0085 to H0085
      const normalizedNum = strongsNum.replace(/^([HG])0+/, '$1'); // Remove leading zeros
      const englishName = await fetchStrongsName(strongsNum);
      const linkElement = `"<span class="cursor-pointer text-primary hover:text-primary/80 underline" data-strongs="${normalizedNum}">${englishName}</span>"`;
      processedText = processedText.replace(match, linkElement);
    }
    
    return processedText;
  };

  const renderStrongsText = (text: string, fieldKey: string) => {
    const processedText = processedTexts[fieldKey] || text;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const strongsNum = target.dataset.strongs;
      if (strongsNum && onStrongsLink) {
        onStrongsLink(strongsNum);
      }
    };

    return (
      <div 
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedText }}
      />
    );
  };

  const renderReferences = (refs: string[], type: string) => {
    if (!refs?.length) return null;
    
    return (
      <div>
        <span className="font-semibold">{type}: </span>
        {refs.map((ref, index) => (
          <span key={index}>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-base text-primary hover:text-primary/80 underline font-normal"
              onClick={() => onStrongsLink?.(ref)}
            >
              {ref}
            </Button>
            {index < refs.length - 1 ? ', ' : ''}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground">Loading lexicon data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !lexiconData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Strong's {strongsNumber}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSearch}
              disabled={isSearching}
            >
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Etsitään...' : 'Hae jakeita'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">{error || 'Lexicon data not available'}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-lg">
              Strong's {lexiconData.strongs_number}: {lexiconData.lemma}
              {lexiconData.transliterations?.[0] && (
                <span className="ml-2 font-normal">, {lexiconData.transliterations[0]}</span>
              )}
            </div>
            {formatTransliterations(lexiconData.transliterations, lexiconData.pronunciations) && (
              <div className="text-sm text-muted-foreground font-normal">
                {formatTransliterations(lexiconData.transliterations, lexiconData.pronunciations)}
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSearch}
            disabled={isSearching}
          >
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Etsitään...' : 'Hae jakeita'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lexiconData.derivation && (
            <div className="flex items-start gap-1">
              <span className="font-semibold">Derivation:</span>
              {renderStrongsText(lexiconData.derivation, 'derivation')}
            </div>
          )}
          
          <div className="flex items-start gap-1">
            <span className="font-semibold">Definition:</span>
            <div className="space-y-2">
              {lexiconData.definition_short && (
                <div>{lexiconData.definition_short}</div>
              )}
              {lexiconData.definition_lit && (
                <div className="text-muted-foreground italic">{lexiconData.definition_lit}</div>
              )}
              {lexiconData.definition_long && (
                <div>
                  {lexiconData.definition_long.split(';').map((part, index) => (
                    <div key={index} className="mb-1 flex items-start gap-1">
                      <span>-</span>
                      <div>{renderStrongsText(part.trim(), `definition_long_${index}`)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {lexiconData.part_of_speech && (
            <div>
              <span className="font-semibold">Part of Speech: </span>
              <span>{lexiconData.part_of_speech}</span>
            </div>
          )}

          {lexiconData.notes && (
            <div>
              <span className="font-semibold">Notes: </span>
              {renderStrongsText(lexiconData.notes, 'notes')}
            </div>
          )}

          {renderReferences(lexiconData.compare, 'Compare')}
          {renderReferences(lexiconData.see_also, 'See also')}
        </div>
      </CardContent>
    </Card>
  );
};

export default LexiconCard;