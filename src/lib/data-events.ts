const DATA_CHANGED_EVENT = "mawthuq:data-changed";

export function emitDataChanged(resource: string) {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail: { resource } }));
}

export function subscribeToDataChanged(onChange: () => void) {
  const listener = () => onChange();
  window.addEventListener(DATA_CHANGED_EVENT, listener);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, listener);
}
