(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FitnessTargetLink = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }

  function targetMatchesWorkout(target, workout, userId) {
    return target.user_id === userId &&
      target.plan_type === workout.plan_type &&
      target.exercise_key === workout.exercise_key &&
      String(target.effective_from || "0000-00-00").slice(0, 10) <= workout.workout_date;
  }

  function requireOneActiveCycle({ activeCycle, activeCycles, userId }) {
    const cycles = activeCycles || (activeCycle ? [activeCycle] : []);
    const matches = cycles.filter((cycle) =>
      cycle?.user_id === userId &&
      cycle.domain === "fitness" &&
      cycle.status === "active"
    );
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one active Jessica Fitness cycle; found ${matches.length}. Refresh before saving.`);
    }
    return matches[0];
  }

  function resolveTargetId({ workout, targets, activeCycle, activeCycles, userId }) {
    if (!userId) throw new Error("Cannot link a fitness target without the current user");
    if (!workout?.workout_date || !workout?.plan_type || !workout?.exercise_key) {
      throw new Error("Cannot link a fitness target without date, plan, and exercise key");
    }

    const currentCycle = requireOneActiveCycle({ activeCycle, activeCycles, userId });
    const candidates = targets.filter((target) =>
      target.active === true &&
      target.review_cycle_id === currentCycle.id &&
      targetMatchesWorkout(target, workout, userId)
    );
    if (candidates.length !== 1) {
      throw new Error(`Expected one active target for ${workout.plan_type} / ${workout.exercise_key}; found ${candidates.length}. Refresh before saving.`);
    }

    if (isUuid(workout.target_id)) {
      if (workout.target_id === candidates[0].id) return workout.target_id;
      throw new Error(`Stale or inactive target for ${workout.plan_type} / ${workout.exercise_key}. Refresh before saving.`);
    }

    return candidates[0].id;
  }

  function selectActiveTargetsForPlan({ targets, activeCycle, userId, plan }) {
    if (!activeCycle || !userId || !["Plan A", "Plan B"].includes(plan)) return [];
    if (
      activeCycle.user_id !== userId ||
      activeCycle.domain !== "fitness" ||
      activeCycle.status !== "active"
    ) return [];

    const matches = targets
      .filter((target) =>
        target.active === true &&
        target.user_id === userId &&
        target.review_cycle_id === activeCycle.id &&
        target.plan_type === plan
      )
      .sort((a, b) => Number(a.sort_order || 100) - Number(b.sort_order || 100));
    const keys = matches.map((target) => target.exercise_key);
    if (new Set(keys).size !== keys.length) return [];
    return matches;
  }

  function validateWorkoutBatch({ workouts, targets, activeCycle, activeCycles, userId }) {
    if (!Array.isArray(workouts) || !workouts.length) {
      throw new Error("A trained day requires at least one completed workout");
    }
    const currentCycle = requireOneActiveCycle({ activeCycle, activeCycles, userId });
    const planTypes = new Set(workouts.map((workout) => workout.plan_type));
    if (planTypes.size !== 1) throw new Error("All workouts in one save must use the same Plan");
    const exerciseKeys = workouts.map((workout) => workout.exercise_key);
    if (new Set(exerciseKeys).size !== exerciseKeys.length) {
      throw new Error("A workout batch cannot contain duplicate exercise keys");
    }
    const targetIds = workouts.map((workout) => resolveTargetId({
      workout,
      targets,
      activeCycle: currentCycle,
      userId
    }));
    const targetCycles = new Set(targetIds.map((id) => targets.find((target) => target.id === id)?.review_cycle_id));
    if (targetCycles.size !== 1 || !targetCycles.has(currentCycle.id)) {
      throw new Error("All workouts must reference active targets from the same active Fitness cycle");
    }
    return { cycleId: currentCycle.id, targetIds };
  }

  return { isUuid, requireOneActiveCycle, resolveTargetId, selectActiveTargetsForPlan, validateWorkoutBatch };
});
