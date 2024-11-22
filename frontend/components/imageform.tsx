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

const models: { [key: string]: string } = {
  m1: "stable-diffusion-xl-base-1.0",
  m2: "stable-diffusion-xl-lightning",
  m3: "dreamshaper-8-lcm",
  m4: "flux-1-schnell"
};

const formSchema = z.object({
  modelName: z.enum(["m1", "m2", "m3","m4"]),
  prompt: z.string().min(10, {
    message: "Prompt must be at least 10 characters.",
  }),
});

const ImageForm = () => {
  const [imageResponse, setImageResponse] = useState<string | null>(null);
  const [isImageGenerated, setIsImageGenerated] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      modelName: "m1",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setImageResponse(null);
    setIsImageGenerated(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HONO_URL}/generate-image`,
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

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setImageResponse(imageUrl);
      setIsImageGenerated(true);
    } catch (error) {
      console.error(
        `${new Date().toISOString()} - POST generate-image Error:`,
        error
      );
      // You might want to set an error state here and display it to the user
    }
  };
  const handleDownload = () => {
    if (imageResponse) {
      const link = document.createElement("a");
      link.href = imageResponse;
      link.download = "generated-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row items-start gap-6">
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
                    Choose a model to generate your image
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
                    <Input placeholder="A mustang on the highway" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a prompt to generate an image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader className="animate-spin mr-2" size={16} />
              ) : null}
              Generate Image
            </Button>
          </form>
        </Form>
      </div>

      <div className="w-full flex items-center justify-center">
        {form.formState.isSubmitting && (
          <p className="animate-pulse">Generating image, please wait... 🤔</p>
        )}
        {imageResponse && (
          <div className="flex flex-col items-center">
            <Image
              src={imageResponse}
              alt="Generated image"
              width={512}
              height={512}
              className="rounded-md shadow-sm"
            />
            {isImageGenerated && (
              <Button onClick={handleDownload} className="mt-6">
                <Download className="mr-2 h-4 w-4" /> Download Image
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageForm;
