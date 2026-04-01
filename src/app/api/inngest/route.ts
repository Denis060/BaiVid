import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { facelessVideoFunction } from "@/inngest/faceless-video";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [facelessVideoFunction],
});
