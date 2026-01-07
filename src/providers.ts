// Type definitions
export interface AnimeImage {
  url: string
}

interface SafebooruResponse {
  file_url: string
  [key: string]: any
}

interface WaifuImResponse {
  images: Array<{
    url: string
    [key: string]: any
  }>
}

interface WaifuPicsResponse {
  url: string
  [key: string]: any
}

interface NekosBestResponse {
  results: Array<{
    url: string
    [key: string]: any
  }>
}

// Provider functions
export const providers = {
  safebooru: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch(
        "https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=1&tags=1girl%20sort:random"
      )
      const data = (await response.json()) as SafebooruResponse[]

      if (data.length > 0 && data[0].file_url) {
        return {
          url: data[0].file_url,
        }
      }
      return null
    } catch (error) {
      console.error("Safebooru error:", error)
      return null
    }
  },

  waifuim: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch("https://api.waifu.im/search?included_tags=waifu")
      const data = (await response.json()) as WaifuImResponse

      if (data.images && data.images.length > 0 && data.images[0].url) {
        return {
          url: data.images[0].url
        }
      }
      return null
    } catch (error) {
      console.error("Waifu.im error:", error)
      return null
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
  },
  nekosbest: async (): Promise<AnimeImage | null> => {
    try {
      const response = await fetch("https://nekos.best/api/v2/waifu")
      const data = (await response.json()) as NekosBestResponse

      if (data.results && data.results.length > 0 && data.results[0].url) {
        return {
          url: data.results[0].url
        }
      }
      return null
    } catch (error) {
      console.error("Waifu.im error:", error)
      return null
    }
  },
}

export const getRandomProvider = (): string => {
  const providerList = Object.keys(providers) as (keyof typeof providers)[]
  return providerList[Math.floor(Math.random() * providerList.length)]
}

export const fetchRandomImage = async (): Promise<AnimeImage | null> => {
  const providerName = getRandomProvider()
  const provider = providers[providerName as keyof typeof providers]
  const result = await provider()

  if (!result) {
    for (const [name, func] of Object.entries(providers)) {
      if (name !== providerName) {
        const fallback = await func()
        if (fallback) return fallback
      }
    }
  }

  return result
}
