// The shop's follow-up on a piece of feedback. Kept apart from lib/feedback.ts
// (which talks to the database) so the admin page's buttons can use it too.

export type FeedbackStatus = "new" | "followed_up" | "resolved";

export const FEEDBACK_STATUSES: { key: FeedbackStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "followed_up", label: "Followed up" },
  { key: "resolved", label: "Resolved" },
];
