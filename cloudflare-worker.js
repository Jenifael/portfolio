export default {
  async fetch(request, env, ctx) {
    return handleRequest(request)
  }
}

async function handleRequest(request) {
  const url = new URL(request.url)
  const streamlitUrl = 'https://portfolio-alex.streamlit.app'
  const streamlitHost = 'portfolio-alex.streamlit.app'
  
  // Créer les nouveaux headers en remplaçant Host, Origin, Referer
  const headers = new Headers()
  
  // Copier tous les headers sauf ceux qui causent des problèmes
  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase()
    
    // Ignorer les headers qui doivent pointer vers Streamlit, pas vers le Worker
    if (lowerKey === 'host') {
      headers.set('Host', streamlitHost)
    } else if (lowerKey === 'origin') {
      headers.set('Origin', `https://${streamlitHost}`)
    } else if (lowerKey === 'referer') {
      // Remplacer le referer pour pointer vers Streamlit
      const refererUrl = new URL(value)
      headers.set('Referer', `https://${streamlitHost}${refererUrl.pathname}${refererUrl.search}`)
    } else if (lowerKey !== 'cf-connecting-ip' && lowerKey !== 'cf-ray' && lowerKey !== 'cf-visitor') {
      // Garder les autres headers (cookies, user-agent, etc.)
      headers.set(key, value)
    }
  }
  
  // Créer la requête vers Streamlit
  const streamlitRequest = new Request(streamlitUrl + url.pathname + url.search, {
    method: request.method,
    headers: headers,
    body: request.body,
  })
  
  try {
    const response = await fetch(streamlitRequest)
    
    // Créer une nouvelle réponse avec les headers modifiés
    const responseHeaders = new Headers(response.headers)
    
    // Modifier les headers de redirection (Location) pour pointer vers le Worker
    const location = responseHeaders.get('Location')
    if (location && location.includes(streamlitHost)) {
      const locationUrl = new URL(location)
      responseHeaders.set('Location', url.origin + locationUrl.pathname + locationUrl.search)
    }
    
    // Modifier les cookies pour qu'ils fonctionnent avec le domaine du Worker
    const setCookie = responseHeaders.get('Set-Cookie')
    if (setCookie) {
      // Remplacer le domaine dans les cookies
      const modifiedCookie = setCookie
        .replace(/Domain=[^;]+/gi, '')
        .replace(/Secure/gi, 'Secure; SameSite=None')
      responseHeaders.set('Set-Cookie', modifiedCookie)
    }
    
    const contentType = responseHeaders.get('content-type') || ''
    
    // Si c'est du HTML, remplacer les URLs dans le contenu
    if (contentType.includes('text/html')) {
      const text = await response.text()
      const modifiedText = text
        .replace(/https:\/\/portfolio-alex\.streamlit\.app/g, url.origin)
        .replace(/http:\/\/portfolio-alex\.streamlit\.app/g, url.origin)
        .replace(/portfolio-alex\.streamlit\.app/g, url.hostname)
        .replace(/share\.streamlit\.io/g, url.hostname)
      
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    }
    
    // Pour les autres types de contenu, retourner la réponse avec les headers modifiés
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return new Response(`Erreur de proxy: ${error.message}`, {
      status: 502,
    })
  }
}

