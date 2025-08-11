import { useState } from "react";
import BibleReader from "@/components/BibleReader";
import Header from "@/components/Header";

const Index = () => {
  const [selectedBook, setSelectedBook] = useState("Genesis");
  const [selectedChapter, setSelectedChapter] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookSelect={setSelectedBook}
        onChapterSelect={setSelectedChapter}
      />
      
      <main className="w-full">
        <BibleReader 
          book={selectedBook}
          chapter={selectedChapter}
          onBookSelect={setSelectedBook}
          onChapterSelect={setSelectedChapter}
        />
      </main>
    </div>
  );
};

export default Index;
