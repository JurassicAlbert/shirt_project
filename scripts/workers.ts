import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runAllWorkers } from "@shirt/jobs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", ".env") });

await runAllWorkers();
