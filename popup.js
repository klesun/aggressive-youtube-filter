const checkbox = document.getElementById('REMOVE_WATCHED_LATER_VIDEOS');

browser.storage.local.get('REMOVE_WATCHED_LATER_VIDEOS').then((zhopa) => {
  const { REMOVE_WATCHED_LATER_VIDEOS } = zhopa;
  checkbox.addEventListener('change', () => {
    browser.storage.local.set({
      REMOVE_WATCHED_LATER_VIDEOS: checkbox.checked,
    });
  });
  checkbox.removeAttribute('disabled');
  checkbox.checked = !!REMOVE_WATCHED_LATER_VIDEOS;
});
