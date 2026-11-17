import { computed, toValue } from 'vue'
import { useQuery } from '@pinia/colada'

//This composable is a wrapper around Pinia Colada's useQuery that manages state in the background
//for queries whose state is not reflected on the user interface. The data obtained by the query is
//returned by the composable if the query has been successful at least once since last enabled and
//isn't currently disabled, otherwhise undefined is returned.
export function useBackgroundQuery(query) {
  //Create the query
  const { state: queryState } = useQuery(query)

  //Return a computed property that handles the query state and hands over the query data
  return computed((previousValue) => {
    //Return undefined if the query is disabled
    const queryValue = toValue(query)
    if (Object.hasOwn(queryValue, 'enabled') && !toValue(queryValue.enabled)) {
      return undefined
    }

    const { status, error, data } = queryState.value

    //Log errors to the browser console
    if (status === 'error') {
      console.error(error)
    }

    //If the query is pending or an error happened, return the previous value if available
    if (status !== 'success') {
      return previousValue
    }

    return data
  })
}
