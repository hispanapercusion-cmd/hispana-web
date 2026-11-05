// hispana-patreon: devuelve los últimos videos de Patreon para la web
// Variable secreta necesaria: PATREON_TOKEN
const API = 'https://www.patreon.com/api/oauth2/v2';

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    const cache = caches.default;
    const clave = new Request(new URL('/api/patreon', request.url).toString());
    const guardado = await cache.match(clave);
    if (guardado) return guardado;
    if (!env.PATREON_TOKEN) return json({ posts: [], error: 'Falta PATREON_TOKEN' }, 60);
    try {
      const auth = { headers: { Authorization: 'Bearer ' + env.PATREON_TOKEN, 'User-Agent': 'HispanaPercusion-Web' } };
      const r1 = await fetch(API + '/campaigns', auth);
      if (!r1.ok) throw new Error('campaigns ' + r1.status);
      const campId = (await r1.json())?.data?.[0]?.id;
      if (!campId) throw new Error('sin campaña');
      let next = API + '/campaigns/' + campId + '/posts?page%5Bcount%5D=100&fields%5Bpost%5D=title,url,published_at,is_public,embed_url,embed_data';
      let todos = [];
      for (let i = 0; next && i < 10; i++) {
        const r = await fetch(next, auth);
        if (!r.ok) throw new Error('posts ' + r.status);
        const d = await r.json();
        todos = todos.concat(d.data || []);
        next = d.links?.next || null;
      }
      const posts = todos.map((p) => p.attributes || {})
        .filter((a) => a.title && a.url && a.published_at)
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        .slice(0, 6)
        .map((a) => ({
          title: a.title,
          url: a.url.startsWith('http') ? a.url : 'https://www.patreon.com' + a.url,
          date: a.published_at,
          public: !!a.is_public,
          thumb: miniatura(a),
        }));
      const resp = json({ posts }, 3600);
      ctx.waitUntil(cache.put(clave, resp.clone()));
      return resp;
    } catch (e) {
      return json({ posts: [], error: String(e.message || e) }, 120);
    }
  },
};

function miniatura(a) {
  const t = [a.embed_url, a.embed_data?.url, a.embed_data?.html].filter(Boolean).join(' ');
  const m = t.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (m) return 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg';
  const u = a.embed_data?.thumbnail_url || a.embed_data?.image?.url;
  return u && u.startsWith('https://') ? u : null;
}

function cors() {
  return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };
}

function json(obj, segundos) {
  return new Response(JSON.stringify(obj), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + segundos, ...cors() },
  });
}
