/**
 * i18n 訊息模組對應表。
 *
 * 每個模組 = `apps/web/messages/{locale}/{module}.json` 一個檔案，
 * 內含下列頂層 namespace（namespace 在檔案內仍是頂層 key，合併後與拆分前等價）。
 *
 * 新增 namespace 時：
 *  1. 在對應模組的 JSON 三個語系檔都加上該 namespace
 *  2. 把 namespace 名字補進下面對應模組的陣列
 *  3. 跑 `node scripts/i18n/check-i18n.mjs` 驗證
 */

/** @type {Record<string, string[]>} module → namespaces */
export const MODULES = {
  common: ['Common'],
  chrome: ['Navbar', 'Footer', 'LocaleSwitcher', 'MobileMenu', 'UserMenu'],
  home: ['HomePage'],
  crag: ['CragPage', 'CragData', 'CragFaq', 'TrafficCameras'],
  gym: ['GymPage', 'GymData'],
  biography: [
    'BiographyPage',
    'BiographyEditor',
    'BiographyQuestions',
    'BiographyStories',
    'BiographyTags',
  ],
  profile: [
    'ProfilePage',
    'ProfileDashboard',
    'ProfileEditor',
    'ProfileEvolution',
    'ProfileGallery',
    'ProfileGoals',
    'ProfileSections',
    'ProfileSetup',
    'ProfileTraining',
  ],
  blog: ['BlogPage', 'BlogCategories'],
  gallery: ['GalleryUI', 'UploadPage'],
  auth: ['Auth', 'Onboarding'],
  community: [
    'SearchPage',
    'NotificationCenter',
    'SharePage',
    'ShareButton',
    'ShareInvitation',
    'AnonymousShare',
    'ClaimContent',
    'RankBadge',
    'InstagramEmbed',
    'StoryDetail',
    'Ascent',
    'RouteStory',
  ],
  content: ['Editor', 'AiTool', 'BucketListForm', 'BucketListPage', 'Validation'],
  games: ['GamesPage', 'RopeGame', 'Quiz'],
  media: ['VideosPage', 'VideosFilter', 'Weather'],
  chat: ['Chat'],
  site: ['Metadata', 'AboutPage', 'ErrorPage', 'Countries', 'Badges'],
}

export const LOCALES = ['zh', 'en', 'ja']

/** namespace → module 的反查表 */
export const NAMESPACE_TO_MODULE = Object.fromEntries(
  Object.entries(MODULES).flatMap(([mod, namespaces]) => namespaces.map((ns) => [ns, mod]))
)

/** 依模組字母序排列（產生 index.ts 的穩定順序） */
export function moduleNames() {
  return Object.keys(MODULES).sort()
}
