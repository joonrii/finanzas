"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

interface Article {
  title: string;
  url: string;
  source: { name: string };
}

export function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles?.slice(0, 3) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-zinc-500 text-xs">Cargando noticias...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
        <p className="text-zinc-500 text-xs">No hay noticias disponibles.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-3.5 h-3.5 text-zinc-500" />
        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Finanzas hoy</p>
      </div>
      <div className="flex flex-col gap-3">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2.5 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition group"
          >
            <p className="text-white text-[11px] font-medium leading-snug group-hover:text-emerald-400 transition line-clamp-2">
              {a.title}
            </p>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-zinc-600 text-[9px]">{a.source.name}</span>
              <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400 transition" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
