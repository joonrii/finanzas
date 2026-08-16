import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=finanzas+personales+ahorro+inversion&language=es&sortBy=publishedAt&pageSize=4&apiKey=${process.env.NEWS_API_KEY}`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
