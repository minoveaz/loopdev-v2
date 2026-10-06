import { useMemo, useState } from "react";
import type { ContactFormErrors, ContactFormValues } from "../../../../packages/contracts/src/contact-form";
import { emptyContactFormValues, validateContactForm } from "../../../../packages/contracts/src/contact-form";

export function useMobileForm(initialValues: Partial<ContactFormValues> = {}) {
  const [values, setValues] = useState<ContactFormValues>({ ...emptyContactFormValues, ...initialValues });
  const [submitted, setSubmitted] = useState(false);
  const errors = useMemo<ContactFormErrors>(() => submitted ? validateContactForm(values) : {}, [submitted, values]);
  function setValue(name: keyof ContactFormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }
  return { values, errors, submitted, setValue, submit: () => { setSubmitted(true); return validateContactForm(values); } };
}
