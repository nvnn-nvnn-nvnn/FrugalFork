// Fetch a recipe URL server-side and pull out the most useful signal for the
// model: schema.org/Recipe JSON-LD (which most recipe sites embed), the page
// title/description, and a trimmed text body as a fallback.
//
// Pinterest pins rarely contain the recipe themselves — they point to a source
// article — so for pinterest hosts we first try to resolve the outbound link
// and fetch that instead.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export type PageContext = {
  finalUrl: string;
  title: string;
  description: string;
  /** Raw JSON-LD blocks (stringified) found on the page — best extraction signal. */
  jsonLd: string[];
  /** Trimmed visible text, as a fallback when no JSON-LD is present. */
  text: string;
};

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Could not reach the link (HTTP ${res.status}).`);
  return await res.text();
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'));
  return m ? m[1] : null;
}

function metaContent(html: string, key: string): string | null {
  // matches <meta property="og:..." content="..."> or name="..." in any order
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag ? attr(tag, 'content') : null;
}

function extractJsonLd(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) blocks.push(m[1].trim());
  return blocks;
}

function stripToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);
}

/** If this is a Pinterest pin, try to find the source article URL it links to. */
function resolvePinterestSource(html: string): string | null {
  // Pins expose the destination via og:see_also or a "link" field in their data.
  const seeAlso = metaContent(html, 'og:see_also');
  if (seeAlso && !seeAlso.includes('pinterest.')) return seeAlso;
  const link = html.match(/"link":\s*"(https?:\/\/[^"]+)"/i)?.[1];
  if (link && !link.includes('pinterest.')) return link.replace(/\\u002F/g, '/');
  return null;
}

export async function fetchPageContext(inputUrl: string): Promise<PageContext> {
  let url = inputUrl.trim();
  let html = await fetchHtml(url);

  // Pinterest: hop to the underlying recipe source when we can find it.
  if (/pinterest\.|pin\.it/i.test(url)) {
    const source = resolvePinterestSource(html);
    if (source) {
      url = source;
      html = await fetchHtml(url);
    }
  }

  return {
    finalUrl: url,
    title: metaContent(html, 'og:title') ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '',
    description: metaContent(html, 'og:description') ?? metaContent(html, 'description') ?? '',
    jsonLd: extractJsonLd(html),
    text: stripToText(html),
  };
}
