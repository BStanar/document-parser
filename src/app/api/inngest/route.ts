import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processDocument } from "./functions/process-document";
import { revalidateDocument } from "./functions/revalidate-document";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processDocument, revalidateDocument],
});