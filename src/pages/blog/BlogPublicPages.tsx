/* Blog pubblico: elenco degli articoli pubblicati e pagina dell'articolo, con meta SEO. */
import { Link, useParams } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { ArticleBody } from "@/components/content/ArticleBody";
import { usePagination } from "@/components/app/Pagination";
import { EmptyState, PageError, PageLoading } from "@/components/app/PageState";
import { getPostBySlug, listPublicPosts } from "@/api/blog";
import { useLoad } from "@/lib/data/useLoad";
import { useSeo } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export function BlogListPage() {
  useSeo("Blog");
  const { data, loading, error, reload } = useLoad(listPublicPosts);
  const { pageItems, pager } = usePagination(data ?? [], 10);
  return (
    <SiteLayout>
      <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Blog</h1>
      <div className="mt-8 flex flex-col">
        {loading && !data && <PageLoading />}
        {error && <PageError onRetry={reload} />}
        {data?.length === 0 && <EmptyState title="Ancora nessun articolo." />}
        {pageItems.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group flex flex-col gap-1.5 border-b border-line py-6 first:pt-0">
            <span className="text-[13px] text-ink-3">{formatDate(p.data)} · {p.autore}</span>
            <span className="text-[20px] font-semibold tracking-[-0.01em] text-ink group-hover:text-accent-ink">{p.titolo}</span>
            <span className="text-[15px] leading-[1.6] text-ink-2">{p.estratto}</span>
          </Link>
        ))}
        <div className="mt-4">{pager}</div>
      </div>
    </SiteLayout>
  );
}

export function BlogPostPage() {
  const { slug = "" } = useParams();
  const { data, loading, error } = useLoad(() => getPostBySlug(slug), [slug]);
  useSeo(data?.seoTitolo || data?.titolo || "Articolo", data?.seoDescrizione || data?.estratto, data?.copertina, Boolean(error));
  return (
    <SiteLayout>
      <Link to="/blog" className="text-[13px] font-medium text-ink-2 hover:text-ink">← Blog</Link>
      {loading && !data && <PageLoading />}
      {error && <p className="mt-6 text-[15px] text-ink-2">Articolo non trovato.</p>}
      {data && (
        <article className="mt-6">
          <p className="text-[13px] text-ink-3">{formatDate(data.data)} · {data.autore}</p>
          <h1 className="mt-2 text-[34px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-ink">{data.titolo}</h1>
          <p className="mt-4 text-[18px] leading-[1.6] text-ink-2">{data.estratto}</p>
          {data.copertina && <img src={data.copertina} alt="" className="mt-8 w-full rounded-window object-cover shadow-hairline" />}
          <div className="mt-8"><ArticleBody source={data.corpo} /></div>
        </article>
      )}
    </SiteLayout>
  );
}
