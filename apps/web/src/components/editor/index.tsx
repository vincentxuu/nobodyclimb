import dynamic from 'next/dynamic'
import { EditorLoading } from './EditorLoading'

// 動態載入 RichTextEditor，避免 server-side 引入 react-quill-new
export const RichTextEditor = dynamic(
  () => import('./RichTextEditor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <EditorLoading />,
  }
)

export { ImageUploader } from './ImageUploader'
export { TagSelector } from './TagSelector'
