import { NextResponse } from 'next/server'

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  category: 'college_prep' | 'stem' | 'volleyball' | 'troy' | 'scholarships'
  publishedAt: string
}

// Curated free RSS feeds parsed via a public RSS-to-JSON service
const RSS_FEEDS = [
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Education.xml',
    category: 'college_prep' as const,
    source: 'NY Times Education',
  },
  {
    url: 'https://blog.collegeboard.org/feed',
    category: 'college_prep' as const,
    source: 'College Board',
  },
  {
    url: 'https://feeds.feedburner.com/mit/science',
    category: 'stem' as const,
    source: 'MIT Science',
  },
  {
    url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    category: 'stem' as const,
    source: 'NASA',
  },
  {
    url: 'https://prepvolleyball.com/feed/',
    category: 'volleyball' as const,
    source: 'PrepVolleyball',
  },
]

async function fetchRSSFeed(feedUrl: string, category: NewsItem['category'], source: string): Promise<NewsItem[]> {
  try {
    // Use rss2json.com — free tier, no API key required for basic usage
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`
    const response = await fetch(apiUrl, {
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!response.ok) return []

    const data = await response.json()

    if (data.status !== 'ok' || !data.items) return []

    return data.items.slice(0, 3).map((item: { title: string; description: string; link: string; pubDate: string }) => ({
      title: item.title,
      description: stripHtml(item.description).slice(0, 150) + '...',
      url: item.link,
      source,
      category,
      publishedAt: item.pubDate,
    }))
  } catch {
    return []
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

// Static curated links that are always relevant
const CURATED_LINKS: NewsItem[] = [
  {
    title: 'Troy High School — Official Website',
    description: 'Stay updated with school news, events, and announcements from Troy High.',
    url: 'https://www.troyhigh.com/',
    source: 'Troy High School',
    category: 'troy',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Troy Athletics — Warriors Sports',
    description: 'Schedules, scores, and news for all Troy Warriors sports teams.',
    url: 'https://www.troyathletics.org/',
    source: 'Troy Athletics',
    category: 'troy',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'Khan Academy — Free SAT Prep',
    description: 'Official free SAT prep from College Board and Khan Academy. Practice tests, lessons, and personalized study plans.',
    url: 'https://www.khanacademy.org/sat',
    source: 'Khan Academy',
    category: 'college_prep',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'AP Students — College Board',
    description: 'AP exam prep, course descriptions, and scoring information for all AP classes.',
    url: 'https://apstudents.collegeboard.org/',
    source: 'College Board',
    category: 'college_prep',
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'STEM Competition Calendar',
    description: 'Find upcoming STEM competitions, science fairs, and Olympiads for high school students.',
    url: 'https://www.sciencefair.io/guide/50-stem-competitions-for-students',
    source: 'ScienceFair.io',
    category: 'stem',
    publishedAt: new Date().toISOString(),
  },
]

export async function GET() {
  // Fetch RSS feeds in parallel
  const feedPromises = RSS_FEEDS.map((feed) =>
    fetchRSSFeed(feed.url, feed.category, feed.source)
  )

  const feedResults = await Promise.all(feedPromises)
  const rssItems = feedResults.flat()

  // Combine RSS items with curated links
  const allItems = [...rssItems, ...CURATED_LINKS]

  // Sort by date, most recent first
  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return NextResponse.json({
    items: allItems,
    lastUpdated: new Date().toISOString(),
  })
}
