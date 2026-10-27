import { appendJSONObject } from '@/helpers/misc-helpers.js'

//Request pages from the wiki based on the provided query parameters
export async function queryActionRequest(baseApiUrl, requestParameters) {
  //Create a new URL with the query parameters
  const url = new URL(baseApiUrl)
  url.search = new URLSearchParams({
    ...{
      action: 'query',
      format: 'json',
      origin: '*',
    },
    ...requestParameters,
  })

  //Perform paginated requests until all results are retrieved
  let fragment
  const queryResult = {}
  do {
    let requestUrl

    //Check whether continuation parameters were provided by a previous request
    if (fragment?.continue !== undefined) {
      //Copy the original URL object and append the continuation parameters to it
      requestUrl = new URL(url)
      for (const [key, value] of Object.entries(fragment.continue)) {
        requestUrl.searchParams.set(key, value)
      }
    }
    else {
      //No need to continue, use the original URL as is
      requestUrl = url
    }

    //Request the next block
    const response = await fetch(requestUrl)

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    //Parse the response as JSON
    fragment = await response.json()

    //Accumulate the results
    appendJSONObject(queryResult, fragment.query)
  } while (Object.hasOwn(fragment, 'continue'))

  return queryResult
}
