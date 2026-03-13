import { toPlainArray, uniqueStrings } from "@/lib/school2/helpers";

export function filterToolCatalog(input: {
  school: any;
  tools: any[];
  schoolTools: any[];
  recommendations: any[];
  canViewInternal?: boolean;
}) {
  const enabledToolIds = new Set(input.schoolTools.filter((item) => item.enabled).map((item) => item.toolId));
  const recommendedToolIds = new Set(input.recommendations.map((item) => item.toolId));
  const outcomes = toPlainArray(input.school?.priorityOutcomes).join(" ").toLowerCase();

  const visible = input.tools.filter((tool) => {
    if (input.canViewInternal) return true;
    if (enabledToolIds.has(tool.id)) return true;
    if (recommendedToolIds.has(tool.id)) return true;
    if (tool.visibility === "SCHOOL_VISIBLE") return true;
    if (tool.visibility === "RECOMMENDABLE" && (outcomes.includes("ai") || outcomes.includes("project") || outcomes.includes("support"))) {
      return true;
    }
    return false;
  });

  const recommended = visible.filter((tool) => recommendedToolIds.has(tool.id));
  const enabled = visible.filter((tool) => enabledToolIds.has(tool.id));
  const discover = visible.filter((tool) => !enabledToolIds.has(tool.id) && !recommendedToolIds.has(tool.id));

  return {
    enabled,
    recommended,
    discover,
    categories: uniqueStrings(visible.map((tool) => tool.category || "General"))
  };
}
