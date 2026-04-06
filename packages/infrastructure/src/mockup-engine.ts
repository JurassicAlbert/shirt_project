import sharp from "sharp";

const svgBase = (label: string) => `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f2f4f7" />
  <rect x="192" y="120" width="640" height="760" rx="40" fill="#ffffff" stroke="#d0d5dd" stroke-width="6" />
  <text x="512" y="950" text-anchor="middle" fill="#344054" font-family="Arial" font-size="34">${label}</text>
</svg>`;

const downloadBuffer = async (url: string) => {
  if (url.startsWith("data:image/")) {
    const base64 = url.split(",")[1] ?? "";
    return Buffer.from(base64, "base64");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("mockup_design_fetch_failed");
  }
  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes);
};

export const generateMockupPngBuffer = async (input: {
  designImageUrl: string;
  label: string;
  textOverlay?: string;
}) => {
  const base = Buffer.from(svgBase(input.label));
  const design = await downloadBuffer(input.designImageUrl);
  const resizedDesign = await sharp(design)
    .resize(560, 560, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [{ input: resizedDesign, top: 220, left: 232 }];
  if (input.textOverlay) {
    const text = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <text x="512" y="830" text-anchor="middle" fill="#101828" font-family="Arial" font-size="38">${input.textOverlay}</text>
      </svg>`;
    composites.push({ input: Buffer.from(text), top: 0, left: 0 });
  }

  return sharp(base).composite(composites).png().toBuffer();
};

export const generateMockupDataUrl = async (input: {
  designImageUrl: string;
  label: string;
  textOverlay?: string;
}) => {
  const output = await generateMockupPngBuffer(input);
  return `data:image/png;base64,${output.toString("base64")}`;
};
