import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getMockChapter } from "@/data/mockBibleData";
import VerseHighlighter from "./VerseHighlighter";

interface BibleReaderProps {
  book: string;
  chapter: number;
}

const BibleReader = ({ book, chapter }: BibleReaderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [highlights, setHighlights] = useState<Set<number>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const chapterData = getMockChapter(book, chapter);

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // In real app, pause audio
      toast({
        title: "Toisto pysäytetty",
        description: `${book} ${chapter}`,
      });
    } else {
      setIsPlaying(true);
      // In real app, start audio
      toast({
        title: "Toisto aloitettu",
        description: `${book} ${chapter}`,
      });
      
      // Simulate verse progression
      setTimeout(() => setIsPlaying(false), 5000);
    }
  };

  const toggleHighlight = (verseNumber: number) => {
    const newHighlights = new Set(highlights);
    if (newHighlights.has(verseNumber)) {
      newHighlights.delete(verseNumber);
      toast({
        title: "Korostus poistettu",
        description: `${book} ${chapter}:${verseNumber}`,
      });
    } else {
      newHighlights.add(verseNumber);
      toast({
        title: "Jae korostettu",
        description: `${book} ${chapter}:${verseNumber}`,
      });
    }
    setHighlights(newHighlights);
  };

  const toggleBookmark = () => {
    const bookmarkKey = `${book}_${chapter}`;
    const newBookmarks = new Set(bookmarks);
    
    if (newBookmarks.has(bookmarkKey)) {
      newBookmarks.delete(bookmarkKey);
      toast({
        title: "Kirjanmerkki poistettu",
        description: `${book} ${chapter}`,
      });
    } else {
      newBookmarks.add(bookmarkKey);
      toast({
        title: "Kirjanmerkki lisätty",
        description: `${book} ${chapter}`,
      });
    }
    setBookmarks(newBookmarks);
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    toast({
      title: direction === 'prev' ? "Edellinen luku" : "Seuraava luku",
      description: "Navigointi tulossa pian...",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Chapter Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{book}</h1>
        <h2 className="text-xl text-muted-foreground">Luku {chapter}</h2>
      </div>

      {/* Audio Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateChapter('prev')}>
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              size="icon" 
              onClick={togglePlayback}
              className="bg-primary hover:bg-primary/90"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => navigateChapter('next')}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Jae {currentVerse}/{chapterData.verses.length}
            </span>
            <Button variant="ghost" size="icon">
              <Volume2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleBookmark}
              className={bookmarks.has(`${book}_${chapter}`) ? "text-primary" : ""}
            >
              <Heart className={bookmarks.has(`${book}_${chapter}`) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Bible Text */}
      <Card className="p-6">
        <div className="space-y-4 leading-relaxed text-lg">
          {chapterData.verses.map((verse) => (
            <VerseHighlighter
              key={verse.number}
              verse={verse}
              isHighlighted={highlights.has(verse.number)}
              isCurrentVerse={currentVerse === verse.number}
              onHighlight={() => toggleHighlight(verse.number)}
              onVerseClick={() => setCurrentVerse(verse.number)}
            />
          ))}
        </div>
      </Card>

      {/* Chapter Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('prev')}
          className="flex items-center gap-2"
        >
          <SkipBack className="h-4 w-4" />
          Edellinen luku
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => navigateChapter('next')}
          className="flex items-center gap-2"
        >
          Seuraava luku
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden audio element for future implementation */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default BibleReader;