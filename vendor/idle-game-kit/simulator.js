//#region simulator/analysis.ts
function e(e) {
	let t = [];
	for (let n = 1; n < e.length; n += 1) {
		let r = e[n - 1], i = e[n];
		r !== void 0 && i !== void 0 && t.push({
			fromMilestoneId: r.id,
			toMilestoneId: i.id,
			durationSec: i.simTimeSec - r.simTimeSec
		});
	}
	return t;
}
function t(e) {
	let t = e.filter((e) => e.classification === "no-action");
	return {
		totalDurationSec: t.reduce((e, t) => e + t.durationSec, 0),
		maxWindowSec: t.reduce((e, t) => Math.max(e, t.durationSec), 0),
		windows: t
	};
}
function n(t) {
	if (t.length === 0) return [];
	let n = /* @__PURE__ */ new Map();
	for (let r of t) for (let t of e(r.milestoneHits)) {
		let e = `${t.fromMilestoneId}->${t.toMilestoneId}`, r = n.get(e);
		r === void 0 ? n.set(e, {
			fromMilestoneId: t.fromMilestoneId,
			toMilestoneId: t.toMilestoneId,
			waits: [t.durationSec]
		}) : r.waits.push(t.durationSec);
	}
	return [...n.entries()].map(([e, n]) => {
		let i = n.waits.toSorted((e, t) => e - t);
		return {
			id: e,
			fromMilestoneId: n.fromMilestoneId,
			toMilestoneId: n.toMilestoneId,
			totalRuns: t.length,
			reachedRuns: i.length,
			stuckProbability: 1 - i.length / t.length,
			p50WaitSec: r(i, .5),
			p90WaitSec: r(i, .9),
			maxWaitSec: i.at(-1) ?? 0
		};
	});
}
function r(e, t) {
	if (e.length === 0) return 0;
	if (e.length === 1) return e[0];
	let n = (e.length - 1) * t, r = Math.floor(n), i = Math.ceil(n), a = e[r], o = e[i];
	return r === i ? a : a + (o - a) * (n - r);
}
//#endregion
//#region simulator/runner.ts
function i(e) {
	if (!Number.isSafeInteger(e.maxSimTimeSec) || e.maxSimTimeSec < 0) throw RangeError("maxSimTimeSec must be a non-negative safe integer.");
	let t = e.maxSteps ?? 1e4;
	if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("maxSteps must be a positive safe integer.");
	let n = e.initialState, r = 0, i = [], a = [], o = [], s = /* @__PURE__ */ new Set();
	for (c(n); r < t;) {
		let t = e.adapter.getSimTimeSec(n);
		if (t >= e.maxSimTimeSec) return l("max-sim-time", n);
		let a = e.policy.chooseAction(n);
		if (r += 1, a.kind === "stop") return l(a.reason, n);
		if (a.kind === "command") {
			let t = e.adapter.executeCommand(n, a.command);
			if (!t.accepted) return l(`command-rejected:${t.reason}`, n);
			n = t.state, i.push(...t.events), c(n);
			continue;
		}
		if (!Number.isSafeInteger(a.simTimeSec) || a.simTimeSec <= t) throw RangeError("wait-until must target a safe integer after the current sim time.");
		let s = Math.min(a.simTimeSec, e.maxSimTimeSec);
		o.push({
			fromSimTimeSec: t,
			toSimTimeSec: s,
			durationSec: s - t,
			reason: a.reason,
			classification: a.classification
		});
		let u = e.adapter.advanceTo(n, s);
		n = u.state, i.push(...u.events), c(n);
	}
	return l("max-steps", n);
	function c(t) {
		for (let n of e.milestones ?? []) !s.has(n.id) && n.reached(t) && (s.add(n.id), a.push({
			id: n.id,
			simTimeSec: e.adapter.getSimTimeSec(t)
		}));
	}
	function l(e, t) {
		return {
			finalState: t,
			stopReason: e,
			steps: r,
			milestoneHits: a,
			waitWindows: o,
			events: i
		};
	}
}
//#endregion
//#region simulator/sweep.ts
function a(e) {
	let t = Object.entries(e);
	if (t.length === 0) throw RangeError("Parameter grid requires at least one axis.");
	for (let [e, n] of t) if (n.length === 0) throw RangeError(`Parameter axis ${e} requires at least one value.`);
	let n = [{}];
	for (let [e, r] of t) n = n.flatMap((t) => r.map((n) => ({
		...t,
		[e]: n
	})));
	return n;
}
function o(e, t) {
	if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("sampleCount must be a positive safe integer.");
	if (e.length <= t) return [...e];
	if (t === 1) return [e[0]];
	let n = [], r = /* @__PURE__ */ new Set();
	for (let n = 0; n < t; n += 1) r.add(Math.round(n * (e.length - 1) / (t - 1)));
	for (let t of r) n.push(e[t]);
	return n;
}
function s(e) {
	return e.cases.map((t) => ({
		parameters: t,
		metric: e.evaluate(t)
	}));
}
//#endregion
//#region simulator/targets.ts
function c(e, t) {
	return f(e), e.map((e) => {
		let n = d(e), r = u(e, t);
		if (r === null || !Number.isFinite(r)) return {
			target: e,
			status: "missing",
			observed: null,
			...n
		};
		let i = n.expectedMin === null || r >= n.expectedMin, a = n.expectedMax === null || r <= n.expectedMax;
		return {
			target: e,
			status: i && a ? "pass" : "fail",
			observed: r,
			...n
		};
	});
}
function l(e) {
	return e.filter((e) => e.status !== "pass");
}
function u(e, t) {
	switch (e.kind) {
		case "milestone-time": return t.milestoneTimeSec(e.profileId, e.milestoneId, e.percentile);
		case "max-no-action-window": return t.maxNoActionWindowSec(e.profileId, e.percentile);
		case "wall-wait": return t.wallP90WaitSec(e.profileId, e.phaseId);
		case "wall-stuck-probability": return t.wallStuckProbability(e.profileId, e.phaseId);
		case "ad-dependency-ratio": {
			let n = t.milestoneTimeSec(e.baselineProfileId, e.milestoneId, e.percentile), r = t.milestoneTimeSec(e.acceleratedProfileId, e.milestoneId, e.percentile);
			return n === null || r === null || r <= 0 ? null : n / r;
		}
	}
}
function d(e) {
	switch (e.kind) {
		case "milestone-time": return {
			expectedMin: e.minSec ?? null,
			expectedMax: e.maxSec ?? null
		};
		case "max-no-action-window":
		case "wall-wait": return {
			expectedMin: null,
			expectedMax: e.maxSec
		};
		case "wall-stuck-probability": return {
			expectedMin: null,
			expectedMax: e.maxProbability
		};
		case "ad-dependency-ratio": return {
			expectedMin: e.minRatio ?? null,
			expectedMax: e.maxRatio ?? null
		};
	}
}
function f(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		if (n.id.length === 0) throw RangeError("Balance target ID must not be empty.");
		if (t.has(n.id)) throw RangeError(`Duplicate balance target ID: ${n.id}`);
		t.add(n.id);
		let e = d(n);
		if (e.expectedMin !== null && (!Number.isFinite(e.expectedMin) || e.expectedMin < 0)) throw RangeError(`Balance target minimum must be finite and non-negative: ${n.id}`);
		if (e.expectedMax !== null && (!Number.isFinite(e.expectedMax) || e.expectedMax < 0)) throw RangeError(`Balance target maximum must be finite and non-negative: ${n.id}`);
		if (e.expectedMin !== null && e.expectedMax !== null && e.expectedMin > e.expectedMax) throw RangeError(`Balance target minimum exceeds maximum: ${n.id}`);
		if (n.kind === "wall-stuck-probability" && n.maxProbability > 1) throw RangeError(`Wall stuck probability target must be <= 1: ${n.id}`);
	}
}
//#endregion
//#region simulator/reward-cadence.ts
function p(e) {
	S(e.sessionStartSimTimeSec, e.sessionEndSimTimeSec);
	let t = h(e.rewardBeats, e.sessionStartSimTimeSec, e.sessionEndSimTimeSec), n = g(e.anticipationWindows ?? [], e.sessionStartSimTimeSec, e.sessionEndSimTimeSec), r = e.sessionEndSimTimeSec - e.sessionStartSimTimeSec, i = [...new Set(t.map((e) => e.simTimeSec))], a = [...new Set(t.filter((e) => e.tier !== "micro").map((e) => e.simTimeSec))], o = y(i), s = y(a), c = m(e.sessionStartSimTimeSec, e.sessionEndSimTimeSec, i), l = m(e.sessionStartSimTimeSec, e.sessionEndSimTimeSec, a), u = t.filter((e) => e.tier !== "micro").length, d = t.filter((e) => e.surprise).length, f = t.filter((e) => e.tier !== "micro" && e.surprise).length, p = t.filter((e) => e.tier === "major" && e.surprise).length, C = t.filter((e) => e.nextExpectationCreated).length, w = t.filter((e) => _(e, n)).length, T = t.filter((e) => e.tier !== "micro" && _(e, n)).length, E = t.filter((e) => e.tier === "major").length, D = t.filter((e) => e.tier === "major" && _(e, n)).length, O = t.length - C;
	return {
		sessionDurationSec: r,
		rewardCount: t.length,
		meaningfulRewardCount: u,
		majorRewardCount: E,
		surpriseRewardCount: d,
		meaningfulSurpriseRewardCount: f,
		majorSurpriseRewardCount: p,
		anticipatedRewardCount: w,
		anticipatedMeaningfulRewardCount: T,
		anticipatedMajorRewardCount: D,
		deadEndRewardCount: O,
		rewardRatePerMinute: r === 0 ? 0 : t.length * 60 / r,
		meaningfulRewardRatePerMinute: r === 0 ? 0 : u * 60 / r,
		averageRewardIntervalSec: b(o),
		p90RewardIntervalSec: x(o, .9),
		averageMeaningfulRewardIntervalSec: b(s),
		p90MeaningfulRewardIntervalSec: x(s, .9),
		firstRewardDelaySec: i[0] === void 0 ? r : i[0] - e.sessionStartSimTimeSec,
		firstMeaningfulRewardDelaySec: a[0] === void 0 ? r : a[0] - e.sessionStartSimTimeSec,
		maxRewardDroughtSec: c.reduce((e, t) => Math.max(e, t.durationSec), 0),
		maxMeaningfulRewardDroughtSec: l.reduce((e, t) => Math.max(e, t.durationSec), 0),
		anticipationCoverage: r === 0 ? 0 : v(n) / r,
		anticipatedRewardRate: t.length === 0 ? 0 : w / t.length,
		anticipatedMeaningfulRewardRate: u === 0 ? 0 : T / u,
		anticipatedMajorRewardRate: E === 0 ? 0 : D / E,
		surpriseRate: t.length === 0 ? 0 : d / t.length,
		meaningfulSurpriseRate: u === 0 ? 0 : f / u,
		majorSurpriseRate: E === 0 ? 0 : p / E,
		nextExpectationRate: t.length === 0 ? 0 : C / t.length,
		deadEndRewardRate: t.length === 0 ? 0 : O / t.length,
		droughtWindows: c
	};
}
function m(e, t, n) {
	S(e, t);
	let r = [...new Set(n)].toSorted((e, t) => e - t);
	for (let n of r) C(n, e, t, "reward time");
	let i = [
		e,
		...r,
		t
	], a = [];
	for (let e = 1; e < i.length; e += 1) {
		let t = i[e - 1], n = i[e];
		a.push({
			fromSimTimeSec: t,
			toSimTimeSec: n,
			durationSec: n - t
		});
	}
	return a;
}
function h(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		if (i.id.length === 0) throw RangeError("Reward beat ID must not be empty.");
		if (r.has(i.id)) throw RangeError(`Duplicate reward beat ID: ${i.id}`);
		if (i.anticipationKey !== void 0 && i.anticipationKey.length === 0) throw RangeError(`Reward beat anticipation key must not be empty: ${i.id}`);
		r.add(i.id), C(i.simTimeSec, t, n, `Reward beat ${i.id}`);
	}
	return e.toSorted((e, t) => e.simTimeSec - t.simTimeSec || e.id.localeCompare(t.id));
}
function g(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		if (i.id.length === 0) throw RangeError("Anticipation window ID must not be empty.");
		if (r.has(i.id)) throw RangeError(`Duplicate anticipation window ID: ${i.id}`);
		if (i.anticipationKey.length === 0) throw RangeError(`Anticipation key must not be empty: ${i.id}`);
		if (r.add(i.id), C(i.fromSimTimeSec, t, n, `Anticipation window ${i.id} start`), C(i.toSimTimeSec, t, n, `Anticipation window ${i.id} end`), i.toSimTimeSec < i.fromSimTimeSec) throw RangeError(`Anticipation window must not end before it starts: ${i.id}`);
	}
	return e.toSorted((e, t) => e.fromSimTimeSec - t.fromSimTimeSec || e.toSimTimeSec - t.toSimTimeSec);
}
function _(e, t) {
	return e.anticipationKey !== void 0 && t.some((t) => t.anticipationKey === e.anticipationKey && t.fromSimTimeSec < e.simTimeSec && e.simTimeSec <= t.toSimTimeSec);
}
function v(e) {
	if (e.length === 0) return 0;
	let t = 0, n = e[0].fromSimTimeSec, r = e[0].toSimTimeSec;
	for (let i = 1; i < e.length; i += 1) {
		let a = e[i];
		if (a.fromSimTimeSec <= r) {
			r = Math.max(r, a.toSimTimeSec);
			continue;
		}
		t += r - n, n = a.fromSimTimeSec, r = a.toSimTimeSec;
	}
	return t + r - n;
}
function y(e) {
	let t = [];
	for (let n = 1; n < e.length; n += 1) t.push(e[n] - e[n - 1]);
	return t;
}
function b(e) {
	return e.length === 0 ? 0 : e.reduce((e, t) => e + t, 0) / e.length;
}
function x(e, t) {
	if (e.length === 0) return 0;
	let n = e.toSorted((e, t) => e - t);
	if (n.length === 1) return n[0];
	let r = (n.length - 1) * t, i = Math.floor(r), a = Math.ceil(r), o = n[i], s = n[a];
	return i === a ? o : o + (s - o) * (r - i);
}
function S(e, t) {
	if (w(e, "sessionStartSimTimeSec"), w(t, "sessionEndSimTimeSec"), t < e) throw RangeError("sessionEndSimTimeSec must be >= sessionStartSimTimeSec.");
}
function C(e, t, n, r) {
	if (w(e, r), e < t || e > n) throw RangeError(`${r} must be inside the session interval.`);
}
function w(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
//#endregion
export { e as calculateMilestoneWaits, m as calculateRewardDroughtWindows, a as createParameterGrid, c as evaluateBalanceTargets, l as failedBalanceTargets, s as runParameterSweep, i as runSimulation, o as sampleParameterCases, n as summarizeMilestoneWallPhases, t as summarizeNoActionWindows, p as summarizeRewardCadence };
