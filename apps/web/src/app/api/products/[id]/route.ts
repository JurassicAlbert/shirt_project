import { apiError, apiOk } from "@/lib/api-response";
import { productRepository } from "@/lib/repositories";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await productRepository.getById(id);
  if (!product) {
    return apiError("NOT_FOUND", "Product not found", 404);
  }
  return apiOk(product);
}
