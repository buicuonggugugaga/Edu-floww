import OpenAI from "openai";

// Singleton — chỉ tạo 1 lần, tái sử dụng mọi nơi
// File này chỉ được import ở server (API routes), KHÔNG import ở client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
