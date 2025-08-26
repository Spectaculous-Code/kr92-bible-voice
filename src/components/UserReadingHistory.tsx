import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, BookOpen, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ReadingHistoryItem {
  id: string;
  last_read_at: string;
  chapter_number: number;
  verse_number: number;
  book: {
    name: string;
    name_localized?: string;
  };
  version: {
    code: string;
    name: string;
  };
}

const UserReadingHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReadingHistory();
    }
  }, [user]);

  const fetchReadingHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_reading_history')
        .select(`
          id,
          last_read_at,
          chapter_number,
          verse_number,
          book:book_id (
            name,
            name_localized
          ),
          version:version_id (
            code,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching reading history:', error);
      } else {
        setHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching reading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Kirjaudu sisään</CardTitle>
          <CardDescription>
            Kirjaudu sisään nähdäksesi lukuhistoriasi
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Ladataan lukuhistoriaa...</span>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>Ei lukuhistoriaa</CardTitle>
          <CardDescription>
            Ala lukemaan Raamattua lisätäksesi lukuhistoriaa
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Lukuhistoria</h2>
      </div>
      
      <div className="grid gap-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    {item.book.name_localized || item.book.name} {item.chapter_number}:{item.verse_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.version.name} ({item.version.code})
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.last_read_at), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to the verse - this would need proper routing implementation
                    console.log('Navigate to verse:', item);
                  }}
                >
                  Avaa jae
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserReadingHistory;