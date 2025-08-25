import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Highlighter, ExternalLink, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getFinnishBookName } from '@/lib/bookNameMapping';
import { useToast } from '@/components/ui/use-toast';

interface UserHighlight {
  id: string;
  color: string;
  created_at: string;
  verses: {
    id: string;
    verse_number: number;
    text: string;
    chapters: {
      chapter_number: number;
      books: {
        name: string;
      };
    };
  };
}

const UserHighlights = () => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<UserHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHighlights();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHighlights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('highlights')
        .select(`
          id,
          color,
          created_at,
          verses!inner(
            id,
            verse_number,
            text,
            chapters!inner(
              chapter_number,
              books!inner(name)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching highlights:', error);
      } else {
        setHighlights(data || []);
      }
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHighlight = async (highlightId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Virhe",
          description: "Korostuksen poistaminen epäonnistui",
          variant: "destructive",
        });
      } else {
        setHighlights(highlights.filter(h => h.id !== highlightId));
        toast({
          title: "Korostus poistettu",
          description: "Korostus on poistettu onnistuneesti",
        });
      }
    } catch (error) {
      toast({
        title: "Virhe",
        description: "Korostuksen poistaminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Highlighter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Kirjaudu sisään</CardTitle>
            <CardDescription>
              Kirjaudu sisään nähdäksesi korostuksesi
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ladataan korostuksia...</p>
        </div>
      </div>
    );
  }

  if (highlights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Highlighter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Ei korostuksia</CardTitle>
            <CardDescription>
              Et ole vielä korostanut yhtään jaetta. Korosta jakeita tallentaaksesi ne!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getHighlightColor = (color: string) => {
    switch (color) {
      case '#FFFF00': return 'bg-yellow-200';
      case '#90EE90': return 'bg-green-200';
      case '#FFB6C1': return 'bg-pink-200';
      case '#87CEEB': return 'bg-blue-200';
      default: return 'bg-yellow-200';
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Korostukseni</h2>
        <div className="text-sm text-muted-foreground">
          {highlights.length} korostettu jae
        </div>
      </div>

      <div className="space-y-4">
        {highlights.map((highlight) => (
          <Card key={highlight.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {getFinnishBookName(highlight.verses.chapters.books.name)} {' '}
                  {highlight.verses.chapters.chapter_number}:{highlight.verses.verse_number}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-4 h-4 rounded-full ${getHighlightColor(highlight.color)} border`}
                    title="Korostuksen väri"
                  />
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Avaa jae
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteHighlight(highlight.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Korostettu {new Date(highlight.created_at).toLocaleDateString('fi-FI')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-3 rounded-lg ${getHighlightColor(highlight.color)}`}>
                <p className="text-sm leading-relaxed">{highlight.verses.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserHighlights;