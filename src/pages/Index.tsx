import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import MainContent from "@/components/MainContent";

const Index = () => {
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [targetVerse, setTargetVerse] = useState<number | undefined>();
  const [currentView, setCurrentView] = useState<'bible' | 'search' | 'summaries' | 'highlights'>('bible');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerse, setSelectedVerse] = useState<{
    bookName: string;
    chapter: number;
    verse: number;
    text: string;
  } | null>(null);

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setTargetVerse(undefined);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    setTargetVerse(undefined);
  };

  const handleNavigateToSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  const handleNavigateToContinueAudio = () => {
    setCurrentView('bible');
    // TODO: Load last audio position
  };

  const handleNavigateToContinueText = () => {
    setCurrentView('bible');
    // TODO: Load last reading position
  };

  const handleNavigateToSummaries = () => {
    setCurrentView('summaries');
  };

  const handleNavigateToHighlights = () => {
    setCurrentView('highlights');
  };

  const handleNavigateToVerse = (bookName: string, chapter: number, verse?: number, text?: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(chapter);
    setTargetVerse(verse);
    setCurrentView('bible');
  };

  const handleVerseSelect = (bookName: string, chapter: number, verse: number, text: string) => {
    setSelectedVerse({ bookName, chapter, verse, text });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">

        <AppSidebar 
          onNavigateToSearch={handleNavigateToSearch}
          onNavigateToContinueAudio={handleNavigateToContinueAudio}
          onNavigateToContinueText={handleNavigateToContinueText}
          onNavigateToSummaries={handleNavigateToSummaries}
          onNavigateToHighlights={handleNavigateToHighlights}
          selectedVerse={selectedVerse}
        />

        <MainContent
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          targetVerse={targetVerse}
          onBookSelect={handleBookSelect}
          onChapterSelect={handleChapterSelect}
          onNavigateToVerse={handleNavigateToVerse}
          onVerseSelect={handleVerseSelect}
          currentView={currentView}
          searchQuery={searchQuery}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;