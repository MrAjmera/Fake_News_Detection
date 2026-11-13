import { copyText, downloadJSON, summarise } from '../lib/resultActions'
import { useToast } from '../lib/toast'

export default function ResultActions({ result, text }) {
  const toast = useToast()

  async function onCopy() {
    const ok = await copyText(summarise(result))
    toast(ok ? 'Result copied to clipboard' : 'Could not copy. Select the text manually.', ok ? 'success' : 'error')
  }

  function onExport() {
    downloadJSON('fake-news-result.json', {
      exported_at: new Date().toISOString(),
      text,
      result,
    })
    toast('Result exported as JSON', 'success')
  }

  return (
    <div className="result-actions">
      <button type="button" className="btn-secondary" onClick={onCopy}>
        Copy result
      </button>
      <button type="button" className="btn-secondary" onClick={onExport}>
        Export JSON
      </button>
    </div>
  )
}
