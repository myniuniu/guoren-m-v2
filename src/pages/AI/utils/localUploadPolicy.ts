import type { ChatAttachment } from '../../../services/chat/types'
import { isChatParseDocumentFile } from '../../../services/chat/upload'

export const MAX_LOCAL_DOCUMENT_ATTACHMENTS = 5

export function countParsedLocalFiles(attachments: ChatAttachment[] = []): number {
  return attachments.filter((attachment) => {
    return attachment.kind === 'uploaded' && isChatParseDocumentFile(attachment.name)
  }).length
}

export function planLocalFilesForUpload(selectedFiles: File[], attachments: ChatAttachment[] = []) {
  let remainingDocumentSlots = Math.max(0, MAX_LOCAL_DOCUMENT_ATTACHMENTS - countParsedLocalFiles(attachments))
  let exceededParsedLimit = false

  const filesToUpload = selectedFiles.filter((file) => {
    if (!isChatParseDocumentFile(file.name)) {
      return true
    }

    if (remainingDocumentSlots <= 0) {
      exceededParsedLimit = true
      return false
    }

    remainingDocumentSlots -= 1
    return true
  })

  return {
    filesToUpload,
    exceededParsedLimit,
  }
}
