import { useState } from "react";
import { 
  Book, 
  Search, 
  History, 
  Play, 
  FileText, 
  BookOpen, 
  Star, 
  Highlighter,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";

interface AppSidebarProps {
  onNavigateToSearch: () => void;
  onNavigateToContinueAudio: () => void;
  onNavigateToContinueText: () => void;
  onNavigateToSummaries: () => void;
  onNavigateToHighlights: () => void;
}

export function AppSidebar({
  onNavigateToSearch,
  onNavigateToContinueAudio,
  onNavigateToContinueText,
  onNavigateToSummaries,
  onNavigateToHighlights
}: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const { toast } = useToast();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onNavigateToSearch();
      toast({
        title: "Haku käynnistetty",
        description: `Haetaan: "${searchQuery}"`,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const mockSearchHistory = [
    "Rakkaus",
    "Usko",
    "Toivo",
    "Matt 5:14",
    "Psalm 23"
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-80"} collapsible="icon">
      <SidebarHeader className="border-b border-border p-4">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-foreground">Raamattusovelus</h1>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Raamattu Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Book className="mr-2 h-4 w-4" />
            {!collapsed && "RAAMATTU"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Search */}
              <SidebarMenuItem>
                <Collapsible open={showSearchHistory} onOpenChange={setShowSearchHistory}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      {!collapsed && (
                        <div className="flex-1 flex items-center gap-1">
                          <Input
                            placeholder="Haku..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="h-8"
                          />
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {showSearchHistory ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      )}
                    </div>
                    
                    {!collapsed && (
                      <CollapsibleContent className="ml-6">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground mb-2">Hakuhistoria</div>
                          {mockSearchHistory.map((item, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start h-7 text-xs"
                              onClick={() => {
                                setSearchQuery(item);
                                handleSearch();
                              }}
                            >
                              <History className="mr-2 h-3 w-3" />
                              {item}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              </SidebarMenuItem>

              {/* Continue Audio */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToContinueAudio}>
                  <Play className="h-4 w-4" />
                  {!collapsed && <span>Jatka kuuntelua</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Continue Text */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToContinueText}>
                  <FileText className="h-4 w-4" />
                  {!collapsed && <span>Jatka lukemista</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Continue Reading Program */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  <BookOpen className="h-4 w-4" />
                  {!collapsed && <span>Lukuohjelma (tulossa)</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sisältöni Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            <Star className="mr-2 h-4 w-4" />
            {!collapsed && "SISÄLTÖNI"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* My Summaries */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToSummaries}>
                  <FileText className="h-4 w-4" />
                  {!collapsed && <span>Koosteeni</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Highlights */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onNavigateToHighlights}>
                  <Highlighter className="h-4 w-4" />
                  {!collapsed && <span>Korostukset</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}