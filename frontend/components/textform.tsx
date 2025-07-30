"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "./ui/input";

const models: { [key: string]: { name: string; type: string } } = {
  m1: { name: "@cf/meta-llama/llama-2-7b-chat-hf-lora", type: "llama" },
  m2: { name: "@cf/mistral/mistral-7b-instruct-v0.2-lora", type: "mistral" },
  m3: { name: "@cf/openchat/openchat-3.5-0106", type: "openchat" },
  m4: { name: "@hf/thebloke/neural-chat-7b-v3-1-awq", type: "neural-chat" },
  m5: { name: "@cf/fblgit/una-cybertron-7b-v2-bf16", type: "cybertron" },
  m6: { name: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0", type: "llama" },
  m7: { name: "@hf/nexusflow/starling-lm", type: "starling" },
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const formSchema = z.object({
  modelName: z.enum(["m1", "m2", "m3", "m4", "m5", "m6", "m7"]),
  message: z.string().min(1, {
    message: "Message cannot be empty.",
  }),
  systemPrompt: z.string().optional(),
});

// Helper function to format messages based on model type
const formatMessagesForModel = (messages: Message[], modelType: string, systemPrompt?: string): any => {
  const allMessages = systemPrompt 
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  switch (modelType) {
    case "llama":
      // Llama format: <s>[INST] <<SYS>>\n{system}\n<</SYS>>\n\n{user} [/INST] {assistant} </s>
      let llamaPrompt = "";
      let systemMsg = "";
      let conversationParts: string[] = [];
      
      allMessages.forEach((msg, index) => {
        if (msg.role === "system") {
          systemMsg = msg.content;
        } else if (msg.role === "user") {
          if (index === 1 && systemMsg) { // First user message with system
            conversationParts.push(`<s>[INST] <<SYS>>\n${systemMsg}\n<</SYS>>\n\n${msg.content} [/INST]`);
          } else {
            conversationParts.push(`<s>[INST] ${msg.content} [/INST]`);
          }
        } else if (msg.role === "assistant") {
          if (conversationParts.length > 0) {
            conversationParts[conversationParts.length - 1] += ` ${msg.content} </s>`;
          }
        }
      });
      
      return { prompt: conversationParts.join(" ") };

    case "mistral":
      // Mistral format: <s>[INST] {system} {user} [/INST] {assistant}</s>
      let mistralPrompt = "";
      let mistralSystem = "";
      
      allMessages.forEach((msg) => {
        if (msg.role === "system") {
          mistralSystem = msg.content;
        }
      });
      
      const userMessages = allMessages.filter(m => m.role === "user");
      const lastUserMsg = userMessages[userMessages.length - 1];
      
      if (lastUserMsg) {
        mistralPrompt = `<s>[INST] ${mistralSystem ? mistralSystem + " " : ""}${lastUserMsg.content} [/INST]`;
      }
      
      return { prompt: mistralPrompt };

    case "openchat":
      // OpenChat format: GPT4 Correct User: {system} {user}<|end_of_turn|>GPT4 Correct Assistant: {assistant}<|end_of_turn|>
      let openchatPrompt = "";
      let openchatSystem = "";
      
      allMessages.forEach((msg) => {
        if (msg.role === "system") {
          openchatSystem = msg.content;
        } else if (msg.role === "user") {
          openchatPrompt += `GPT4 Correct User: ${openchatSystem ? openchatSystem + " " : ""}${msg.content}<|end_of_turn|>`;
          openchatSystem = ""; // Only add system to first user message
        } else if (msg.role === "assistant") {
          openchatPrompt += `GPT4 Correct Assistant: ${msg.content}<|end_of_turn|>`;
        }
      });
      
      openchatPrompt += "GPT4 Correct Assistant: ";
      return { prompt: openchatPrompt };

    case "neural-chat":
      // Neural Chat format: ### System:\n{system}\n### User:\n{user}\n### Assistant:\n{assistant}
      let neuralPrompt = "";
      
      allMessages.forEach((msg) => {
        if (msg.role === "system") {
          neuralPrompt += `### System:\n${msg.content}\n`;
        } else if (msg.role === "user") {
          neuralPrompt += `### User:\n${msg.content}\n`;
        } else if (msg.role === "assistant") {
          neuralPrompt += `### Assistant:\n${msg.content}\n`;
        }
      });
      
      neuralPrompt += "### Assistant:\n";
      return { prompt: neuralPrompt };

    case "starling":
      // Starling format: GPT4 Correct User: {system} {user}<|end_of_turn|>GPT4 Correct Assistant: {assistant}<|end_of_turn|>
      let starlingPrompt = "";
      let starlingSystem = "";
      
      allMessages.forEach((msg) => {
        if (msg.role === "system") {
          starlingSystem = msg.content;
        } else if (msg.role === "user") {
          starlingPrompt += `GPT4 Correct User: ${starlingSystem ? starlingSystem + " " : ""}${msg.content}<|end_of_turn|>`;
          starlingSystem = ""; // Only add system to first user message
        } else if (msg.role === "assistant") {
          starlingPrompt += `GPT4 Correct Assistant: ${msg.content}<|end_of_turn|>`;
        }
      });
      
      starlingPrompt += "GPT4 Correct Assistant: ";
      return { prompt: starlingPrompt };

    default:
      // Fallback: try standard messages format first, then prompt format
      const standardMessages = allMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      return { 
        messages: standardMessages,
        // Fallback prompt format
        prompt: allMessages.map(msg => `${msg.role}: ${msg.content}`).join("\n") + "\nassistant: "
      };
  }
};

const ChatMessage = ({ message }: { message: Message }) => {
  if (message.role === "system") return null; // Don't display system messages
  
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
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant. Provide accurate, helpful, and concise responses.");
  const [showSettings, setShowSettings] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
      modelName: "m1",
      systemPrompt: systemPrompt,
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
      
      const selectedModel = models[values.modelName];
      const formattedRequest = formatMessagesForModel(newMessages, selectedModel.type, systemPrompt);
      
      const requestBody = {
        modelName: values.modelName,
        ...formattedRequest,
        // Include both formats for maximum compatibility
        messages: newMessages,
        systemPrompt: systemPrompt,
      };

      console.log("Request body:", requestBody); // Debug log
      
      const response = await fetch(
        `https://texttoimage.fornewsletters86.workers.dev/generate-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
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
              content: `An error occurred: ${error.message}`,
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

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse("");
  };

  return (
    <div className="w-full h-[80vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex items-center space-x-2">
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
                  {value.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={clearChat}>
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                System Prompt
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will guide the AI's behavior and responses
              </p>
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSystemPrompt("You are a helpful AI assistant. Provide accurate, helpful, and concise responses.")}
              >
                Reset to Default
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowSettings(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.filter(m => m.role !== "system").map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {currentResponse && (
          <ChatMessage message={{ role: "assistant", content: currentResponse }} />
        )}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Start a conversation</p>
              <p className="text-sm">Choose a model and type your message below</p>
            </div>
          </div>
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