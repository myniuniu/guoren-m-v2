import type { ChatAttachment } from './types'

export interface ChatAttachmentPayload {
  completedFiles: ChatAttachment[]
  uploadedFiles: Array<{
    resource_id: string
    file_name: string
    url: string
  }>
  resourceIds: string[]
}

export function buildChatAttachmentPayload(files: ChatAttachment[] = []): ChatAttachmentPayload {
  const completedFiles = files.filter((file) => file.status === 'completed')
  const uploadedFiles: ChatAttachmentPayload['uploadedFiles'] = []
  const resourceIds: string[] = []

  completedFiles.forEach((file) => {
    if (file.kind === 'resource') {
      if (file.resourceId) {
        resourceIds.push(file.resourceId)
      }
      return
    }

    if (!file.resourceId || !file.url) {
      return
    }

    uploadedFiles.push({
      resource_id: file.resourceId,
      file_name: file.name,
      url: file.url,
    })
  })

  return {
    completedFiles,
    uploadedFiles,
    resourceIds,
  }
}
