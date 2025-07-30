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
        `https://texttoimage.fornewsletters86.workers.dev/generate-image`,
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
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Form Section - Fixed width and position */}
      <div className="w-full">
        <div className="border rounded-lg p-6 sticky top-20">
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

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? (
                  <Loader className="animate-spin mr-2" size={16} />
                ) : null}
                Generate Image
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Image Display Section - Consistent height */}
      <div className="w-full">
        <div className="min-h-[600px] flex items-center justify-center border rounded-lg p-6">
          {form.formState.isSubmitting && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Generating image, please wait...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments 🎨</p>
            </div>
          )}
          
          {!form.formState.isSubmitting && !imageResponse && (
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-medium">Your generated image will appear here</p>
              <p className="text-sm mt-2">Fill out the form and click "Generate Image" to get started</p>
            </div>
          )}

          {imageResponse && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Image
                  src={imageResponse}
                  alt="Generated image"
                  width={512}
                  height={512}
                  className="rounded-lg shadow-lg max-w-full h-auto"
                />
              </div>
              {isImageGenerated && (
                <Button onClick={handleDownload} size="lg" className="mt-4">
                  <Download className="mr-2 h-4 w-4" /> Download Image
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageForm;
