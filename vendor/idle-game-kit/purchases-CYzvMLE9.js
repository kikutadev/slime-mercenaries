//#region src/application/presentation-queue.ts
function e(e, t) {
	let n = [...e];
	for (let e of t) {
		let t = e.presentationCoalescingKey, r = -1;
		if (t !== void 0 && (r = n.findIndex((e) => e.presentationCoalescingKey === t), r >= 0)) {
			let i = r === 0;
			if (n = n.filter((e) => e.presentationCoalescingKey !== t), i) {
				n = [e, ...n];
				continue;
			}
		}
		if (e.presentationPreemption !== void 0 && n.length > 0 && e.presentationPriority > n[0].presentationPriority) {
			n = e.presentationPreemption === "discard-current" ? [e, ...n.slice(1)] : [e, ...n];
			continue;
		}
		if (r > 0) {
			n.splice(Math.min(r, n.length), 0, e);
			continue;
		}
		n.push(e);
	}
	return n;
}
function t(e) {
	return e.length === 0 ? e : e.slice(1);
}
//#endregion
//#region src/application/purchases.ts
function n() {
	return {
		entitlements: {},
		processedTransactions: {}
	};
}
function r(e, t) {
	return e.entitlements[t] !== void 0;
}
function i(e) {
	if (s(e.definition), !c(e.transaction) || e.transaction.productId !== e.definition.productId) return {
		accepted: !1,
		state: e.state,
		reason: "product-mismatch"
	};
	let t = e.state.processedTransactions[e.transaction.transactionId];
	if (t !== void 0) return t.productId !== e.definition.productId || t.entitlementId !== e.definition.entitlementId ? {
		accepted: !1,
		state: e.state,
		reason: "transaction-id-conflict"
	} : {
		accepted: !0,
		state: e.state,
		commit: "already-granted"
	};
	let n = e.state.entitlements[e.definition.entitlementId];
	return {
		accepted: !0,
		state: {
			entitlements: n === void 0 ? {
				...e.state.entitlements,
				[e.definition.entitlementId]: {
					productId: e.definition.productId,
					firstTransactionId: e.transaction.transactionId
				}
			} : e.state.entitlements,
			processedTransactions: {
				...e.state.processedTransactions,
				[e.transaction.transactionId]: {
					productId: e.definition.productId,
					entitlementId: e.definition.entitlementId
				}
			}
		},
		commit: n === void 0 ? "granted" : "already-granted"
	};
}
async function a(e) {
	s(e.definition);
	let t;
	try {
		t = await e.provider.purchase(e.definition.productId);
	} catch {
		return { status: "error" };
	}
	if (t.status !== "purchased") return { status: t.status };
	let n = t.transaction;
	if (!c(n) || n.productId !== e.definition.productId) return { status: "error" };
	let r;
	try {
		r = await e.commitTransaction(n, e.definition);
	} catch {
		return { status: "error" };
	}
	if (r === "rejected") return { status: "rejected" };
	try {
		await e.provider.finishTransaction(n.transactionId);
	} catch {
		return {
			status: "granted-pending-provider-completion",
			transactionId: n.transactionId,
			commit: r
		};
	}
	return {
		status: r,
		transactionId: n.transactionId
	};
}
async function o(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.definitions) {
		if (s(n), t.has(n.productId)) throw RangeError(`Duplicate purchase product ID: ${n.productId}`);
		t.set(n.productId, n);
	}
	let n;
	try {
		n = await e.provider.restore();
	} catch {
		return { status: "error" };
	}
	if (n.status !== "restored") return { status: n.status };
	let r = 0, i = 0, a = 0, o = 0, l = /* @__PURE__ */ new Set();
	for (let s of n.transactions) {
		if (!c(s)) return { status: "error" };
		if (l.has(s.transactionId)) continue;
		l.add(s.transactionId);
		let n = t.get(s.productId);
		if (n === void 0) continue;
		let u;
		try {
			u = await e.commitTransaction(s, n);
		} catch {
			return { status: "error" };
		}
		if (u === "rejected") {
			a += 1;
			continue;
		}
		u === "granted" ? r += 1 : i += 1;
		try {
			await e.provider.finishTransaction(s.transactionId);
		} catch {
			o += 1;
		}
	}
	return {
		status: "restored",
		grantedCount: r,
		alreadyGrantedCount: i,
		rejectedCount: a,
		providerCompletionPendingCount: o
	};
}
function s(e) {
	if (e.productId.trim().length === 0) throw RangeError("Purchase product ID must not be empty.");
	if (e.entitlementId.trim().length === 0) throw RangeError(`Purchase entitlement ID must not be empty: ${e.productId}`);
}
function c(e) {
	return e.transactionId.trim().length > 0 && e.transactionId.length <= 512 && e.productId.trim().length > 0 && e.productId.length <= 256;
}
//#endregion
export { a, o as i, n, t as o, r, e as s, i as t };
