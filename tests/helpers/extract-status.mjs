export function isFinishedExtractJobStatus(status) {
  return status === "extracting_done" || status.startsWith("skip_")
}
