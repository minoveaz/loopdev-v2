import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NavTabsPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="NavTabs" description="Section navigation with tabbed content." />
      <Showcase title="Tabs" hint="tabs">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-muted-foreground">Overview content.</TabsContent>
          <TabsContent value="activity" className="text-sm text-muted-foreground">Activity content.</TabsContent>
          <TabsContent value="settings" className="text-sm text-muted-foreground">Settings content.</TabsContent>
        </Tabs>
      </Showcase>
    </PageContainer>
  );
}