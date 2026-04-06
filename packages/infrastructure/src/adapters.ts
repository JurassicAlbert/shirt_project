export type AiImageProvider = {
  generate(prompt: string): Promise<{ imageUrl: string; cached: boolean }>;
};

export type PaymentProvider = {
  initializePayment(input: { orderId: string; amount: number }): Promise<{ paymentRef: string; redirectUrl: string }>;
};

export const createAiImageProvider = (): AiImageProvider => ({
  async generate(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("openai_api_key_missing");
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`openai_image_failed:${response.status}:${details}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const first = payload.data?.[0];
    if (first?.url) return { imageUrl: first.url, cached: false };
    if (first?.b64_json) return { imageUrl: `data:image/png;base64,${first.b64_json}`, cached: false };
    throw new Error("openai_image_empty");
  },
});

export const createPaymentProvider = (): PaymentProvider => ({
  async initializePayment(input) {
    return {
      paymentRef: `p24-${input.orderId}`,
      redirectUrl: `https://payments.przelewy24.local/pay/${input.orderId}`,
    };
  },
});
