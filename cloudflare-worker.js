addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  const streamlitUrl = 'https://portfolio-alex.streamlit.app'
  
  const streamlitRequest = new Request(streamlitUrl + url.pathname + url.search, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  })
  
  try {
    const response = await fetch(streamlitRequest)
    
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })

    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('text/html')) {
      const text = await newResponse.text()
      const modifiedText = text
        .replace(/https:\/\/portfolio-alex\.streamlit\.app/g, url.origin)
        .replace(/portfolio-alex\.streamlit\.app/g, url.hostname)
      
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          'content-type': 'text/html',
        },
      })
    }
    
    return newResponse
  } catch (error) {
    return new Response(`Erreur de proxy: ${error.message}`, {
      status: 502,
    })
  }
}

