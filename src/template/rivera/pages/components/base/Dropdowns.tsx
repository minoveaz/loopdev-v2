import { PageContainer, PageHeader } from "@/components/common";
import { Showcase, ShowcaseRow } from "@/template/rivera/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function DropdownsPage() {
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Dropdowns" description="Menus triggered by buttons or icons." />
      <Showcase title="Menu" hint="dropdown-menu">
        <ShowcaseRow>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions <ChevronDown className="ml-1 h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ShowcaseRow>
      </Showcase>
    </PageContainer>
  );
}