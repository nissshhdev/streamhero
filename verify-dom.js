const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const idsToCheck = [
  'lobbyView', 'theaterView', 'navRoomControls', 'navRoomCode', 'roomCodeBadge',
  'networkIpDisplay', 'toastContainer', 'joinLobbyForm', 'inputUserName', 'inputRoomCode',
  'btnAvatarPicker', 'avatarSelectorGrid', 'modalShare', 'btnShareParty', 'btnCloseShareModal',
  'qrCodeImage', 'inputShareUrl', 'btnCopyShareUrl', 'modalUpload', 'btnUploadModalNav',
  'btnUploadModalEmpty', 'btnCloseUploadModal', 'btnCancelUpload', 'uploadDropzone',
  'videoFileInput', 'selectedFileInfo', 'selectedFileName', 'selectedFileSize',
  'btnRemoveSelectedFile', 'subtitleFileInput', 'btnBrowseSubtitles', 'subtitlesAttachedName',
  'subtitlesBtnText', 'uploadProgressWrap', 'uploadProgressBarFill', 'uploadProgressPercent',
  'btnStartUpload', 'modalLibrary', 'btnVideoLibraryNav', 'btnBrowseLibraryEmpty',
  'btnCloseLibraryModal', 'btnCloseLibraryFooter', 'libraryVideosGrid', 'btnOpenUploadFromLibrary',
  'btnLoadDemoVideo', 'theaterSidebar', 'btnToggleSidebarMobile', 'membersListContainer',
  'memberCountBadge', 'chkHostOnlyControls', 'settingsLanUrlDisplay', 'btnOpenQrFromSettings',
  'btnToggleSoundEffects', 'soundIcon', 'mainVideo', 'videoContainer', 'playerControlsOverlay',
  'emptyPlayerState', 'videoBufferSpinner', 'ambientCanvas', 'btnPlayPause', 'btnRewind10',
  'btnForward10', 'volumeSlider', 'btnVolumeMute', 'timeCurrent', 'timeDuration',
  'videoActiveTitle', 'videoSyncStatus', 'timelineContainer', 'timelineProgress',
  'timelineBuffer', 'timelineThumb', 'timelineHoverTime', 'btnPip', 'btnTheaterMode',
  'btnFullscreen', 'playStateCue', 'btnSpeedToggle', 'speedDropdownMenu', 'currentSpeedLabel',
  'btnSubtitlesToggle', 'subtitlesDropdownMenu', 'btnForceSync', 'chatMessagesContainer',
  'chatTextInput', 'chatInputForm', 'chatUnreadDot', 'reactionsContainer',
  'btnOpenInstructionsModal', 'btnNavInstructions', 'modalInstructions', 'btnCloseInstructionsModal', 'btnCloseInstructionsFooter',
  'youtubePlayer', 'youtubePlayerWrap', 'modalYouTube', 'btnYouTubeModalNav', 'btnYouTubeModalEmpty', 'btnCloseYouTubeModal', 'btnCancelYouTube', 'inputYouTubeUrl', 'youTubeThumbnail', 'youTubePreviewTitle', 'btnStartYouTube'
];

let missing = [];
for (const id of idsToCheck) {
  const pattern = new RegExp('id=["\']' + id + '["\']');
  if (!pattern.test(html)) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.error('❌ Missing IDs in index.html:', missing);
} else {
  console.log('✓ All', idsToCheck.length, 'DOM IDs exist in index.html!');
}
