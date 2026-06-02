export function openModal(backdrop) {
  backdrop?.classList.remove("hidden");
}

export function closeModal(backdrop) {
  backdrop?.classList.add("hidden");
}
