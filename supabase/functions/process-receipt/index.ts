import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // 🛠️ FIX 1: Gi-add ang 'x-region' ug 'x-client-info' para mosugot si CORS sa gi-pasa sa mobile app
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-region',
}

serve(async (req) => {
  // I-handle ang CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image_url } = await req.json()

    if (!image_url) {
      return new Response(JSON.stringify({ error: "Missing image_url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Pagkuha sa Gemini API Key gikan sa Env Variables
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured on the server.")
    }

    // 2. I-download ang image file isip arrayBuffer
    const imageResponse = await fetch(image_url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from storage URL: ${imageResponse.statusText}`)
    }
    const blob = await imageResponse.blob()
    const buffer = await blob.arrayBuffer()

    // 🛠️ FIX 2: Luwas nga pag-convert ngadto sa Base64 nga dili mo-overflow ang Call Stack 
    const uint8Array = new Uint8Array(buffer)
    let binaryString = ''
    const chunkSize = 0xFFFF // 65535 chunks para paspas pero dili mo-crash
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binaryString += String.fromCharCode.apply(
        null, 
        uint8Array.subarray(i, i + chunkSize) as unknown as number[]
      )
    }
    const base64Image = btoa(binaryString)

    // 3. I-call ang Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const prompt = `You are an expert receipt parser. Analyze this receipt image and extract the following data fields.
    Return ONLY a raw valid JSON object with matching key strings. Do NOT wrap the response in markdown blocks like \`\`\`json.
    
    Required JSON Structure:
    {
      "merchant": "Name of the store or merchant",
      "amount": 0.00,
      "category": "Must be EXACTLY one of these: Food & Drinks, Groceries, Transportation, Shopping, Utilities, Health, Entertainment, Miscellaneous",
      "payment_method": "Must be EXACTLY one of these: Cash, GCash, Maya, Credit Card"
    }
    
    Guidelines:
    - If a field cannot be found, use your best guess based on details or default "Miscellaneous" for category and "Cash" for payment method.
    - Convert amount to a strict floating-point number.`

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: blob.type || "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    })

    const geminiData = await response.json()
    
    // I-handle ang error handling gikan mismo sa Google API endpoint (e.g. invalid key or quota)
    if (geminiData.error) {
      throw new Error(`Gemini API Error: ${geminiData.error.message}`)
    }

    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!aiText) {
      throw new Error("Gemini failed to generate any readable text data.")
    }

    // Gi-limpyohan kon duna may nabilin nga markdown formatting ang AI
    const cleanJsonString = aiText.replace(/```json/g, "").replace(/```/g, "").trim()
    const parsedReceiptData = JSON.parse(cleanJsonString)

    return new Response(JSON.stringify(parsedReceiptData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("Edge Function Fatal Crash:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})