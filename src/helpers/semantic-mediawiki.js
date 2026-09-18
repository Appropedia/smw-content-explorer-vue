//Obtain a clean set of allowed property values from a Semantic Mediawiki API response, in the form
//of the following structure: { propertyName: [propertyValues] }
export function getAllowedValues(APIResult) {
  //Remove the "Property:" prefix from a Semantic Mediawiki property name
  function removePrefix(name) {
    return name.split(':')[1]
  }

  //Make sure the response API response contains allowed values
  if (!APIResult.printRequests.some(pr => pr.label === 'Allows value' && pr.typeid === '__pval')) {
    throw new Error('API result does not contain allowed values')
  }

  //Build the result from the API response
  return Object.fromEntries(
    Object.entries(APIResult.results)
    .map(([propName, propInfo]) => [removePrefix(propName), propInfo.printouts['Allows value']])
  )
}

//Obtain the count of unique property values from a Semantic Mediawiki API response, in the form of
//the following structure: { propertyName: { propertyValue: valueCount } }
export function countPrintoutValues(APIResult) {
  const printoutCounts = {}

  //Accumulate the printout totals for each page
  for (const pagePrintouts of Object.values(getPrintoutValues(APIResult))) {
    //Accumulate the printout totals for each property
    for (const [propertyName, propertyValues] of Object.entries(pagePrintouts)) {
      printoutCounts[propertyName] ??= {}   //Initialize if property hasn't been seen before

      //Accumulate the printout totals for each value
      for (const value of propertyValues) {
        printoutCounts[propertyName][value] ??= 0   //Initialize if value hasn't been seen before
        printoutCounts[propertyName][value]++
      }
    }
  }

  return printoutCounts
}

//Obtain the printout values from all pages in a Semantic Mediawiki API response, in the form of the
//following structure: { pageName: { propertyName: [printoutValues] } }
export function getPrintoutValues(APIResult) {
  //Get the types of the properties as a simple object
  const typeIDs = Object.fromEntries(
    APIResult.printRequests.map(pr => [pr.label, pr.typeid])
  )

  //Extract printout values from a page data structure
  function getPrintouts(pageData) {
    return Object.fromEntries(
      Object.entries(pageData.printouts)
      .map(([propertyName, printoutData]) => [propertyName, getValues(propertyName, printoutData)])
    )
  }

  //Extract all printout values from a printout data structure as a simple array of strings
  function getValues(propertyName, printoutData) {
    const type = typeIDs[propertyName]
    switch (type) {
      case '_txt':
      case '_keyw':
        //The printout data is an array of strings already, use it as is
        return printoutData
      case '_wpg':
        //The printout data is an array of webpage objects, use the full page names as values
        return printoutData.map(pd => pd.fulltext)
      default:
        throw new Error(`Type "${type}" of property "${propertyName}" is unsupported`)
    }
  }

  //Extract and return printout values from all pages in the API response
  return Object.fromEntries(
    Object.entries(APIResult.results)
    .map(([pageName, pageData]) => [pageName, getPrintouts(pageData)])
  )
}

//Check whether the given printout values satisfy the applied filters by using the given merge
//rules.
//Merge rules are passed as an object, with keys indicating the semantic property names to which
//they apply to and values indicating the rule, which can be either 'conjunction' or 'disjunction'.
//'conjunction' means that all applied filters must be met to consider them satisfied (AND rule),
//while 'disjunction' means that any applied filter that is met is enough to consider them satisfied
//(OR rule). The special key '' (empty string) is the global merge rule for all semantic properties.
//If a merge rule is not specied then 'conjunction' is applied by default.
export function checkFilters(printoutValues, appliedFilters, mergeRules) {
  //Perform checks for individual properties
  function checkValues([propertyName, filterValues]) {
    switch (mergeRules?.[propertyName] ?? 'conjunction') {
      case 'conjunction':
        return filterValues.every(value => printoutValues[propertyName].includes(value))
      case 'disjunction':
        return filterValues.some(value => printoutValues[propertyName].includes(value))
      default:
        throw new Error(`"${mergeRules[propertyName]}" is not a valid merge rule`)
    }
  }

  //Perform checks for all properties
  switch (mergeRules?.[''] ?? 'conjunction') {
    case 'conjunction':
      return Object.entries(appliedFilters).every(checkValues)
    case 'disjunction':
      return Object.entries(appliedFilters).some(checkValues)
    default:
      throw new Error(`"${mergeRules['']}" is not a valid merge rule`)
  }
}
