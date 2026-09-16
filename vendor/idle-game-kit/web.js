//#region src/platform/web/better-auth-browser-client.ts
var e = class {
	#e;
	#t;
	constructor(e = {}) {
		this.#e = t(e.authBaseUrl ?? "/api/auth"), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async getSession() {
		try {
			let e = await this.#t(`${this.#e}/get-session`, {
				method: "GET",
				credentials: "include",
				headers: { accept: "application/json" }
			});
			return e.ok ? n(await e.json()) : null;
		} catch {
			return null;
		}
	}
	async signInWithSocial(e, t) {
		try {
			let n = await this.#n("/sign-in/social", {
				provider: e,
				...t === void 0 ? {} : { callbackURL: t },
				disableRedirect: !0
			});
			if (!n.ok) return i(n);
			let r = await n.json();
			return !o(r) || typeof r.url != "string" || !s(r.url) ? {
				status: "error",
				code: "provider-error"
			} : {
				status: "redirect",
				url: r.url
			};
		} catch {
			return { status: "unavailable" };
		}
	}
	async signOut() {
		try {
			await this.#n("/sign-out", {});
		} catch {}
	}
	#n(e, t) {
		return this.#t(`${this.#e}${e}`, {
			method: "POST",
			credentials: "include",
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			},
			body: JSON.stringify(t)
		});
	}
};
function t(e) {
	let t = e.trim();
	if (t === "") throw Error("Auth base URL must not be empty.");
	return t.endsWith("/") ? t.slice(0, -1) : t;
}
function n(e) {
	if (!o(e) || !o(e.user) || !o(e.session)) return null;
	let t = e.user.accountId;
	if (typeof t != "string" || t.length === 0) return null;
	let n = r(e.session.expiresAt);
	return n === void 0 ? null : {
		principal: { accountId: t },
		expiresAtMs: n
	};
}
function r(e) {
	if (e == null) return null;
	if (typeof e == "number" && Number.isFinite(e)) return e;
	if (typeof e != "string") return;
	let t = Date.parse(e);
	return Number.isFinite(t) ? t : void 0;
}
function i(e) {
	return e.status === 429 ? {
		status: "error",
		code: "rate-limited"
	} : e.status >= 500 ? { status: "unavailable" } : {
		status: "error",
		code: a(e)
	};
}
function a(e) {
	return e.status === 400 ? "invalid-input" : e.status === 401 || e.status === 403 ? "invalid-credentials" : e.status === 429 ? "rate-limited" : e.status >= 500 ? "unavailable" : "provider-error";
}
function o(e) {
	return typeof e == "object" && !!e;
}
function s(e) {
	try {
		let t = new URL(e);
		return t.protocol === "https:" || t.protocol === "http:" && (t.hostname === "localhost" || t.hostname === "127.0.0.1");
	} catch {
		return !1;
	}
}
//#endregion
//#region src/platform/web/cloud-save-http-client.ts
var c = class {
	#e;
	#t;
	#n;
	#r;
	#i;
	constructor(e = {}) {
		if (this.#e = u(e.apiBaseUrl ?? ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis), this.#n = e.timeoutMs ?? 1e4, this.#r = e.retryDelaysMs ?? [150, 500], this.#i = e.sleep ?? ((e) => new Promise((t) => setTimeout(t, e))), !Number.isSafeInteger(this.#n) || this.#n < 1) throw RangeError("Cloud Save timeoutMs must be a positive safe integer.");
		for (let e of this.#r) if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Cloud Save retry delays must be non-negative safe integers.");
	}
	async getLatest(e, t) {
		try {
			let n = await this.#a(l(this.#e, e, t), {
				method: "GET",
				credentials: "include",
				headers: { accept: "application/json" }
			});
			if (n.status === 401) return { status: "unauthorized" };
			if (n.status === 403) return { status: "forbidden" };
			if (n.status === 404) return { status: "missing" };
			if (n.status >= 500) return { status: "unavailable" };
			if (!n.ok) return { status: "error" };
			let r = d(await n.json(), e, t);
			return r === null ? { status: "error" } : {
				status: "found",
				snapshot: r
			};
		} catch {
			return { status: "unavailable" };
		}
	}
	async put(e) {
		try {
			let t = await this.#a(l(this.#e, e.gameId, e.playerId), {
				method: "PUT",
				credentials: "include",
				headers: {
					accept: "application/json",
					"content-type": "application/json"
				},
				body: JSON.stringify({
					expectedRevision: e.expectedRevision,
					operationId: e.operationId,
					schemaVersion: e.schemaVersion,
					payload: e.payload
				})
			});
			if (t.status === 401) return { status: "unauthorized" };
			if (t.status === 403) return { status: "forbidden" };
			if (t.status === 429) return { status: "rate-limited" };
			if (t.status >= 500) return { status: "unavailable" };
			if (t.status === 409) {
				let n = await t.json();
				if (!p(n) || n.error !== "revision-conflict") return { status: "error" };
				if (n.current === null) return {
					status: "conflict",
					current: null
				};
				let r = f(n.current, e.gameId, e.playerId);
				return r === null ? { status: "error" } : {
					status: "conflict",
					current: r
				};
			}
			if (!t.ok) return { status: "error" };
			let n = d(await t.json(), e.gameId, e.playerId);
			return n === null ? { status: "error" } : {
				status: "saved",
				snapshot: n
			};
		} catch {
			return { status: "unavailable" };
		}
	}
	async deleteRemote(e, t) {
		try {
			let n = await this.#a(l(this.#e, e, t), {
				method: "DELETE",
				credentials: "include",
				headers: { accept: "application/json" }
			});
			return n.status === 401 ? "unauthorized" : n.status === 403 ? "forbidden" : n.status >= 500 ? "unavailable" : n.ok ? "deleted" : "error";
		} catch {
			return "unavailable";
		}
	}
	async #a(e, t) {
		let n = null;
		for (let r = 0; r <= this.#r.length; r += 1) {
			try {
				let n = await this.#o(e, t);
				if (n.status < 500 || r === this.#r.length) return n;
			} catch (e) {
				if (n = e, r === this.#r.length) throw e;
			}
			let i = this.#r[r];
			i !== void 0 && i > 0 && await this.#i(i);
		}
		throw n instanceof Error ? n : Error("Cloud Save request failed.");
	}
	async #o(e, t) {
		let n = new AbortController(), r = setTimeout(() => n.abort(), this.#n);
		try {
			return await this.#t(e, {
				...t,
				signal: n.signal
			});
		} finally {
			clearTimeout(r);
		}
	}
};
function l(e, t, n) {
	return `${e}/v1/games/${encodeURIComponent(t)}/players/${encodeURIComponent(n)}/save`;
}
function u(e) {
	let t = e.trim();
	return t === "" || t === "/" ? "" : t.endsWith("/") ? t.slice(0, -1) : t;
}
function d(e, t, n) {
	return !p(e) || !("snapshot" in e) ? null : f(e.snapshot, t, n);
}
function f(e, t, n) {
	if (!p(e) || e.gameId !== t || e.playerId !== n || typeof e.schemaVersion != "number" || !Number.isSafeInteger(e.schemaVersion) || e.schemaVersion < 0 || typeof e.revision != "number" || !Number.isSafeInteger(e.revision) || e.revision < 1 || typeof e.updatedAtMs != "number" || !Number.isSafeInteger(e.updatedAtMs) || e.updatedAtMs < 0 || !("payload" in e)) return null;
	let r = e.parentRevision;
	return r !== null && (typeof r != "number" || !Number.isSafeInteger(r) || r < 1) || (e.revision === 1 ? r !== null : r !== e.revision - 1) ? null : {
		gameId: t,
		playerId: n,
		schemaVersion: e.schemaVersion,
		revision: e.revision,
		parentRevision: r,
		updatedAtMs: e.updatedAtMs,
		payload: e.payload
	};
}
function p(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/platform/web/cloud-save-fingerprint.ts
async function m(e) {
	let t = JSON.stringify(e, (e, t) => h(t) ? Object.fromEntries(Object.keys(t).sort().map((e) => [e, t[e]])) : t);
	if (t === void 0) throw Error("Cloud Save state must be JSON-serializable.");
	if (typeof crypto > "u" || crypto.subtle === void 0) throw Error("Web Crypto is required for Cloud Save fingerprinting.");
	let n = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
	return [...new Uint8Array(n)].map((e) => e.toString(16).padStart(2, "0")).join("");
}
function h(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
//#endregion
//#region src/platform/web/browser-ad-adapter.ts
var g = class {
	#e;
	#t;
	#n;
	constructor(e = {}) {
		this.#e = e.resolveProvider ?? (() => typeof window > "u" ? void 0 : window.__IDLE_GAME_AD_PROVIDER__), this.#t = e.resolveBannerHost ?? _, this.#n = e.createRequestId ?? x;
	}
	async showBanner(e) {
		let t = this.#e();
		if (t === void 0) return "unavailable";
		let n = this.#t(e);
		try {
			let r = await t.showBanner({
				placementId: e,
				host: n
			});
			return r !== "shown" && r !== "unavailable" ? "error" : (v(n, r), r);
		} catch {
			return v(n, "error"), "error";
		}
	}
	async hideBanner(e) {
		let t = this.#e(), n = this.#t(e);
		try {
			await t?.hideBanner({
				placementId: e,
				host: n
			});
		} catch {} finally {
			v(n, "hidden");
		}
	}
	async showRewarded(e) {
		let t = this.#e();
		if (t === void 0) return { status: "unavailable" };
		try {
			let n = y(this.#n());
			if (n === null) return { status: "error" };
			let r = await t.showRewarded({
				offerId: e,
				requestId: n
			});
			if (r.status === "closed" || r.status === "unavailable") return r;
			if (r.status !== "reward-granted") return { status: "error" };
			let i = r.externalGrantId === void 0 ? n : y(r.externalGrantId);
			return i === null ? { status: "error" } : {
				status: "reward-granted",
				externalGrantId: i
			};
		} catch {
			return { status: "error" };
		}
	}
};
function _(e) {
	if (typeof document > "u") return null;
	let t = document.querySelectorAll("[data-ad-placement]");
	for (let n of t) if (n.dataset.adPlacement === e) return n;
	return null;
}
function v(e, t) {
	e !== null && (e.dataset.adState = t);
}
function y(e) {
	if (typeof e != "string") return null;
	let t = e.trim();
	return t.length === 0 || t.length > 256 ? null : t;
}
var b = 0;
function x() {
	return typeof crypto < "u" && typeof crypto.randomUUID == "function" ? `client:${crypto.randomUUID()}` : (b += 1, `client:${Date.now()}:${b}`);
}
//#endregion
//#region src/platform/web/browser-purchase-provider.ts
var S = class {
	async loadProducts(e) {
		let t = C();
		if (t === null) return [];
		try {
			return (await t.loadProducts({ productIds: e })).filter(w);
		} catch {
			return [];
		}
	}
	async purchase(e) {
		let t = C();
		if (t === null) return { status: "unavailable" };
		try {
			let n = await t.purchase({ productId: e });
			return n.status === "purchased" ? T(n.transaction) && n.transaction.productId === e ? n : { status: "error" } : [
				"pending",
				"cancelled",
				"unavailable",
				"error"
			].includes(n.status) ? n : { status: "error" };
		} catch {
			return { status: "error" };
		}
	}
	async restore() {
		let e = C();
		if (e === null) return { status: "unavailable" };
		try {
			let t = await e.restore();
			return t.status === "restored" ? t.transactions.some((e) => !T(e)) ? { status: "error" } : t : t.status === "unavailable" || t.status === "error" ? t : { status: "error" };
		} catch {
			return { status: "error" };
		}
	}
	async finishTransaction(e) {
		let t = C();
		if (t === null) throw Error("Purchase provider unavailable.");
		await t.finishTransaction({ transactionId: e });
	}
};
function C() {
	return typeof window > "u" ? null : window.__IDLE_GAME_PURCHASE_PROVIDER__ ?? null;
}
function w(e) {
	return e.productId.trim().length > 0 && e.displayName.trim().length > 0 && e.priceText.trim().length > 0;
}
function T(e) {
	return e.transactionId.trim().length > 0 && e.transactionId.length <= 512 && e.productId.trim().length > 0 && e.productId.length <= 256;
}
//#endregion
//#region src/platform/web/fake-ad-adapter.ts
var E = class {
	#e;
	#t;
	#n = 0;
	#r = /* @__PURE__ */ new Set();
	constructor(e = {}) {
		this.#e = e.bannerAvailable ?? !0, this.#t = e.rewardedAvailable ?? !0;
	}
	showBanner(e) {
		return this.#e ? (this.#r.add(e), Promise.resolve("shown")) : Promise.resolve("unavailable");
	}
	hideBanner(e) {
		return this.#r.delete(e), Promise.resolve();
	}
	showRewarded(e) {
		return this.#t ? (this.#n += 1, Promise.resolve({
			status: "reward-granted",
			externalGrantId: `fake:${e}:${this.#n}`
		})) : Promise.resolve({ status: "unavailable" });
	}
	isBannerVisible(e) {
		return this.#r.has(e);
	}
}, D = class {
	#e;
	#t;
	#n;
	#r = /* @__PURE__ */ new Map();
	#i = /* @__PURE__ */ new Set();
	#a = 0;
	constructor(e) {
		this.#e = new Map(e.products.map((e) => [e.productId, e])), this.#t = e.available ?? !0, this.#n = e.purchaseOutcome ?? "purchased";
		for (let t of e.restoredTransactions ?? []) this.#r.set(t.transactionId, t);
	}
	loadProducts(e) {
		return this.#t ? Promise.resolve(e.flatMap((e) => {
			let t = this.#e.get(e);
			return t === void 0 ? [] : [t];
		})) : Promise.resolve([]);
	}
	purchase(e) {
		if (!this.#t || !this.#e.has(e)) return Promise.resolve({ status: "unavailable" });
		if (this.#n !== "purchased") return Promise.resolve({ status: this.#n });
		this.#a += 1;
		let t = {
			transactionId: `fake-purchase:${e}:${this.#a}`,
			productId: e
		};
		return this.#r.set(t.transactionId, t), Promise.resolve({
			status: "purchased",
			transaction: t
		});
	}
	restore() {
		return this.#t ? Promise.resolve({
			status: "restored",
			transactions: [...this.#r.values()]
		}) : Promise.resolve({ status: "unavailable" });
	}
	finishTransaction(e) {
		return this.#r.has(e) ? (this.#i.add(e), Promise.resolve()) : Promise.reject(/* @__PURE__ */ Error(`Unknown fake purchase transaction: ${e}`));
	}
	isTransactionFinished(e) {
		return this.#i.has(e);
	}
}, O = "profiles", k = class {
	#e;
	#t;
	#n;
	#r = null;
	constructor(e) {
		this.#e = e.dbName, this.#t = e.storeName ?? O, this.#n = e.indexedDb ?? indexedDB;
	}
	async load(e) {
		let t = await this.#i();
		return new Promise((n, r) => {
			let i = t.transaction(this.#t, "readonly").objectStore(this.#t).get(e);
			i.onsuccess = () => n(i.result ?? null), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB load failed."));
		});
	}
	async save(e) {
		let t = await this.#i();
		await new Promise((n, r) => {
			let i = t.transaction(this.#t, "readwrite");
			i.objectStore(this.#t).put(e, e.profileId), i.oncomplete = () => n(), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB save failed.")), i.onabort = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB save aborted."));
		});
	}
	async delete(e) {
		let t = await this.#i();
		await new Promise((n, r) => {
			let i = t.transaction(this.#t, "readwrite");
			i.objectStore(this.#t).delete(e), i.oncomplete = () => n(), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB delete failed.")), i.onabort = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB delete aborted."));
		});
	}
	#i() {
		return this.#r === null && (this.#r = new Promise((e, t) => {
			let n = this.#n.open(this.#e, 1);
			n.onupgradeneeded = () => {
				let e = n.result;
				e.objectStoreNames.contains(this.#t) || e.createObjectStore(this.#t);
			}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error ?? /* @__PURE__ */ Error("IndexedDB open failed."));
		})), this.#r;
	}
}, A = "cloud-save-sync", j = class {
	#e;
	#t;
	#n;
	#r = null;
	constructor(e) {
		if (e.dbName.trim() === "") throw Error("Cloud Save metadata dbName must not be empty.");
		this.#e = e.dbName, this.#t = e.storeName ?? A, this.#n = e.indexedDb ?? indexedDB;
	}
	async load(e, t) {
		let n = await this.#i();
		return new Promise((r, i) => {
			let a = n.transaction(this.#t, "readonly").objectStore(this.#t).get(M(e, t));
			a.onsuccess = () => r(a.result ?? null), a.onerror = () => i(a.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata load failed."));
		});
	}
	async save(e) {
		let t = await this.#i();
		await new Promise((n, r) => {
			let i = t.transaction(this.#t, "readwrite");
			i.objectStore(this.#t).put(e, M(e.gameId, e.playerId)), i.oncomplete = () => n(), i.onerror = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata save failed.")), i.onabort = () => r(i.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata save aborted."));
		});
	}
	async delete(e, t) {
		let n = await this.#i();
		await new Promise((r, i) => {
			let a = n.transaction(this.#t, "readwrite");
			a.objectStore(this.#t).delete(M(e, t)), a.oncomplete = () => r(), a.onerror = () => i(a.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata delete failed.")), a.onabort = () => i(a.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata delete aborted."));
		});
	}
	#i() {
		return this.#r === null && (this.#r = new Promise((e, t) => {
			let n = this.#n.open(this.#e, 1);
			n.onupgradeneeded = () => {
				let e = n.result;
				e.objectStoreNames.contains(this.#t) || e.createObjectStore(this.#t);
			}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error ?? /* @__PURE__ */ Error("IndexedDB Cloud Save metadata open failed."));
		})), this.#r;
	}
};
function M(e, t) {
	return `${e.length}:${e}${t}`;
}
//#endregion
//#region src/platform/web/persistent-storage.ts
async function N(e = P()) {
	if (e?.persisted === void 0 || e.persist === void 0) return "unsupported";
	try {
		return await e.persisted() ? "already-persisted" : await e.persist() ? "granted" : "denied";
	} catch {
		return "error";
	}
}
function P() {
	if (!(typeof navigator > "u")) return navigator.storage;
}
//#endregion
//#region src/platform/web/service-worker.ts
function F(e, t) {
	let n = new URL(e, t);
	return new URL("sw.js", n).href;
}
async function I() {
	if (!("serviceWorker" in navigator)) return null;
	try {
		let e = F("/", document.baseURI), t = await navigator.serviceWorker.register(e);
		try {
			await t.update();
		} catch {}
		return t;
	} catch {
		return null;
	}
}
//#endregion
//#region src/platform/web/google-publisher-tag-provider.ts
var L = class {
	#e;
	#t;
	#n;
	#r;
	#i = /* @__PURE__ */ new Map();
	#a = null;
	#o = !1;
	#s = !1;
	#c = null;
	#l = 0;
	constructor(e, t = {}) {
		if (this.#e = e, this.#t = t.resolveRuntime ?? z, this.#n = t.bannerTimeoutMs ?? 15e3, this.#r = t.rewardedTimeoutMs ?? 3e4, !Number.isSafeInteger(this.#n) || this.#n <= 0) throw RangeError("bannerTimeoutMs must be a positive safe integer.");
		if (!Number.isSafeInteger(this.#r) || this.#r <= 0) throw RangeError("rewardedTimeoutMs must be a positive safe integer.");
	}
	async showBanner(e) {
		let t = this.#e.bannerPlacements?.[e.placementId];
		if (t === void 0 || e.host === null) return "unavailable";
		if (B(t.adUnitPath), t.sizes.length === 0) throw RangeError("GPT banner requires at least one size.");
		let n = this.#i.get(e.placementId);
		return n === void 0 ? this.#g((n) => {
			let r = V(e.host, () => `idle-game-ad-${++this.#l}`), i = n.defineSlot(t.adUnitPath, t.sizes, r);
			if (i === null) return Promise.resolve("unavailable");
			i.addService(n.pubads()), this.#u(n), this.#h(n);
			let a, o = new Promise((e) => {
				a = e;
			}), s = {
				slot: i,
				host: e.host,
				result: o,
				resolve: a,
				settled: !1,
				timeout: null
			};
			return s.timeout = setTimeout(() => {
				this.#i.get(e.placementId) !== s || s.settled || (this.#d(s, "unavailable"), this.#f(n, e.placementId, s));
			}, this.#n), this.#i.set(e.placementId, s), n.display(r), o;
		}, Promise.resolve("unavailable")) : n.result;
	}
	hideBanner(e) {
		let t = this.#i.get(e.placementId);
		if (t === void 0) return Promise.resolve();
		let n = this.#a ?? this.#t();
		return t.settled || this.#d(t, "unavailable"), n === void 0 ? (this.#i.delete(e.placementId), t.timeout !== null && clearTimeout(t.timeout), (t.host.isConnected || e.host === t.host) && t.host.replaceChildren()) : this.#f(n, e.placementId, t), Promise.resolve();
	}
	async showRewarded(e) {
		let t = this.#e.rewardedOffers?.[e.offerId];
		return t === void 0 || this.#c !== null ? { status: "unavailable" } : (B(t.adUnitPath), this.#g((e) => {
			let n = e.defineOutOfPageSlot(t.adUnitPath, e.enums.OutOfPageFormat.REWARDED);
			if (n === null) return Promise.resolve({ status: "unavailable" });
			n.addService(e.pubads()), this.#u(e), this.#h(e);
			let r = new Promise((t) => {
				let r = {
					slot: n,
					resolve: t,
					responseIdentifier: null,
					granted: !1,
					settled: !1,
					timeout: null
				};
				r.timeout = setTimeout(() => {
					this.#c !== r || r.settled || (this.#p(r, { status: "unavailable" }), this.#m(e, r));
				}, this.#r), this.#c = r;
			});
			return e.display(n), r;
		}, Promise.resolve({ status: "unavailable" })));
	}
	#u(e) {
		if (this.#o) return;
		this.#o = !0;
		let t = e.pubads();
		t.addEventListener("slotRenderEnded", (t) => {
			let n = [...this.#i.entries()].find(([, e]) => e.slot === t.slot);
			if (n !== void 0) {
				let [r, i] = n;
				t.isEmpty ? (this.#d(i, "unavailable"), this.#f(e, r, i)) : this.#d(i, "shown");
				return;
			}
			let r = this.#c;
			r !== null && t.slot === r.slot && (t.responseIdentifier !== null && t.responseIdentifier.trim().length > 0 && (r.responseIdentifier = t.responseIdentifier.trim()), t.isEmpty && (this.#p(r, { status: "unavailable" }), this.#m(e, r)));
		}), t.addEventListener("rewardedSlotReady", (e) => {
			let t = this.#c;
			t !== null && e.slot === t.slot && e.makeRewardedVisible();
		}), t.addEventListener("rewardedSlotGranted", (e) => {
			let t = this.#c;
			t !== null && e.slot === t.slot && (t.granted = !0, this.#p(t, t.responseIdentifier === null ? { status: "reward-granted" } : {
				status: "reward-granted",
				externalGrantId: `gpt:${t.responseIdentifier}`
			}));
		}), t.addEventListener("rewardedSlotClosed", (t) => {
			let n = this.#c;
			n !== null && t.slot === n.slot && (n.granted || this.#p(n, { status: "closed" }), this.#m(e, n));
		});
	}
	#d(e, t) {
		e.settled || (e.settled = !0, e.timeout !== null && (clearTimeout(e.timeout), e.timeout = null), e.resolve(t));
	}
	#f(e, t, n) {
		n.timeout !== null && clearTimeout(n.timeout), e.destroySlots([n.slot]), this.#i.get(t) === n && this.#i.delete(t), n.host.replaceChildren();
	}
	#p(e, t) {
		e.settled || (e.settled = !0, e.resolve(t));
	}
	#m(e, t) {
		t.timeout !== null && clearTimeout(t.timeout), e.destroySlots([t.slot]), this.#c === t && (this.#c = null);
	}
	#h(e) {
		this.#s ||= (e.enableServices(), !0);
	}
	async #g(e, t) {
		let n = this.#a ?? this.#t();
		return n === void 0 ? t : (this.#a = n, new Promise((t, r) => {
			n.cmd.push(() => {
				try {
					Promise.resolve(e(n)).then(t, r);
				} catch (e) {
					r(e instanceof Error ? e : Error(String(e)));
				}
			});
		}));
	}
};
function R(e, t = {}) {
	if (typeof window > "u") return null;
	let n = new L(e, t);
	return window.__IDLE_GAME_AD_PROVIDER__ = n, n;
}
function z() {
	if (!(typeof window > "u")) return window.googletag;
}
function B(e) {
	if (e.trim().length === 0) throw RangeError("GPT adUnitPath must not be empty.");
}
function V(e, t) {
	if (e.id.length > 0) return e.id;
	let n = t();
	return e.id = n, n;
}
//#endregion
//#region src/platform/web/public-asset-url.ts
function H(e, t = "/") {
	if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(e)) return e;
	let n = e.replace(/^\/+/, "");
	return `${t.length === 0 ? "./" : t.endsWith("/") ? t : `${t}/`}${n}`;
}
//#endregion
export { e as BetterAuthBrowserAuthenticationClient, g as BrowserAdAdapter, S as BrowserNonConsumablePurchaseProvider, c as CloudSaveHttpClient, E as FakeAdAdapter, D as FakeNonConsumablePurchaseProvider, L as GooglePublisherTagProvider, j as IndexedDbCloudSaveSyncMetadataRepository, k as IndexedDbProfileRepository, R as installGooglePublisherTagProvider, I as registerServiceWorker, N as requestPersistentStorage, H as resolvePublicAssetUrl, F as resolveServiceWorkerScriptUrl, m as sha256CanonicalJsonFingerprint };
