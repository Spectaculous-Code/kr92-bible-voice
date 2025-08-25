import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, FileText, Highlighter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import UserSummaries from '@/components/UserSummaries';
import UserHighlights from '@/components/UserHighlights';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
        });

      if (error) {
        toast({
          title: "Virhe",
          description: "Profiilin tallentaminen epäonnistui",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profiili tallennettu",
          description: "Profiilisi on päivitetty onnistuneesti",
        });
      }
    } catch (error) {
      toast({
        title: "Virhe",
        description: "Profiilin tallentaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Kirjaudu sisään</CardTitle>
            <CardDescription>
              Kirjaudu sisään nähdäksesi profiilisi
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Profiili</h1>
        <p className="text-muted-foreground">Hallitse profiiliasi ja näe aktiviteettisi</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Asetukset
          </TabsTrigger>
          <TabsTrigger value="summaries" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Koosteeni
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex items-center gap-2">
            <Highlighter className="h-4 w-4" />
            Korostukseni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profiilin tiedot</CardTitle>
              <CardDescription>
                Muokkaa henkilökohtaisia tietojasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Sähköposti</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Näyttönimi</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Anna näyttönimesi"
                />
              </div>
              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Tallennetaan..." : "Tallenna muutokset"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summaries">
          <UserSummaries />
        </TabsContent>

        <TabsContent value="highlights">
          <UserHighlights />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;