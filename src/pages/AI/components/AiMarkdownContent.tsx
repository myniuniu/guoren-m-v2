import type { HTMLAttributes } from 'react'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import 'streamdown/styles.css'
import {
  streamdownPlugins,
  streamdownPluginsWithWordAnimation,
} from './markdownPlugins'

type AiMarkdownContentProps = HTMLAttributes<HTMLDivElement> & {
  content: string
  isStreaming?: boolean
}

// lucky 对话区统一走一套 markdown 渲染链，避免 H5 和 PC 能力继续分叉。
export function AiMarkdownContent({
  content,
  isStreaming = false,
  className,
  ...props
}: AiMarkdownContentProps) {
  const plugins = isStreaming ? streamdownPluginsWithWordAnimation : streamdownPlugins

  return (
    <div className={className} {...props}>
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        parseIncompleteMarkdown
        remarkPlugins={plugins.remarkPlugins}
        rehypePlugins={plugins.rehypePlugins}
        lineNumbers={false}
        controls={false}
      >
        {content}
      </Streamdown>
    </div>
  )
}
