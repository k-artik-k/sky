/** Fire a toast message. The Toast component listens for this event. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("archive:toast", { detail: message }));
}
