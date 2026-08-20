import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { clawKey, version, systemPrompt, rulesConfig, payload } = await req.json();

    if (!clawKey || !systemPrompt) {
      return new Response(
        JSON.stringify({ error: "Missing required payload attributes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      throw new Error("Server misconfiguration: GROQ_API_KEY is missing.");
    }

    // Query active text/chat models, explicitly excluding audio models like whisper
    let activeModel = "llama-3.3-70b-versatile";
    try {
      const modelsRes = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const chatModels = (modelsData.data || [])
          .map((m: any) => m.id)
          .filter((id: string) => !id.includes("whisper") && !id.includes("guard") && !id.includes("vision"));

        const preferred = chatModels.find((id: string) => 
          id.includes("llama-3.3") || id.includes("llama-3.1") || id.includes("mixtral") || id.includes("gemma")
        );

        if (preferred) {
          activeModel = preferred;
        } else if (chatModels.length > 0) {
          activeModel = chatModels[0];
        }
      }
    } catch (e) {
      console.warn("Model list fetch failed, falling back to default:", e);
    }

    const safeSystemPrompt = systemPrompt.toLowerCase().includes("json")
      ? systemPrompt
      : `${systemPrompt}\n\nRespond strictly in valid JSON format.`;

    // Call Groq Chat Completions API
    const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: "system", content: safeSystemPrompt },
          { role: "user", content: `Execute task for ${clawKey}. Input payload: ${JSON.stringify(payload || {})}` },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    const llmData = await llmResponse.json();
    const executionTimeMs = Date.now() - startTime;
    const isSuccess = llmResponse.ok && !llmData.error;

    if (!isSuccess) {
      console.error("[Groq API Error Details]:", JSON.stringify(llmData));
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Record execution log in database
    const { error: dbError } = await supabaseAdmin.from("claw_execution_logs").insert({
      claw_id: clawKey,
      task_name: payload?.triggerSource || "Manual Dashboard Override",
      status: isSuccess ? "Success" : "Failed",
      accuracy_score: isSuccess ? 100.0 : 0.0,
      execution_time_ms: executionTimeMs
    });

    if (dbError) {
      console.error("[Database Insert Error]:", dbError.message);
    }

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ success: false, error: llmData.error?.message || "LLM Execution Failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        clawKey,
        activeModelUsed: activeModel,
        executionTimeMs,
        result: llmData.choices?.[0]?.message?.content ? JSON.parse(llmData.choices[0].message.content) : llmData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[Edge Function Exception]:", err.message);

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
