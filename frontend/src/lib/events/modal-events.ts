export const OPEN_ADD_MEMBER_EVENT = "sportium:open-add-member";

export function triggerOpenAddMemberModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_ADD_MEMBER_EVENT));
  }
}
