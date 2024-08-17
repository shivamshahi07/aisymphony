"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./ui/textarea";

const models: { [key: string]: string } = {
  m1: "@cf/meta-llama/llama-2-7b-chat-hf-lora",
  m2: "@cf/mistral/mistral-7b-instruct-v0.2-lora",
  m3: "@cf/openchat/openchat-3.5-0106",
  m4: "@hf/thebloke/neural-chat-7b-v3-1-awq",
  m5: "@cf/fblgit/una-cybertron-7b-v2-bf16",
  m6: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
  m7: "@hf/nexusflow/starling-lm",
};

const formSchema = z.object({
  modelName: z.enum(["m1", "m2", "m3", "m4", "m5", "m6", "m7"]),
  prompt: z.string().min(5, {
    message: "Prompt must be at least 5 characters.",
  }),
});

const Textform = () => {
  const [textresponse, settextresponse] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      modelName: "m1",
    },
  });

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    settextresponse("");
    setIsGenerating(true);
    setIsWaiting(true);

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_URL}/generate-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modelName: values.modelName,
            prompt: values.prompt,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to get a response from server, please try again."
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsGenerating(false);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              settextresponse((prev) => prev + (parsed.response || ""));
              setIsWaiting(false);
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(
          `${new Date().toISOString()} - POST generate-text Error:`,
          error
        );
        settextresponse("An error occurred while generating the text.");
      }
    } finally {
      setIsGenerating(false);
      setIsWaiting(false);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setIsWaiting(false);
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
                    Choose a model to generate your text
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
                      placeholder="Write a story about a mustang on a highway that ..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a prompt to generate text
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className=" flex gap-x-4 ">
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader className="animate-spin mr-2" size={16} />
                ) : null}
                Generate Text
              </Button>

              {isGenerating && (
                <Button
                  type="button"
                  className="mb-1 mr-2 "
                  onClick={handleStopGeneration}
                >
                  Stop Generation
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="w-full flex flex-col items-center justify-center">
        {isWaiting && (
          <p className="animate-pulse">Generating text, please wait...🤔</p>
        )}
        {textresponse && (
          <div className="flex flex-col items-center">
            <p className="rounded-md shadow-sm p-4 bg-gray-100">
              {textresponse}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Textform;
