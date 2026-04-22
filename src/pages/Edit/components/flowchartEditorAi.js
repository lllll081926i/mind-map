import { isDesktopApp } from '@/platform'
import { normalizeFlowchartAiResult } from '@/services/flowchartDocument'
import {
  buildAiCreateFlowchartMessages,
  checkAiAvailability,
  requestAiStream
} from '@/services/aiService'

export const flowchartAiMethods = {
  async generateWithAi() {
    if (this.isGenerating) return
    let prompt
    try {
      const result = await this.$prompt(
        this.$t('flowchart.aiPromptMessage'),
        this.$t('flowchart.aiPromptTitle'),
        {
          inputPlaceholder: this.$t('flowchart.aiPromptPlaceholder')
        }
      )
      prompt = String(result.value || '').trim()
    } catch (_error) {
      return
    }
    if (!prompt) return
    try {
      await checkAiAvailability({
        aiConfig: this.aiConfig,
        t: this.$t,
        desktop: isDesktopApp()
      })
    } catch (error) {
      this.$message.error(error?.message || this.$t('ai.connectFailed'))
      return
    }
    this.aiBuffer = ''
    this.isGenerating = true
    this.$message.info(this.$t('flowchart.aiGenerating'))
    requestAiStream({
      aiConfig: this.aiConfig,
      messages: buildAiCreateFlowchartMessages({
        input: prompt,
        t: this.$t
      }),
      progress: chunk => {
        this.aiBuffer += String(chunk || '')
      },
      end: () => {
        try {
          const result = normalizeFlowchartAiResult(this.aiBuffer)
          this.applyGeneratedFlowchart(result)
          this.$message.success(this.$t('flowchart.aiGenerated'))
        } catch (error) {
          this.$message.error(error?.message || this.$t('ai.generationFailed'))
        } finally {
          this.isGenerating = false
        }
      },
      error: error => {
        this.isGenerating = false
        this.$message.error(error?.message || this.$t('ai.generationFailed'))
      }
    })
  }
}
