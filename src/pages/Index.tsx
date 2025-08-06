import { useState } from "react";
import BibleReader from "@/components/BibleReader";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const [selectedBook, setSelectedBook] = useState("Matteus");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          onBookSelect={setSelectedBook}
          onChapterSelect={setSelectedChapter}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 transition-all duration-300">
          <BibleReader 
            book={selectedBook}
            chapter={selectedChapter}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
