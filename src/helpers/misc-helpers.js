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
