import { type QuestLogRow } from '@/logic/dailyQuests';
import { formatMetric, metricLabel, nextUnmetMoneyTarget } from '@/logic/verification';
import { type RcOverview } from '@/integrations/revenuecat';
import { stats } from '@/theme/tokens';

/**
 * The data-aware "why this quest" line (SPEC #2). Grounds each quest in the
 * founder's real state — the active chapter, the streak, and (when RevenueCat
 * is connected) the live gap to the nearest revenue target — so quests read as
 * chosen for a reason, not tapped-for-a-badge.
 */
export function questContext(
  quest: QuestLogRow,
  ctx: { activeChapterTitle?: string; overview: RcOverview | null }
): string {
  if (quest.slot === 'chain') return 'Unlocked — finish the follow-through';
  if (quest.slot === 'chapter' && ctx.activeChapterTitle) {
    return `Toward: ${ctx.activeChapterTitle}`;
  }
  if (quest.slot === 'habit') return 'Daily habit — keep the streak alive';

  // weakest-stat slot: tie money-stat quests to the live milestone gap.
  if ((quest.stat === 'revenue' || quest.stat === 'finance') && ctx.overview) {
    const target = nextUnmetMoneyTarget(ctx.overview);
    if (target?.chapter.verify) {
      return `${formatMetric(target.chapter.verify.metric, target.gap)} ${metricLabel(
        target.chapter.verify.metric
      )} from ${target.chapter.title}`;
    }
  }
  return `Grows your ${stats[quest.stat].label}`;
}
