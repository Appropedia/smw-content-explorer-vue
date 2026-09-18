//Request pages from the wiki based on the provided semantic search parameters
export async function askRequest(baseAPIUrl, queryDescriptor) {
  //Create a new URL with the query parameters
  const url = new URL(baseAPIUrl)
  url.search = new URLSearchParams({
    action: 'ask',
    query: formatQuery(queryDescriptor),
    format: 'json',
    origin: '*',
  })

  //Perform paginated requests until all results are retrieved
  let fragment
  const results = {}
  do {
    //Obtain the query continue offset parameter from last request, if available
    const offset = fragment?.['query-continue-offset']

    //Add the offset value to the query parameter to the next request, if needed
    if (offset !== undefined) {
      url.searchParams.set('query', formatQuery(queryDescriptor, { offset }))
    }

    //Request the next block
    const response = await fetch(url)

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    //Parse the response as JSON
    fragment = await response.json()

    //Accumulate the results
    Object.assign(results, fragment.query.results)
  } while (Object.hasOwn(fragment, 'query-continue-offset'))

  //Take the print request metadata from the last request (every fragment has the same data)
  const printRequests = fragment.query.printrequests

  return { results, printRequests }
}

//Format an "ask" query string and optionally add or replace parameters
function formatQuery(queryDescriptor, extraParameters = {}) {
  //Aggregate/replace all parameters
  const allParameters = { ...queryDescriptor.parameters, ...extraParameters }

  //Format the query string by appending the printouts and parameters to the search conditions by
  //separating them with "|?" and "|" respectively
  return queryDescriptor.conditions +
         (queryDescriptor.printouts ?? []).map(p => `|?${p}`).join('') +
         Object.entries(allParameters).map(([k, v]) => `|${k}=${v}`).join('')
}
