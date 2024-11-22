import { Hono } from "hono";
import { cors } from "hono/cors";

type CloudflareBindings = {
  AI: Ai;
};

const app = new Hono<{
  Bindings: CloudflareBindings;
  Variables: {
    AI: Ai;
  };
}>();

app.use("*", cors());

app.get("/", (c) => {
  return c.json({ detail: "Hono API is Up!" });
});

const models: { [key: string]: BaseAiTextToImageModels } = {
  m1: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
  m2: "@cf/bytedance/stable-diffusion-xl-lightning",
  m3: "@cf/lykon/dreamshaper-8-lcm",
  m4: "@cf/black-forest-labs/flux-1-schnell"
};

app.post("/generate-image", async (c) => {
  try {
    const { prompt, modelName } = await c.req.json();

    if (!prompt) {
      return c.json({ error: "Please enter a valid prompt." }, 400);
    }

    if (!Object.keys(models).includes(modelName)) {
      return c.json(
        {
          error: "Unsupported model. Please try from the given list of models.",
        },
        400,
      );
    }

    const selectedModel: BaseAiTextToImageModels = models[modelName];
    const inputs = {
      prompt: prompt,
    };

    const response = await c.env.AI.run(selectedModel, inputs);
    if (modelName === "m4") {
      // Special handling for m4 (Flux-1-Schnell)
      const binaryString = atob(response.image);
      const imgBuffer = Uint8Array.from(binaryString, (m) => m.codePointAt(0));

      // Return binary image for m4
      return new Response(imgBuffer, {
        headers: {
          "Content-Type": "image/jpeg", // Adjust format if needed
        },
      });
    }

    if (!response) {
      throw new Error("Error getting a valid response.");
    }
    console.log(response);

    return c.newResponse(response, 200, {
      "Content-Type": "image/png",
    });
  } catch (error) {
    console.error(
      `${new Date().toISOString()} - POST /generate-image Error: `,
      error,
    );
    return c.json(
      { error: "An error occurred while generating the image." },
      500,
    );
  }
});
const summarymodels: { [key: string]: string } = {
  m1: "@cf/facebook/bart-large-cnn",
};

app.post("/generate-summary", async (c) => {
  try {
    const { prompt, modelName } = await c.req.json();

    if (!prompt) {
      return c.json({ error: "Please enter a valid prompt." }, 400);
    }

    if (!Object.keys(summarymodels).includes(modelName)) {
      return c.json(
        {
          error: "Unsupported model. Please try from the given list of models.",
        },
        400,
      );
    }

    const selectedModel = summarymodels[modelName];
    const inputs = {
      input_text: prompt,
    };

    const response = await c.env.AI.run(selectedModel, inputs);

    if (!response) {
      throw new Error("Error getting a valid response.");
    }

    return c.json({ summary: response.summary || response });
  } catch (error) {
    console.error(
      `${new Date().toISOString()} - POST /generate-summary Error: `,
      error,
    );
    return c.json(
      { error: "An error occurred while generating the summary." },
      500,
    );
  }
});
const textmodels: { [key: string]: string } = {
  m1: "@cf/meta-llama/llama-2-7b-chat-hf-lora",
  m2: "@cf/mistral/mistral-7b-instruct-v0.2-lora",
  m3: "@cf/openchat/openchat-3.5-0106",
  m4: "@hf/thebloke/neural-chat-7b-v3-1-awq",
  m5: "@cf/fblgit/una-cybertron-7b-v2-bf16",
  m6: "@cf/tinyllama/tinyllama-1.1b-chat-v1.0",
  m7: "@hf/nexusflow/starling-lm-7b-beta",
};

// In workers.ts

app.post("/generate-text", async (c) => {
  try {
    const { prompt, modelName } = await c.req.json();

    if (!prompt) {
      return c.json({ error: "Please enter a valid prompt." }, 400);
    }

    if (!Object.keys(textmodels).includes(modelName)) {
      return c.json(
        {
          error: "Unsupported model. Please try from the given list of models.",
        },
        400,
      );
    }

    const selectedModel = textmodels[modelName];
    const messages = [{ role: "user", content: prompt }];

    const stream = await c.env.AI.run(selectedModel, {
      stream: true,
      messages,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error(
      `${new Date().toISOString()} - POST /generate-text Error: `,
      error,
    );
    return c.json(
      { error: "An error occurred while generating the text." },
      500,
    );
  }
});
   


export default app;
