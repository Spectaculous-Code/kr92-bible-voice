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
}

const LexiconCard = ({ strongsNumber, onSearch, isSearching = false }: LexiconCardProps) => {
  const [lexiconData, setLexiconData] = useState<LexiconData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (strongsNumber) {
      fetchLexiconData();
    }
  }, [strongsNumber]);

  const fetchLexiconData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean the Strong's number - handle multiple numbers by taking the first one
      const firstNumber = strongsNumber.split(', ')[0];
      console.log('Fetching lexicon data for:', firstNumber);
      
      // Query the strongs_lexicon table directly
      const { data, error } = await supabase
        .from('strongs_lexicon' as any)
        .select('*')
        .eq('strongs_number', firstNumber)
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

  const renderReferences = (refs: string[], type: string) => {
    if (!refs?.length) return null;
    
    return (
      <div>
        <span className="font-semibold">{type}: </span>
        {refs.map((ref, index) => (
          <span key={index}>
            [[{ref}]]
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
            <div>
              <span className="font-semibold">Derivation: </span>
              <span>{lexiconData.derivation}</span>
            </div>
          )}
          
          <div>
            <span className="font-semibold">Definition:</span>
            <div className="mt-1 space-y-2">
              {lexiconData.definition_short && (
                <div>{lexiconData.definition_short}</div>
              )}
              {lexiconData.definition_lit && (
                <div className="text-muted-foreground italic">{lexiconData.definition_lit}</div>
              )}
              {lexiconData.definition_long && (
                <div>"{lexiconData.definition_long}"</div>
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
              <span>{lexiconData.notes}</span>
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