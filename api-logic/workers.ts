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
        400
      );
    }

    const selectedModel: BaseAiTextToImageModels = models[modelName];
    const inputs = {
      prompt: prompt,
    };

    const response = await c.env.AI.run(selectedModel, inputs);

    if (!response) {
      throw new Error("Error getting a valid response.");
    }

    return c.newResponse(response, 200, {
      "Content-Type": "image/png",
    });
  } catch (error) {
    console.error(
      `${new Date().toISOString()} - POST /generate-image Error: `,
      error
    );
    return c.json(
      { error: "An error occurred while generating the image." },
      500
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
        400
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
      error
    );
    return c.json(
      { error: "An error occurred while generating the summary." },
      500
    );
  }
});

export default app;
