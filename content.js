// ==UserScript==
// @name     youtube-recommendations-filter
// @version  3
// @match    *://*.youtube.com/*
// @grant    none
// @namespace org.klesun
// @license MIT
// @description A greasemonkey script that removes Mix and watched videos from recommendations. Unlike similar solutions, this one actually clicks "Not Interested" on each such video, not just hides it with CSS, so you won't eventually end up with an empty feed because all of your recommendations are hidden. https://github.com/amitbl/blocktube/issues/474
// ==/UserScript==

function clickNotInterested(footer) {
  const { scrollX, scrollY } = window;
  footer.querySelector('button').click();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const notInterestedBtn = [...document.querySelectorAll('span.ytAttributedStringHost')]
        .filter(el => (
          el.textContent.trim() === 'Not interested' ||
          el.textContent.trim() === 'Hide'
        )).at(0);
      if (notInterestedBtn) {
        notInterestedBtn.click();
        resolve();
        setTimeout(() => window.scroll(scrollX, scrollY));
      } else {
        reject('Could not resolve the button in context dialog');
      }
    });
  });
}

function getAncestorBy(element, predicate) {
  while (element && !predicate(element)) {
    element = element.parentElement;
  }
  return element;
}

function getAncestorByTag(element, tagName) {
  return getAncestorBy(element, parent => parent.tagName === tagName.toUpperCase());
}

function* getMixFooters() {
  const selector = 'span.ytAttributedStringHost';
  const mixTitles = [...document.querySelectorAll(selector)]
    .filter(el => (
      el.textContent.trim().startsWith('Mix - ') ||
      el.textContent.trim() === 'My Mix'
    ));
  for (const mixTitle of mixTitles) {
    const footer = getAncestorByTag(mixTitle, 'yt-lockup-metadata-view-model');
    yield footer;
  }
}

function getWatchedFooters() {
  const selector = 'div.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment';
  return [...document.querySelectorAll(selector)]
    .filter(el => el.style.width && +el.style.width.replace(/%$/, '') > 75)
    .map(el => getAncestorBy(el, parent => parent.tagName === 'DIV' && parent.classList.contains('ytLockupViewModelHost')))
    .map(card => card.querySelector('yt-lockup-metadata-view-model'));
}

const undismissable = new Set();

async function dismissMeaninglessRecomendations() {
  const footers = [
    ...getMixFooters(),
    ...getWatchedFooters(),
  ];
  for (const footer of footers) {
    if (undismissable.has(footer)) {
      continue;
    }
    console.info('dismissing: ' + footer.textContent.trim(), footer);
    try {
      await clickNotInterested(footer);
    } catch (error) {
      // for example, on /feed/history page
      undismissable.add(footer);
    }
  }
}

let dimsissing = false;

setInterval(async () => {
  if (dimsissing) {
    return;
  }
  dimsissing = true;
  try {
    await dismissMeaninglessRecomendations();
  } finally {
    dimsissing = false;
  }
}, 1000);


function hideDismissedVideos() {
  for (const el of document.querySelectorAll('ytd-rich-item-renderer, yt-lockup-view-model')) {
    if (el.textContent.trim() === 'Got it. We\'ll tune your recommendations.' ||
        el.textContent.trim() === 'Video removed' ||
        el.textContent.trim() === 'Video removedUndoTell us why' ||
        el.textContent.trim() === 'Video hidden from feed'
    ) {
      console.info('Deleting card', el);
      el.remove();
    }
  }
}

setInterval(hideDismissedVideos, 100);


async function removeWatchedLaterVideos() {
  const selector = 'div.ytwThumbnailOverlayResumePlaybackRendererThumbnailOverlayResumePlaybackProgress';
  const cardMenuButtons = [...document.querySelectorAll(selector)]
    .filter(el => el.style.width && +el.style.width.replace(/%$/, '') > 75)
    .map(el => getAncestorByTag(el, 'ytd-playlist-video-renderer'))
    .map(card => card.querySelector('button.yt-icon-button'));
  for (const cardMenuButton of cardMenuButtons) {
    cardMenuButton.click();
    await new Promise(resolve => setTimeout(resolve));
    const unlistBtn = [...document.querySelectorAll('ytd-menu-service-item-renderer')]
      .filter(el => (
        el.textContent.trim() === 'Remove from Watch later'
      )).at(0);
    if (unlistBtn) {
      unlistBtn.click();
    }
  }
}

let removingWatchedLater = false;

setInterval(async () => {
  if (removingWatchedLater) {
    return;
  }
  removingWatchedLater = true;
  try {
    await removeWatchedLaterVideos();
  } finally {
    removingWatchedLater = false;
  }
}, 1000);

// https://www.youtube.com/playlist?list=WL

console.info('====== youtube-recommendations-filter started ======');
