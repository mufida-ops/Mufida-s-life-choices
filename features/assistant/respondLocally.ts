import type { Project, ResurfacingCandidate } from '../../types/models';

export type AssistantReply =
  | { kind: 'right_now'; text: string; items: ResurfacingCandidate[] }
  | { kind: 'project'; text: string; project: Project }
  | { kind: 'plain'; text: string };

const FORGETTING_RE = /\b(forgetting|what should i do|what'?s on|what do i need to do)\b/i;

/**
 * Local, deterministic stand-in for the Ask screen's assistant while the real Claude-backed
 * `ai-chat` edge function (Phase 3) is not wired up yet. It answers the two example
 * interactions from spec section 11 for real — retrieving actual resurfacing candidates and
 * actual project state, never a canned response — everything else is handled by the Home
 * capture pipeline instead of pretending to be a general conversation.
 */
export function respondLocally(
  message: string,
  context: { projects: Project[]; getRightNow: () => ResurfacingCandidate[] }
): AssistantReply {
  if (FORGETTING_RE.test(message)) {
    const items = context.getRightNow();
    return {
      kind: 'right_now',
      text: items.length ? "Here's what's worth your attention:" : "Nothing's waiting for you right now.",
      items,
    };
  }

  const matchedProject = context.projects.find(
    (project) =>
      project.status === 'active' &&
      (message.toLowerCase().includes(project.title.toLowerCase()) ||
        project.title.toLowerCase().split(' ').some((word) => word.length > 3 && message.toLowerCase().includes(word)))
  );

  if (matchedProject) {
    const text = matchedProject.where_left_off
      ? `You're still working on your ${matchedProject.title.toLowerCase()}. ${matchedProject.where_left_off}.`
      : `You're still working on ${matchedProject.title}.`;
    return { kind: 'project', text, project: matchedProject };
  }

  return {
    kind: 'plain',
    text: "I've saved that as a capture. Full conversation with memory and structured actions arrives in Phase 3 — for now, check My Things.",
  };
}
