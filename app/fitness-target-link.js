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

  function resolveTargetId({ workout, targets, activeCycle, userId }) {
    if (!userId) throw new Error("Cannot link a fitness target without the current user");
    if (!workout?.workout_date || !workout?.plan_type || !workout?.exercise_key) {
      throw new Error("Cannot link a fitness target without date, plan, and exercise key");
    }

    if (isUuid(workout.target_id)) {
      const existing = targets.filter((target) =>
        target.id === workout.target_id && targetMatchesWorkout(target, workout, userId)
      );
      if (existing.length === 1) return existing[0].id;
      throw new Error(`Existing target does not match ${workout.plan_type} / ${workout.exercise_key}`);
    }

    if (!activeCycle || activeCycle.user_id !== userId || activeCycle.domain !== "fitness" || activeCycle.status !== "active") {
      throw new Error("No active Jessica Fitness cycle is available");
    }

    const candidates = targets.filter((target) =>
      target.active === true &&
      target.review_cycle_id === activeCycle.id &&
      targetMatchesWorkout(target, workout, userId)
    );
    if (candidates.length !== 1) {
      throw new Error(`Expected one target for ${workout.plan_type} / ${workout.exercise_key}; found ${candidates.length}`);
    }
    return candidates[0].id;
  }

  return { isUuid, resolveTargetId };
});
