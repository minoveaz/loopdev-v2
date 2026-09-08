import { Plus, MessageSquare } from "lucide-react";
import { DataCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CRMContact } from "@/adapters/loopdev";
import { formatDate } from "@/lib/formatters";
import { Customer360Field, formatCustomerAttribute } from "./Customer360Field";

export function Customer360DetailTabs({ contact }: { contact: CRMContact }) {
  return (
    <DataCard
      className="min-w-0 lg:col-span-2 lg:h-[580px]"
      bodyClassName="flex min-h-0 flex-col overflow-hidden"
      title="CRM details"
      description="Relationship and assignment context"
    >
      <Tabs defaultValue="contact" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mb-5 flex w-full shrink-0 flex-wrap justify-start gap-1 bg-card-muted p-1">
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>
        <TabsContent value="contact" className="min-h-0 flex-1 overflow-y-auto pr-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Customer360Field label="Full name" value={[contact.firstName, contact.lastName, contact.secondLastName].filter(Boolean).join(" ")} />
            <Customer360Field label="Email" value={contact.email} />
            <Customer360Field label="Secondary email" value={contact.secondaryEmail} />
            <Customer360Field label="Phone" value={contact.phone} />
            <Customer360Field label="Secondary phone" value={contact.secondaryPhone} />
            <Customer360Field label="Preferred channel" value={contact.preferredChannel} />
            <Customer360Field label="Preferred language" value={contact.preferredLanguage} />
            <Customer360Field label="Address line 1" value={contact.addressLine1} />
            <Customer360Field label="Address line 2" value={contact.addressLine2} />
            <Customer360Field label="City" value={contact.city} />
            <Customer360Field label="State / province" value={contact.stateProvince} />
            <Customer360Field label="Postal code" value={contact.postalCode} />
            <Customer360Field label="Country" value={contact.country} />
          </dl>
        </TabsContent>
        <TabsContent value="personal" className="min-h-0 flex-1 overflow-y-auto pr-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Customer360Field label="First name" value={contact.firstName} />
            <Customer360Field label="Last name" value={contact.lastName} />
            <Customer360Field label="Second last name" value={contact.secondLastName} />
            <Customer360Field label="Preferred name" value={contact.preferredName} />
            <Customer360Field label="Document type" value={contact.documentType} />
            <Customer360Field label="Document number" value={contact.documentNumber} mono />
            <Customer360Field label="Birth date" value={contact.birthDate ? formatDate(contact.birthDate) : null} />
            <Customer360Field label="Gender" value={contact.gender} />
          </dl>
        </TabsContent>
        <TabsContent value="company" className="min-h-0 flex-1 overflow-y-auto pr-2">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Customer360Field label="Company" value={contact.companyName} />
            <Customer360Field label="Job title" value={contact.jobTitle} />
            <Customer360Field label="Department" value={contact.department} />
            <Customer360Field label="Identity status" value={contact.identityStatus.replace("_", " ")} />
            <Customer360Field label="Contact ID" value={contact.id} mono />
            <Customer360Field label="Created" value={formatDate(contact.createdAt)} />
            <Customer360Field label="Updated" value={formatDate(contact.updatedAt)} />
          </dl>
        </TabsContent>
        <TabsContent value="attributes" className="min-h-0 flex-1 overflow-y-auto pr-2">
          {Object.entries(contact.attributes).length ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.entries(contact.attributes).map(([key, value]) => <Customer360Field key={key} label={key} value={formatCustomerAttribute(value)} />)}
            </dl>
          ) : <p className="py-8 text-center text-sm text-muted-foreground">No additional attributes.</p>}
        </TabsContent>
      </Tabs>
      <div className="mt-5 flex shrink-0 gap-2 border-t border-border pt-4">
        <Button><Plus className="mr-1.5 h-3.5 w-3.5" />New task</Button>
        <Button variant="outline"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Add note</Button>
        <Button variant="outline">Edit contact</Button>
      </div>
    </DataCard>
  );
}
