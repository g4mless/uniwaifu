import { Elysia } from "elysia"
import { providers, fetchRandomImage } from "./providers"
import { cors } from '@elysiajs/cors'

new Elysia().use(cors())
  .get("/", () => ({
    status: "ok",
    message: "Unified Waifu API Proxy",
    providers: Object.keys(providers),
  }))
  .get("/get", async ({ query, request }) => {
    const image = await fetchRandomImage()
    const { proxied } = query

    if (!image) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch image from all providers",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    let imageUrl = image.url
    if (proxied === "true") {
      const origin = new URL(request.url).origin
      imageUrl = `${origin}/image?src=${encodeURIComponent(image.url)}`
    }
    return {
      url: imageUrl
    }
  })

  .get("/image", async ({ query }) => {
    const { src } = query as { src: string }
    
    if (!src) {
      return new Response("Missing src parameter", { status: 400 })
    }

    try {
      const response = await fetch(decodeURIComponent(src))
      return new Response(response.body, {
        headers: { "Content-Type": response.headers.get("content-type") || "image/jpeg" || "image/png" }
      })
    } catch (error) {
      console.error("Proxy error:", error)
      return new Response("Failed to fetch image", { status: 500 })
    }
  })
  .listen(3000, () => {
    console.log(`🦊 Elysia is running at http://localhost:3000`)
    console.log(`Try: http://localhost:3000/get`)
  })
