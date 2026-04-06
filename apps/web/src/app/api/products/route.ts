import { apiOk } from "@/lib/api-response";
import { productRepository } from "@/lib/repositories";

export async function GET() {
  const items = await productRepository.list();
  return apiOk({ items });
}
