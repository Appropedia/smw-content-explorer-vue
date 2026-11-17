import { computed } from 'vue'
import { useBackgroundQuery } from '@/composables/background-query.js'
import { queryActionQuery } from '@/queries/mediawiki.js'

const baseApiUrl = 'https://www.appropedia.org/w/api.php'   //Base URL for the wiki API
const parentPage = 'EDDIY/'                                 //Path of the parent page
const fallbackImage = 'File:EDDIY.png'                      //Image to be used as a fallback
const nonCandidateImages = [                                //Images to discard as candidates
  'File:EDDIY.png',
]

//Get a reactive list of thumbnail links for each page in the 'Careable Collection' view, in the
//form of the following structure: { pageName, thumbnailURL }
export function useCareablesThumbnails() {
  //Preliminary page information (includes tumbnails from the PageImages extension)
  const preliminaryPageInfo = usePreliminaryPageInfo()

  //Thumbnails obtained from wiki images
  const wikiImageThumbnails = useWikiImageThumbnails(preliminaryPageInfo)

  //Thumbnails obtained from embedded videos
  const embeddedVideoThumbnails = useEmbeddedVideoThumbnails(preliminaryPageInfo)

  //Gather thumbnails from all sources above
  return computed(() => {
    return {
      ...embeddedVideoThumbnails.value,
      ...wikiImageThumbnails.value,
      ...preliminaryPageInfo.value.pageImageThumbnails,
    }
  })
}

//Obtain preliminary page information from the mediawiki API and determine the most appropriate
//thumbnail source for each page. Data is returned differently based on the source.
//Return values, as a computed property:
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
function usePreliminaryPageInfo() {
  //Query parameters
  const requestParams = {
    generator: 'allpages',                //Use the 'all pages' list as a generator
    gapprefix: parentPage,                //Request all sub pages under the parent page
    gaplimit: 100,                        //Limit for the generator
    prop: 'pageimages|images|templates',  //Get PageImages data and embedded images and templates
    pithumbsize: 330,                     //Thumbnail size for PageImages
    pilimit: 100,                         //Same as generator limit (one PageImages report per page)
    imlimit: 5000,                        //Set a high limit to avoid interference with other limits
    tltemplates: 'Template:Video',        //Request video templates only
    tllimit: 5000,                        //Set a high limit as well
  }

  //Create the query (triggers automatically)
  const queryData = useBackgroundQuery(queryActionQuery(baseApiUrl, requestParams))

  return computed (() => {
    const data = queryData.value
    const result = {
      pageImageThumbnails: {},
      wikiImagePages: {},
      embeddedVideoPages: [],
    }

    //Return a semi-empty object if there's no data
    if (data === undefined) {
      return result
    }

    //Use the query data to generate the preliminary page information
    for (const page of Object.values(data.pages)) {
      //Discard page translations (page titles containing two slashes)
      if (/.*\/.*\/.*/.test(page.title)) {
        continue
      }

      //Thumbnails provided by the PageImages extension are preferred over any other option
      if (Object.hasOwn(page, 'thumbnail')) {
        result.pageImageThumbnails[page.title.slice(parentPage.length)] = page.thumbnail.source
        continue
      }

      //Images embedded in the page are preferred next (excluding non candidates)
      if (Object.hasOwn(page, 'images')) {
        const imageCandidates = page.images.filter(i => !nonCandidateImages.includes(i.title))
        if (imageCandidates.length > 0) {
          //Take the first image, as it's hopefully the most prominent one; then append the title of
          //the page that contains it
          const imageTitle = imageCandidates[0].title
          result.wikiImagePages[imageTitle] ??= []
          result.wikiImagePages[imageTitle].push(page.title)
          continue
        }
      }

      //Thumbnails of videos embedded in the page are preferred last
      if (Object.hasOwn(page, 'templates') &&
          page.templates.some(template => template.title === 'Template:Video'))
      {
        result.embeddedVideoPages.push(page.title)
        continue
      }

      //No image available for this title, use the fallback image instead
      result.wikiImagePages[fallbackImage] ??= []
      result.wikiImagePages[fallbackImage].push(page.title)
    }

    return result
  })
}

//Request thumbnails from images on the wiki using the preliminary page information
function useWikiImageThumbnails(preliminaryPageInfo) {
  //Reactivity-preserving aliases
  const wikiImagePages = () => preliminaryPageInfo.value.wikiImagePages

  //Query parameters
  const requestParams = () => ({
    titles: Object.keys(wikiImagePages()).join('|'),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '330',
  })

  //Create the query (at least one wiki image page must be present in order to trigger it)
  const queryData = useBackgroundQuery(() => ({
    ...queryActionQuery(baseApiUrl, requestParams()),
    enabled: () => Object.keys(wikiImagePages()).length > 0,
  }))

  return computed(() => {
    const data = queryData.value
    const result = {}

    //Return an empty object if there's no data
    if (data === undefined) {
      return result
    }

    //Gather the thumbnails obtained in the request
    for (const image of Object.values(data.pages)) {
      for (const pageTitle of wikiImagePages()[image.title]) {
        result[pageTitle.slice(parentPage.length)] = image.imageinfo[0].thumburl
      }
    }

    return result
  })
}

//Obtain thumbnails for pages with embedded videos using the preliminary page information
function useEmbeddedVideoThumbnails(preliminaryPageInfo) {
  //Reactivity-preserving aliases
  const embeddedVideoPages = () => preliminaryPageInfo.value.embeddedVideoPages

  //Query parameters
  const requestParams = () => ({
    titles: embeddedVideoPages().join('|'),
    prop: 'revisions',
    rvprop: 'content',
  })

  //Create the query (at least one page with embedded videos must be present in order to trigger it)
  const queryData = useBackgroundQuery(() => ({
    ...queryActionQuery(baseApiUrl, requestParams()),
    enabled: () => Object.keys(embeddedVideoPages()).length > 0,
  }))

  return computed(() => {
    const data = queryData.value
    const result = {}

    //Return an empty object if there's no data
    if (data === undefined) {
      return result
    }

    //Use the wikitext in each page to infer the video thumbnail URL; skip to the next image in case
    //of any error
    for (const page of Object.values(data.pages)) {
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
      result[page.title.slice(parentPage.length)] =
        `https://i.ytimg.com/vi/${videoID}/mqdefault.jpg`
    }

    return result
  })
}
