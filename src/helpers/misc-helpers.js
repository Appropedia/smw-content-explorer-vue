//Sort an object using an optional sort function. The sort function takes values 'a' and 'b' as
//objects in the form { key, value }.
export function sortObject(obj, sortFunction) {
  //Sort by key if no sort function is provided
  const doSort = sortFunction ?? ((a, b) => a.key.localeCompare(b.key))

  //Decompose the object entries, sort them and reconstruct a new object
  return Object.fromEntries(
    Object.entries(obj).sort(
      ([ka, va], [kb, vb]) => doSort({ key: ka, value: va }, { key: kb, value: vb })
    )
  )
}

//Given two objects that contain JSON data exclusively, merge the source into the destination by
//recursively merging or overwriting fields.
export function appendJSONObject(dst, src) {
  //Iterate over the key/value pairs of the source JSON object
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'object') {
      //Composite values are merged
      if (Array.isArray(v)) {
        //Arrays are extended
        dst[k] ??= []
        dst[k].push(...v)
      }
      else {
        //Child objects are appended recursively
        dst[k] ??= {}
        appendJSONObject(dst[k], v)
      }
    }
    else {
      //Single values are appended or overwritten
      dst[k] = v
    }
  }
}
