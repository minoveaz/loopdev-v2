import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

export default function ValidationPage() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Validation" description="React Hook Form + Zod with shadcn Form primitives." />
      <Showcase title="Sign up" hint="zod">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => toast.success(`Welcome, ${v.name}`))} className="space-y-4">
            {(["name", "email", "password"] as const).map((n) => (
              <FormField key={n} control={form.control} name={n} render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{n}</FormLabel>
                  <FormControl><Input type={n === "password" ? "password" : "text"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            ))}
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </Showcase>
    </PageContainer>
  );
}