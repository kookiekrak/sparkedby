import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Custom hook for form validation using React Hook Form and Zod
 * @param schema Zod schema for form validation
 * @param defaultValues Default values for the form
 * @returns Form methods and submission handler
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  defaultValues: z.infer<T> = {} as z.infer<T>
) {
  type FormValues = z.infer<T>;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const handleSubmit = async (
    onSubmit: (values: FormValues) => Promise<void> | void
  ) => {
    return form.handleSubmit(async (values) => {
      try {
        setIsSubmitting(true);
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return {
    form,
    isSubmitting,
    handleSubmit,
  };
}
