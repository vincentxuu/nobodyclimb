/**
 * AI 工具執行進度（精簡版）
 * 對應 web：apps/web/src/components/ai-elements/tool-activity.tsx（mobile 不提供展開 Request / Response）
 */
import { FONT_SIZE, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Check, CircleAlert } from 'lucide-react-native'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { getToolLabel, type ToolProgressItem } from '@/lib/ai/toolProgress'

const ICON_SIZE = 14

function ToolStatusIcon({ item }: { item: ToolProgressItem }) {
  if (item.status === 'executing') {
    return (
      <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} style={styles.spinner} />
    )
  }
  if (item.isError) return <CircleAlert size={ICON_SIZE} color={SEMANTIC_COLORS.error} />
  return <Check size={ICON_SIZE} color={SEMANTIC_COLORS.success} />
}

function getStatusText(item: ToolProgressItem) {
  const label = getToolLabel(item.tool)
  if (item.status === 'executing') return `正在${label}…`
  return item.isError ? `${label}失敗` : `已${label}`
}

export function ToolProgressList({ tools }: { tools: ToolProgressItem[] }) {
  if (tools.length === 0) return null

  return (
    <View style={styles.container}>
      {tools.map((item) => (
        <View key={item.id} style={styles.row}>
          <ToolStatusIcon item={item} />
          <Text style={styles.label} numberOfLines={1}>
            {getStatusText(item)}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  spinner: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    transform: [{ scale: 0.7 }],
  },
  label: {
    flexShrink: 1,
    fontSize: FONT_SIZE.xs,
    color: SEMANTIC_COLORS.textMuted,
  },
})

export default ToolProgressList
