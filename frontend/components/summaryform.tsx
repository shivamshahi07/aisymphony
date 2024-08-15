"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Download, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";

const models: { [key: string]: string } = {
  m1: "@cf/facebook/bart-large-cnn",
};

const formSchema = z.object({
  modelName: z.enum(["m1"]),
  prompt: z.string().min(50, {
    message: "Prompt must be at least 50 characters.",
  }),
});

const Summaryform = () => {
  const [summaryResponse, setsummaryResponse] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      modelName: "m1",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setsummaryResponse(null);

    try {
      console.log("prompt: ", values.prompt);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_URL}/generate-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modelName: values.modelName,
            prompt: values.prompt,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to get a response from server, please try again."
        );
      }

      const data = await response.json();
      setsummaryResponse(data.summary);
    } catch (error) {
      console.error(
        `${new Date().toISOString()} - POST generate-image Error:`,
        error
      );
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-start gap-6 -mt-10">
      <div className="w-full border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(models).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a model to generate your summary
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A mustang on the highway went ..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a prompt to generate a summary
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader className="animate-spin mr-2" size={16} />
              ) : null}
              Generate summary
            </Button>
          </form>
        </Form>
      </div>

      <div className="w-full flex flex-col items-center justify-center">
        {form.formState.isSubmitting && (
          <p className="animate-pulse">Generating summary, please wait...🤔</p>
        )}
        {summaryResponse && (
          <div className="flex flex-col items-center">
            <p className="rounded-md shadow-sm p-4 bg-gray-100">
            {typeof summaryResponse === 'string' 
                ? summaryResponse 
                : JSON.stringify(summaryResponse, null, 2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summaryform;
