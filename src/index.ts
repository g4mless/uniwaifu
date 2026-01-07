import { Elysia } from "elysia";

// Type definitions
interface AnimeImage {
  url: string;
}

interface SafebooruResponse {
  file_url: string;
  [key: string]: any;
}

interface WaifuImResponse {
  images: Array<{
    url: string;
    [key: string]: any;
  }>;
}

interface WaifuPicsResponse {
  url: string;
  [key: string]: any;
}

// Provider functions
const providers = {
  safebooru: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch(
        "https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=1girl%20sort:random"
      );
      const data = (await response.json()) as SafebooruResponse[];

      if (data.length > 0 && data[0].file_url) {
        return {
          url: data[0].file_url,
        };
      }
      return null;
    } catch (error) {
      console.error("Safebooru error:", error);
      return null;
    }
  },

  waifuim: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch("https://api.waifu.im/search?included_tags=waifu");
      const data = (await response.json()) as WaifuImResponse;

      if (data.images && data.images.length > 0 && data.images[0].url) {
        return {
          url: data.images[0].url
        };
      }
      return null;
    } catch (error) {
      console.error("Waifu.im error:", error);
      return null;
    }
  },
  waifupics: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch("https://api.waifu.pics/sfw/waifu")
      const data = (await response.json()) as WaifuPicsResponse

      if (data.url) {
        return {
          url: data.url
        }
      }
      return null
    } catch (error) {
      console.error("Waifu.pics error:", error)
      return null
    }
  }
};

const getRandomProvider = (): string => {
  const providerList = Object.keys(providers) as (keyof typeof providers)[];
  return providerList[Math.floor(Math.random() * providerList.length)];
};

const fetchRandomImage = async (): Promise<AnimeImage | null> => {
  const providerName = getRandomProvider();
  const provider = providers[providerName as keyof typeof providers];
  const result = await provider();

  if (!result) {
    for (const [name, func] of Object.entries(providers)) {
      if (name !== providerName) {
        const fallback = await func();
        if (fallback) return fallback;
      }
    }
  }

  return result;
};

// endpoint
new Elysia()
  .get("/", () => ({
    status: "ok",
    message: "Unified Waifu API Proxy",
    providers: Object.keys(providers),
  }))
  .get("/get", async ({ query, request }) => {
    const image = await fetchRandomImage();
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
      );
    }

    let imageUrl = image.url;
    if (proxied === "true") {
      const origin = new URL(request.url).origin;
      imageUrl = `${origin}/image?src=${encodeURIComponent(image.url)}`;
    }
    return {
      url: imageUrl
    };
  })

  .get("/image", async ({ query }) => {
    const { src } = query as { src: string };
    
    if (!src) {
      return new Response("Missing src parameter", { status: 400 });
    }

    try {
      const response = await fetch(decodeURIComponent(src));
      return new Response(response.body, {
        headers: { "Content-Type": response.headers.get("content-type") || "image/jpeg" || "image/png" }
      });
    } catch (error) {
      console.error("Proxy error:", error);
      return new Response("Failed to fetch image", { status: 500 });
    }
  })
  .listen(3000, () => {
    console.log(`🦊 Elysia is running at http://localhost:3000`);
    console.log(`Try: http://localhost:3000/get`);
  });
