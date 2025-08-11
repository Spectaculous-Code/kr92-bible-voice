import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, ChevronDown, Menu as MenuIcon } from "lucide-react";
import { getBibleBooks, getBookChapters, BibleBook } from "@/lib/bibleService";
import { performSearch, SearchResult } from "@/lib/searchService";
import SearchResults from "./SearchResults";
import { useToast } from "@/components/ui/use-toast";

interface HeaderProps {
  selectedBook: string;
  selectedChapter: number;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: number) => void;
}

const Header = ({ selectedBook, selectedChapter, onBookSelect, onChapterSelect }: HeaderProps) => {
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [chaptersCount, setChaptersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBooks = async () => {
      const books = await getBibleBooks();
      setBibleBooks(books);
      setLoading(false);
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    const fetchChapters = async () => {
      if (selectedBook) {
        const count = await getBookChapters(selectedBook);
        setChaptersCount(count);
      }
    };
    fetchChapters();
  }, [selectedBook]);

  const chapters = Array.from({ length: chaptersCount }, (_, i) => i + 1);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await performSearch(query);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleNavigateToVerse = (bookName: string, chapter: number, verse?: number) => {
    onBookSelect(bookName);
    onChapterSelect(chapter);
    setSearchResults(null);
    setSearchQuery("");
    toast({
      title: "Siirretty",
      description: `${bookName} ${chapter}${verse ? `:${verse}` : ''}`,
    });
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left side - Book/Chapter selection and Version */}
        <div className="flex items-center gap-3">
          <Select value={selectedBook} onValueChange={onBookSelect}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Valitse kirja" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <div className="px-2 py-1 text-sm text-muted-foreground">Ladataan...</div>
              ) : (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">UUSI TESTAMENTTI</div>
                  {bibleBooks
                    .filter(book => book.testament === "new")
                    .map((book) => (
                      <SelectItem key={book.id} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground mt-2">VANHA TESTAMENTTI</div>
                  {bibleBooks
                    .filter(book => book.testament === "old")
                    .map((book) => (
                      <SelectItem key={book.id} value={book.name}>
                        {book.name}
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>

          <Select value={selectedChapter.toString()} onValueChange={(value) => onChapterSelect(parseInt(value))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((chapter) => (
                <SelectItem key={chapter} value={chapter.toString()}>
                  {chapter}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">KR92</span>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Etsi jakeita tai viittauksia (esim. parannus, 1.Joh.1:2-5)..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleSearch(searchQuery)}
                disabled={isSearching}
              >
                <Search className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right side - Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1">
              <MenuIcon className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>JATKA</DropdownMenuItem>
            <DropdownMenuItem>MERKINNÄT</DropdownMenuItem>
            <DropdownMenuItem>HISTORIA</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Search Results */}
      <SearchResults
        results={searchResults}
        onClose={() => {
          setSearchResults(null);
          setSearchQuery("");
        }}
        onNavigateToVerse={handleNavigateToVerse}
        isLoading={isSearching}
      />
    </header>
  );
};

export default Header;