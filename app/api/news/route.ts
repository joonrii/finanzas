import { NextResponse } from "next/server";

export async function GET() {
  try {
    const query = encodeURIComponent(
      "finanzas personales OR ahorro OR inversión OR economía doméstica"
    );
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${query}&language=es&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.articles)) {
      return NextResponse.json({ articles: [] });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
