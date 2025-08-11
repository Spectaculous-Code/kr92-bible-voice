import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack, SkipForward, Volume2, Bookmark } from "lucide-react";
import BibleReader from "./BibleReader";
import SearchResults from "./SearchResults";
import { performSearch, SearchResult } from "@/lib/searchService";
import { getBibleBooks, BibleBook } from "@/lib/bibleService";
import { getFinnishBookName, getEnglishBookName } from "@/lib/bookNameMapping";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

interface BibleVersion {
  id: string;
  name: string;
  code: string;
}

interface MainContentProps {
  selectedBook: string;
  selectedChapter: number;
  targetVerse?: number;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
  currentView: 'bible' | 'search' | 'summaries' | 'highlights';
  searchQuery?: string;
}

const MainContent = ({
  selectedBook,
  selectedChapter,
  targetVerse,
  onBookSelect,
  onChapterSelect,
  currentView,
  searchQuery = ""
}: MainContentProps) => {
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [bibleVersions, setBibleVersions] = useState<BibleVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      const [books, versionsResult] = await Promise.all([
        getBibleBooks(),
        supabase.from('bible_versions').select('id, name, code').eq('is_active', true).order('name')
      ]);
      
      setBibleBooks(books);
      
      if (versionsResult.data) {
        setBibleVersions(versionsResult.data);
        if (versionsResult.data.length > 0) {
          setSelectedVersion(versionsResult.data[0].id);
        }
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentView === 'search' && searchQuery) {
      handleSearch(searchQuery);
    }
  }, [currentView, searchQuery, selectedVersion]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const results = await performSearch(query, selectedVersion);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Hakuvirhe",
        description: "Haku epäonnistui, yritä uudelleen",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigateToVerse = (bookName: string, chapter: number, verse?: number) => {
    onBookSelect(bookName);
    onChapterSelect(chapter);
    toast({
      title: "Siirretty",
      description: `${getFinnishBookName(bookName)} ${chapter}${verse ? `:${verse}` : ''}`,
    });
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    toast({
      title: isPlaying ? "Toisto pysäytetty" : "Toisto aloitettu",
      description: `${getFinnishBookName(selectedBook)} ${selectedChapter}`,
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Hakutulokset</h2>
            <SearchResults
              results={searchResults}
              onClose={() => setSearchResults(null)}
              onNavigateToVerse={handleNavigateToVerse}
              isLoading={isSearching}
            />
          </div>
        );
      
      case 'summaries':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Koosteeni</h2>
            <p className="text-muted-foreground">Koosteesi näkyvät täällä.</p>
          </div>
        );
      
      case 'highlights':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Korostukset</h2>
            <p className="text-muted-foreground">Korostuksesi näkyvät täällä.</p>
          </div>
        );
      
      default:
        return (
          <BibleReader
            book={selectedBook}
            chapter={selectedChapter}
            targetVerse={targetVerse}
            onBookSelect={onBookSelect}
            onChapterSelect={onChapterSelect}
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Fixed Header with Bible location and controls */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          {/* Bible Location and Version */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Book Selection */}
              <Select value={selectedBook} onValueChange={onBookSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Valitse kirja">
                    {selectedBook ? getFinnishBookName(selectedBook) : "Valitse kirja"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-w-[300px]">
                  {bibleBooks.map((book) => (
                    <SelectItem 
                      key={book.name} 
                      value={book.name}
                      className="pl-6 pr-2 text-left"
                    >
                      {getFinnishBookName(book.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Chapter Selection */}
              <Select value={selectedChapter.toString()} onValueChange={(value) => onChapterSelect(parseInt(value))}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters_count || 0 }, (_, i) => i + 1).map((chapter) => (
                    <SelectItem key={chapter} value={chapter.toString()}>
                      {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Version Selection */}
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Versio" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {bibleVersions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audio Controls */}
          {currentView === 'bible' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm">
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default MainContent;