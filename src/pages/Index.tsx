import { useState } from "react";
import BibleReader from "@/components/BibleReader";
import Header from "@/components/Header";

const Index = () => {
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [targetVerse, setTargetVerse] = useState<number | undefined>();

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setTargetVerse(undefined); // Clear target verse when book changes
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setTargetVerse(undefined); // Clear target verse when chapter changes
  };

  const handleVerseNavigation = (book: string, chapter: number, verse?: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setTargetVerse(verse);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookSelect={handleBookSelect}
        onChapterSelect={handleChapterSelect}
        onVerseNavigation={handleVerseNavigation}
      />
      
      <main className="w-full">
        <BibleReader 
          book={selectedBook}
          chapter={selectedChapter}
          targetVerse={targetVerse}
          onBookSelect={handleBookSelect}
          onChapterSelect={handleChapterSelect}
        />
      </main>
    </div>
  );
};

export default Index;