import { ref, computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { queryActionQuery } from '@/queries/mediawiki.js'
import { queryActionRequest } from '@/api/mediawiki.js'

const baseApiUrl = 'https://www.appropedia.org/w/api.php'   //Base URL for the wiki API
const fallbackImage = 'File:EDDIY.png'                      //Image to be used as a fallback
const nonCandidateImages = [                                //Images to discard as candidates
  'File:EDDIY.png',
]

//Get a reactive list of thumbnail links for each page in the 'Careable Collection' view, in the
//form of the following structure: { pageName, thumbnailURL }
export function useCareablesThumbnails() {
  //Main query parameters
  const pageInfoRequestParams = {
    generator: 'allpages',                //Use the 'all pages' list as a generator
    gapprefix: 'EDDIY/',                  //Request all sub pages under 'EDDIY/'
    gaplimit: 100,                        //Limit for the generator
    prop: 'pageimages|images|templates',  //Get PageImages data and embedded images and templates
    pithumbsize: 330,                     //Thumbnail size for PageImages
    pilimit: 100,                         //Same as generator limit (one PageImages report per page)
    imlimit: 5000,                        //Set a high limit to avoid interference with other limits
    tltemplates: 'Template:Video',        //Request video templates only
    tllimit: 5000,                        //Set a high limit as well
  }

  //Create and trigger the main query
  const { state: pageInfoQueryState } = useQuery(
    () => queryActionQuery(baseApiUrl, pageInfoRequestParams)
  )

  //Compute the initial set of thumbnails from the main query response data and trigger up to two
  //subsequent queries in order to obtain the remaining thumbnails
  const pageImageThumbnails = computed((previousValue) => {
    //Log errors to the browser console
    if (pageInfoQueryState.value.status === 'error') {
      console.error(pageInfoQueryState.value.error)
    }

    //If the main query is pending or an error happened, return the previous set of thumbnails if
    //available or an empty set of thumbnails otherwise
    if (pageInfoQueryState.value.status !== 'success') {
      return previousValue ?? {}
    }

    //The main query is successful; categorize the pages in the response data
    const { pageImageThumbnails: newValue, wikiImagePages, embeddedVideoPages } =
      categorizePageThumbnails(pageInfoQueryState.value.data.pages)

    //Request thumbnails from images on the wiki in the background, if needed
    requestWikiImageThumbnails(wikiImageThumbnails, wikiImagePages)

    //Obtain thumbnails for pages with embedded videos in the background, if needed
    requestEmbeddedVideoThumbnails(embeddedVideoThumbnails, embeddedVideoPages)

    //Return the thumbnails returned by the PageImages extension (if any) in the meantime
    return newValue
  })

  //Thumbnails obtained from wiki images
  const wikiImageThumbnails = ref({})

  //Thumbnails obtained from embedded videos
  const embeddedVideoThumbnails = ref({})

  //Gather thumbnails from all sources above
  return computed(() => {
    return {
      ...embeddedVideoThumbnails.value,
      ...wikiImageThumbnails.value,
      ...pageImageThumbnails.value,
    }
  })
}

//Analize page information obtained through the mediawiki API and determine the most appropriate
//thumbnail source for each page. Data is returned differently based on the source.
//Return values, as an object:
//- pageImageThumbnails: Thumbnails that can be obtained directly through the PageImages extension.
//  This aligns with the intention of representing articles with images and is the simplest way of
//  obtaining thumbnails, consequently being the the most preferred way as well. Data is returned as
//  an object with article titles as keys and thumbnail URLs as values.
//- wikiImagePages: Thumbnails that can be obtained from images available in the wiki. Data is
//  returned as an object with image titles as keys and arrays of article titles as values (note:
//  the same image can be used as a thumbnail by more than one article).
//- embeddedVideoPages: Thumbnails that can be obtained from videos embedded in the articles. This
//  is the least preferred way as it requires retrieving and parsing wikitext and depends on a third
//  party platform. Data is returned as an array of article titles.
function categorizePageThumbnails(pageInfo) {
  const pageImageThumbnails = {}
  const wikiImagePages = {}
  const embeddedVideoPages = []

  for (const page of Object.values(pageInfo)) {
    //Discard page translations (page titles containing two slashes)
    if (/.*\/.*\/.*/.test(page.title)) {
      continue
    }

    //Thumbnails provided by the PageImages extension are preferred over any other option
    if (Object.hasOwn(page, 'thumbnail')) {
      pageImageThumbnails[page.title] = page.thumbnail.source
      continue
    }

    //Images embedded in the page are preferred next (excluding non candidates)
    if (Object.hasOwn(page, 'images')) {
      const imageCandidates = page.images.filter(i => !nonCandidateImages.includes(i.title))
      if (imageCandidates.length > 0) {
        //Take the first image, as it's hopefully the most prominent one; then append the title of
        //the page that contains it
        const imageTitle = imageCandidates[0].title
        wikiImagePages[imageTitle] ??= []
        wikiImagePages[imageTitle].push(page.title)
        continue
      }
    }

    //Thumbnails of videos embedded in the page are preferred last
    if (Object.hasOwn(page, 'templates') &&
        page.templates.some(template => template.title === 'Template:Video'))
    {
      embeddedVideoPages.push(page.title)
      continue
    }

    //No image available for this title, use the fallback image instead
    wikiImagePages[fallbackImage] ??= []
    wikiImagePages[fallbackImage].push(page.title)
  }

  return { pageImageThumbnails, wikiImagePages, embeddedVideoPages }
}

//Request thumbnails from images on the wiki and return them asynchronously through the provided
//reactive variable.
//Parameters:
//- wikiImageThumbnails: A reference to a vue ref() object where the result is to be stored.
//- wikiImagePages: An object containing the required information, with image titles as keys and
//  arrays of article titles as values.
function requestWikiImageThumbnails(wikiImageThumbnails, wikiImagePages) {
  //Skip the request if no image page is provided
  if (Object.keys(wikiImagePages).length === 0) {
    wikiImageThumbnails.value = {}
    return
  }

  //Perform the request
  queryActionRequest(
    baseApiUrl,
    {
      titles: Object.keys(wikiImagePages).join('|'),
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '330',
    }
  )
  .then((imageInfo) => {
    //Store the thumbnails obtained in the request in the reactive variable
    wikiImageThumbnails.value = {}
    for (const image of Object.values(imageInfo.pages)) {
      for (const pageTitle of wikiImagePages[image.title]) {
        wikiImageThumbnails.value[pageTitle] = image.imageinfo[0].thumburl
      }
    }
  })
  .catch((error) => {
    //Log errors to the browser console
    console.log(error)
  })
}

//Obtain thumbnails for pages with embedded videos and return them asynchronously through the
//provided reactive variable.
//Parameters:
//- embeddedVideoThumbnails: A reference to a vue ref() object where the result is to be stored.
//- embeddedVideoPages: An array listing the titles of pages with embedded videos.
function requestEmbeddedVideoThumbnails(embeddedVideoThumbnails, embeddedVideoPages) {
  //Skip the request if no page is provided
  if (embeddedVideoPages.length === 0) {
    embeddedVideoThumbnails.value = {}
    return
  }

  //Perform the request
  queryActionRequest(
    baseApiUrl,
    {
      titles: embeddedVideoPages.join('|'),
      prop: 'revisions',
      rvprop: 'content',
    }
  )
  .then((revisionInfo) => {
    //Use the wikitext of each page to infer the video thumbnail URL; skip to the next image in case
    //of any error
    embeddedVideoThumbnails.value = {}
    for (const page of Object.values(revisionInfo.pages)) {
      //This regex locates the first video template in the wikitext while providing a capture group
      //for the template parameter, which is the video URL
      const videoRegex = /{{\s*Video[\s\S]*video\s*=\s*(\S+)/

      //Perform regex matching on the wikitext of the latest revision
      const match = videoRegex.exec(page.revisions[0]['*'])
      if (match === null) {
        continue
      }

      //Parse the video URL from the single capture group
      let url
      try { url = new URL(match[1]) }
      catch { continue }

      //Identify the URL format based on the host name
      let videoID
      switch (url.hostname) {
        case 'www.youtube.com':
          //The video ID is encoded in the 'v' parameter for this domain
          videoID = url.searchParams.get('v')
          break
        case 'youtu.be':
          //The video ID is encoded in the pathname for this domain (note: initial '/' is trimmed)
          videoID = url.pathname.slice(1)
          break
        default:
          //Unsupported domain
          continue
      }

      //Use the video ID to infer the thumbnail URL and add it to the reactive variable
      embeddedVideoThumbnails.value[page.title] = `https://i.ytimg.com/vi/${videoID}/mqdefault.jpg`
    }
  })
  .catch((error) => {
    //Log errors to the browser console
    console.log(error)
  })
}
