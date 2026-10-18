import { analyzePortfolio } from "./portfolioService";
import type { AnalyticsResult } from "./portfolioService";

export type AnalyticsTaskState =
    | { status: "running" }
    | { status: "completed"; result: AnalyticsResult }
    | { status: "failed"; message: string };

type ActiveTask = {
    generation: number;
    promise: Promise<AnalyticsResult>;
};

const activeTasks = new Map<number, ActiveTask>();
const taskStates = new Map<number, AnalyticsTaskState>();
const generations = new Map<number, number>();
const listeners = new Map<number, Set<(state: AnalyticsTaskState) => void>>();

function publish(portfolioId: number, state: AnalyticsTaskState) {
    taskStates.set(portfolioId, state);
    listeners.get(portfolioId)?.forEach((listener) => listener(state));
}

export function subscribeToAnalyticsTask(
    portfolioId: number,
    listener: (state: AnalyticsTaskState) => void,
) {
    const portfolioListeners = listeners.get(portfolioId) ?? new Set();
    portfolioListeners.add(listener);
    listeners.set(portfolioId, portfolioListeners);

    const currentState = taskStates.get(portfolioId);
    if (currentState) listener(currentState);

    return () => {
        portfolioListeners.delete(listener);
        if (portfolioListeners.size === 0) listeners.delete(portfolioId);
    };
}

export function startOrJoinAnalyticsTask(portfolioId: number): Promise<AnalyticsResult> {
    const generation = generations.get(portfolioId) ?? 0;
    const activeTask = activeTasks.get(portfolioId);
    if (activeTask?.generation === generation) return activeTask.promise;

    publish(portfolioId, { status: "running" });

    const task = analyzePortfolio(portfolioId)
        .then((result) => {
            if ((generations.get(portfolioId) ?? 0) === generation) {
                try {
                    sessionStorage.setItem(`analytics_${portfolioId}`, JSON.stringify(result));
                } catch (error) {
                    console.error("Unable to cache portfolio analytics:", error);
                }
                publish(portfolioId, { status: "completed", result });
            }
            return result;
        })
        .catch((error: unknown) => {
            if ((generations.get(portfolioId) ?? 0) === generation) {
                publish(portfolioId, {
                    status: "failed",
                    message: error instanceof Error ? error.message : "Portfolio analysis failed.",
                });
            }
            throw error;
        });

    activeTasks.set(portfolioId, { generation, promise: task });
    const clearActiveTask = () => {
        if (activeTasks.get(portfolioId)?.promise === task) activeTasks.delete(portfolioId);
    };
    void task.then(clearActiveTask, clearActiveTask);
    return task;
}

export function clearAnalyticsTask(portfolioId: number) {
    generations.set(portfolioId, (generations.get(portfolioId) ?? 0) + 1);
    activeTasks.delete(portfolioId);
    taskStates.delete(portfolioId);
    try {
        sessionStorage.removeItem(`analytics_${portfolioId}`);
    } catch (error) {
        console.error("Unable to clear cached portfolio analytics:", error);
    }
}
