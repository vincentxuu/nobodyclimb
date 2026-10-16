import auth from './auth.json'
import biography from './biography.json'
import blog from './blog.json'
import chat from './chat.json'
import chrome from './chrome.json'
import common from './common.json'
import community from './community.json'
import content from './content.json'
import crag from './crag.json'
import gallery from './gallery.json'
import games from './games.json'
import gym from './gym.json'
import home from './home.json'
import media from './media.json'
import misc from './misc.json'
import profile from './profile.json'
import site from './site.json'

// 由 scripts/i18n/split-messages.mjs 產生，請勿手動編輯。
// 新增模組後重跑：node scripts/i18n/split-messages.mjs
const messages = {
  ...auth,
  ...biography,
  ...blog,
  ...chat,
  ...chrome,
  ...common,
  ...community,
  ...content,
  ...crag,
  ...gallery,
  ...games,
  ...gym,
  ...home,
  ...media,
  ...misc,
  ...profile,
  ...site,
}

export default messages
