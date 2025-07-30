"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";

const models: { [key: string]: string } = {
  m1: "@cf/meta-llama/llama-2-7b-chat-hf-lora",
  m2: "@cf/mistral/mistral-7b-instruct-v0.2-lora",
  m3: "@cf/openchat/openchat-3.5-0106",
  m4: "@hf/thebloke/neural-chat-7b-v3-1-awq",
  m5: "@cf/fblgit/una-cybertron-7b-v2-bf16",
  m6: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
  m7: "@hf/nexusflow/starling-lm",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

const formSchema = z.object({
  modelName: z.enum(["m1", "m2", "m3", "m4", "m5", "m6", "m7"]),
  message: z.string().min(1, {
    message: "Message cannot be empty.",
  }),
});

const ChatMessage = ({ message }: { message: Message }) => {
  return (
    <div
      className={`flex w-full ${
        message.role === "user" ? "justify-end" : "justify-start"
      } mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

const ChatForm = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const userMessage = values.message;
    form.reset({ message: "", modelName: values.modelName });

    // Add user message immediately
    const newMessages: Message[] = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    
    setIsGenerating(true);
    setCurrentResponse("");

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
            prompt: userMessage,
            messages: newMessages,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get a response from server, please try again.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response stream");
      }

      let accumulatedResponse = "";
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Only add the message if it hasn't been added by [DONE] event
          if (isGenerating) {
            setMessages(prev => [...prev, { role: "assistant" as const, content: accumulatedResponse }]);
            setCurrentResponse("");
            setIsGenerating(false);
          }
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setMessages(prev => [...prev, { role: "assistant" as const, content: accumulatedResponse }]);
              setCurrentResponse("");
              setIsGenerating(false);
              break;
            }
            try {
              const parsed = JSON.parse(data);
              const newText = parsed.response || "";
              accumulatedResponse += newText;
              setCurrentResponse(accumulatedResponse);
            } catch (e) {
              console.error("Error parsing JSON:", e);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name !== "AbortError") {
          console.error(
            `${new Date().toISOString()} - POST generate-text Error:`,
            error
          );
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "An error occurred while generating the response.",
            },
          ]);
        }
      } else {
        console.error(
          `${new Date().toISOString()} - POST generate-text Unknown Error:`,
          error
        );
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "An unknown error occurred." },
        ]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      if (currentResponse) {
        setMessages(prev => [...prev, { role: "assistant" as const, content: currentResponse }]);
        setCurrentResponse("");
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <Select
          value={form.watch("modelName")}
          onValueChange={(value) => form.setValue("modelName", value as any)}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose a model" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(models).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {currentResponse && (
          <ChatMessage message={{ role: "assistant", content: currentResponse }} />
        )}
      </div>

      <div className="p-4 border-t">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center space-x-2"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="Type your message..."
                      {...field}
                      disabled={isGenerating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Send size={16} />
              )}
            </Button>
            {isGenerating && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStopGeneration}
              >
                Stop
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ChatForm;
