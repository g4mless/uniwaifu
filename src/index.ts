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

new Elysia()
  .get("/", () => ({
    status: "ok",
    message: "Unified Waifu API Proxy",
    providers: Object.keys(providers),
  }))
  .get("/get", async () => {
    const image = await fetchRandomImage();

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

    return {
      url: image.url
    };
  })
  .listen(3000, () => {
    console.log(`🦊 Elysia is running at http://localhost:3000`);
    console.log(`📡 Try: http://localhost:3000/anime`);
  });
