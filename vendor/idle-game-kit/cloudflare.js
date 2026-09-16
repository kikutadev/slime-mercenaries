import { n as e, r as t } from "./game-profile-ownership-DU25dHR3.js";
//#region src/platform/cloudflare/d1-account-data-cleanup.ts
var n = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	async deleteAccountData(e) {
		if (e.length === 0 || e.length > 128) throw Error("Invalid accountId.");
		let t = this.#e.prepare("\n      DELETE FROM cloud_save_history\n      WHERE EXISTS (\n        SELECT 1 FROM game_profiles\n        WHERE game_profiles.game_id = cloud_save_history.game_id\n          AND game_profiles.player_id = cloud_save_history.player_id\n          AND game_profiles.account_id = ?\n      )\n    ").bind(e), n = this.#e.prepare("\n      DELETE FROM public_player_snapshots\n      WHERE EXISTS (\n        SELECT 1 FROM game_profiles\n        WHERE game_profiles.game_id = public_player_snapshots.game_id\n          AND game_profiles.player_id = public_player_snapshots.player_id\n          AND game_profiles.account_id = ?\n      )\n    ").bind(e), r = this.#e.prepare("\n      DELETE FROM game_profiles\n      WHERE account_id = ?\n    ").bind(e);
		await this.#e.batch([
			t,
			n,
			r
		]);
	}
}, r = 524288;
function i(t, n, i, s = {}) {
	let l = s.maxPayloadBytes ?? r, d = s.now ?? Date.now;
	if (!Number.isSafeInteger(l) || l < 1) throw RangeError("maxPayloadBytes must be a positive safe integer.");
	return async (r) => {
		if (r.method !== "GET" && r.method !== "PUT" && r.method !== "DELETE") return null;
		let f = o(new URL(r.url).pathname);
		if (f === null) return null;
		let p = r.method === "GET" ? "read" : r.method === "PUT" ? "write" : "delete", m = Date.now(), h = (e, t, n) => (s.observe?.({
			operation: p,
			gameId: f.gameId,
			outcome: t,
			durationMs: Math.max(0, Date.now() - m),
			...n === void 0 ? {} : { payloadBytes: n }
		}), e), g = await t.authenticate(r);
		if (g === null) return h(u({ error: "unauthenticated" }, 401), "unauthenticated");
		if (!await e(n, g, f.gameId, f.playerId)) return h(u({ error: "forbidden" }, 403), "forbidden");
		if (r.method === "GET") try {
			let e = await i.getLatest(f.gameId, f.playerId);
			return e === null ? h(u({ error: "save-not-found" }, 404), "missing") : h(u({ snapshot: e }, 200), "ok");
		} catch {
			return h(u({ error: "save-read-failed" }, 500), "failed");
		}
		if (r.method === "DELETE") try {
			return await i.deleteAll(f.gameId, f.playerId), h(new Response(null, {
				status: 204,
				headers: { "cache-control": "no-store" }
			}), "ok");
		} catch {
			return h(u({ error: "save-delete-failed" }, 500), "failed");
		}
		if (s.allowWrite !== void 0 && !await s.allowWrite({
			accountId: g.accountId,
			gameId: f.gameId,
			playerId: f.playerId,
			request: r
		})) return h(u({ error: "rate-limited" }, 429), "rate-limited");
		let _ = c(r.headers.get("content-length"));
		if (_ !== null && _ > l) return h(u({ error: "payload-too-large" }, 413), "invalid", _);
		let v;
		try {
			v = await r.text();
		} catch {
			return h(u({ error: "invalid-body" }, 400), "invalid");
		}
		let y = new TextEncoder().encode(v).byteLength;
		if (y > l) return h(u({ error: "payload-too-large" }, 413), "invalid", y);
		let b = a(v, f.gameId, f.playerId);
		if (b === null) return h(u({ error: "invalid-save-envelope" }, 400), "invalid", y);
		try {
			let e = await i.put(b, d());
			return e.status === "conflict" ? h(u({
				error: "revision-conflict",
				current: e.current
			}, 409), "conflict", y) : h(u({ snapshot: e.snapshot }, e.snapshot.revision === 1 ? 201 : 200), "ok", y);
		} catch {
			return h(u({ error: "save-write-failed" }, 500), "failed", y);
		}
	};
}
function a(e, t, n) {
	let r;
	try {
		r = JSON.parse(e);
	} catch {
		return null;
	}
	if (!l(r)) return null;
	let i = r.expectedRevision, a = r.operationId === void 0 ? s() : r.operationId, o = r.schemaVersion;
	return i !== null && (!Number.isSafeInteger(i) || typeof i != "number" || i < 1) || typeof a != "string" || a.length < 1 || a.length > 128 || typeof o != "number" || !Number.isSafeInteger(o) || o < 0 || !("payload" in r) ? null : {
		gameId: t,
		playerId: n,
		expectedRevision: i,
		operationId: a,
		schemaVersion: o,
		payload: r.payload
	};
}
function o(e) {
	let t = e.split("/").filter(Boolean);
	if (t.length !== 6 || t[0] !== "v1" || t[1] !== "games" || t[3] !== "players" || t[5] !== "save") return null;
	try {
		let e = decodeURIComponent(t[2] ?? ""), n = decodeURIComponent(t[4] ?? "");
		return e.length === 0 || e.length > 128 || n.length === 0 || n.length > 128 ? null : {
			gameId: e,
			playerId: n
		};
	} catch {
		return null;
	}
}
function s() {
	return `legacy-${globalThis.crypto.randomUUID()}`;
}
function c(e) {
	if (e === null) return null;
	let t = Number(e);
	return Number.isSafeInteger(t) && t >= 0 ? t : null;
}
function l(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function u(e, t) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": "no-store",
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
//#region src/platform/cloudflare/d1-cloud-save-repository.ts
var d = class {
	#e;
	#t;
	#n;
	constructor(e, t = {}) {
		if (this.#e = e, this.#t = t.retentionCount ?? 20, !Number.isSafeInteger(this.#t) || this.#t < 2) throw RangeError("Cloud Save retentionCount must be a safe integer of at least 2.");
		this.#n = t.onMaintenanceError;
	}
	async getLatest(e, t) {
		let n = await this.#e.prepare("\n      SELECT game_id, player_id, revision, parent_revision, write_id, schema_version, updated_at_ms, payload_json\n      FROM cloud_save_history\n      WHERE game_id = ? AND player_id = ?\n      ORDER BY revision DESC\n      LIMIT 1\n    ").bind(e, t).first();
		return n === null ? null : f(n);
	}
	async put(e, t) {
		m(e, t);
		let n = JSON.stringify(e.payload);
		if (n === void 0) throw Error("Cloud Save payload must be JSON-serializable.");
		let r = await this.#r(e.gameId, e.playerId, e.operationId);
		if (r !== null) return p(r, e, n) ? {
			status: "saved",
			snapshot: f(r)
		} : {
			status: "conflict",
			current: await this.getLatest(e.gameId, e.playerId)
		};
		let i = await this.getLatest(e.gameId, e.playerId);
		if ((i?.revision ?? null) !== e.expectedRevision) return {
			status: "conflict",
			current: i
		};
		let a = (i?.revision ?? 0) + 1, o = {
			gameId: e.gameId,
			playerId: e.playerId,
			revision: a,
			parentRevision: i?.revision ?? null,
			schemaVersion: e.schemaVersion,
			updatedAtMs: t,
			payload: e.payload
		};
		try {
			return await this.#e.prepare("\n        INSERT INTO cloud_save_history (\n          game_id, player_id, revision, parent_revision, write_id, schema_version, updated_at_ms, payload_json\n        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n      ").bind(o.gameId, o.playerId, o.revision, o.parentRevision, e.operationId, o.schemaVersion, o.updatedAtMs, n).run(), await this.#i(o.gameId, o.playerId), {
				status: "saved",
				snapshot: o
			};
		} catch (t) {
			let r = await this.#r(e.gameId, e.playerId, e.operationId);
			if (r !== null && p(r, e, n)) return {
				status: "saved",
				snapshot: f(r)
			};
			let i = await this.getLatest(e.gameId, e.playerId);
			if ((i?.revision ?? null) !== e.expectedRevision) return {
				status: "conflict",
				current: i
			};
			throw t;
		}
	}
	async deleteAll(e, t) {
		await this.#e.prepare("\n      DELETE FROM cloud_save_history\n      WHERE game_id = ? AND player_id = ?\n    ").bind(e, t).run();
	}
	async deleteAllForAccount(e) {
		if (e.length === 0 || e.length > 128) throw Error("Invalid accountId.");
		await this.#e.prepare("\n      DELETE FROM cloud_save_history\n      WHERE EXISTS (\n        SELECT 1\n        FROM game_profiles\n        WHERE game_profiles.game_id = cloud_save_history.game_id\n          AND game_profiles.player_id = cloud_save_history.player_id\n          AND game_profiles.account_id = ?\n      )\n    ").bind(e).run();
	}
	async pruneHistory(e, t, n = this.#t) {
		if (!Number.isSafeInteger(n) || n < 2) throw RangeError("keepLatestCount must be a safe integer of at least 2.");
		await this.#e.prepare("\n      DELETE FROM cloud_save_history\n      WHERE game_id = ? AND player_id = ?\n        AND revision NOT IN (\n          SELECT revision\n          FROM cloud_save_history\n          WHERE game_id = ? AND player_id = ?\n          ORDER BY revision DESC\n          LIMIT ?\n        )\n    ").bind(e, t, e, t, n).run();
	}
	async #r(e, t, n) {
		return this.#e.prepare("\n      SELECT game_id, player_id, revision, parent_revision, write_id, schema_version, updated_at_ms, payload_json\n      FROM cloud_save_history\n      WHERE game_id = ? AND player_id = ? AND write_id = ?\n      LIMIT 1\n    ").bind(e, t, n).first();
	}
	async #i(e, t) {
		try {
			await this.pruneHistory(e, t);
		} catch (n) {
			this.#n?.({
				operation: "retention-prune",
				gameId: e,
				playerId: t,
				error: n
			});
		}
	}
};
function f(e) {
	let t;
	try {
		t = JSON.parse(e.payload_json);
	} catch {
		throw Error(`Invalid Cloud Save payload JSON for ${e.game_id}/${e.player_id}@${e.revision}.`);
	}
	return {
		gameId: e.game_id,
		playerId: e.player_id,
		revision: e.revision,
		parentRevision: e.parent_revision,
		schemaVersion: e.schema_version,
		updatedAtMs: e.updated_at_ms,
		payload: t
	};
}
function p(e, t, n) {
	return e.write_id === t.operationId && e.parent_revision === t.expectedRevision && e.schema_version === t.schemaVersion && e.payload_json === n;
}
function m(e, t) {
	if (e.gameId.length === 0 || e.gameId.length > 128 || e.playerId.length === 0 || e.playerId.length > 128) throw Error("Invalid Cloud Save identity.");
	if (e.operationId.length === 0 || e.operationId.length > 128) throw Error("Invalid Cloud Save operationId.");
	if (e.expectedRevision !== null && (!Number.isSafeInteger(e.expectedRevision) || e.expectedRevision < 1)) throw Error("Invalid expected Cloud Save revision.");
	if (!Number.isSafeInteger(e.schemaVersion) || e.schemaVersion < 0) throw Error("Invalid Cloud Save schema version.");
	if (!Number.isSafeInteger(t) || t < 0) throw Error("Invalid Cloud Save timestamp.");
}
//#endregion
//#region src/platform/cloudflare/d1-cloud-save-write-rate-limiter.ts
var h = class {
	#e;
	#t;
	#n;
	#r;
	#i;
	constructor(e, t = {}) {
		this.#e = e, this.#t = t.perProfileLimit ?? 15, this.#n = t.perAccountLimit ?? 45, this.#r = t.windowMs ?? 6e4, this.#i = t.now ?? Date.now;
		for (let [e, t] of [
			["perProfileLimit", this.#t],
			["perAccountLimit", this.#n],
			["windowMs", this.#r]
		]) if (!Number.isSafeInteger(t) || t < 1) throw RangeError(`${e} must be a positive safe integer.`);
	}
	async allowWrite(e, t, n) {
		let r = Math.max(0, this.#i() - this.#r);
		return ((await this.#e.prepare("\n      SELECT COUNT(*) AS count\n      FROM cloud_save_history\n      WHERE game_id = ? AND player_id = ? AND updated_at_ms >= ?\n    ").bind(t, n, r).first())?.count ?? 0) >= this.#t ? !1 : ((await this.#e.prepare("\n      SELECT COUNT(*) AS count\n      FROM cloud_save_history\n      INNER JOIN game_profiles\n        ON game_profiles.game_id = cloud_save_history.game_id\n       AND game_profiles.player_id = cloud_save_history.player_id\n      WHERE game_profiles.account_id = ? AND cloud_save_history.updated_at_ms >= ?\n    ").bind(e, r).first())?.count ?? 0) < this.#n;
	}
};
//#endregion
//#region src/platform/cloudflare/owned-game-profiles-handler.ts
function g(e, t) {
	return async (n) => {
		if (n.method !== "GET") return null;
		let r = _(new URL(n.url).pathname);
		if (r === null) return null;
		let i = await e.authenticate(n);
		if (i === null) return v({ error: "unauthenticated" }, 401);
		try {
			return v({ profiles: (await t.listOwnedProfiles(i.accountId, r)).map((e) => ({
				gameId: e.gameId,
				playerId: e.playerId,
				createdAtMs: e.createdAtMs
			})) }, 200);
		} catch {
			return v({ error: "profile-list-failed" }, 500);
		}
	};
}
function _(e) {
	let t = e.split("/").filter(Boolean);
	if (t.length !== 4 || t[0] !== "v1" || t[1] !== "games" || t[3] !== "profiles") return null;
	try {
		let e = decodeURIComponent(t[2] ?? "");
		return e.length > 0 && e.length <= 128 ? e : null;
	} catch {
		return null;
	}
}
function v(e, t) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": "no-store",
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
//#region src/platform/cloudflare/authenticated-player-client.ts
var y = class extends Error {
	status;
	constructor(e, t) {
		super(t), this.name = "AuthenticatedPlayerRequestError", this.status = e;
	}
}, b = class {
	#e;
	#t;
	constructor(e = {}) {
		this.#e = S(e.apiBaseUrl ?? ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async listOwned(e) {
		try {
			let t = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e)}/profiles`, {
				method: "GET",
				credentials: "include",
				headers: { accept: "application/json" }
			});
			if (t.status === 401) return { status: "unauthenticated" };
			if (t.status === 404 || t.status >= 500) return { status: "unavailable" };
			if (!t.ok) throw new y(t.status, `Owned profile list failed with HTTP ${t.status}.`);
			let n = T(await t.json());
			if (n === null) throw new y(t.status, "Invalid owned profile list response.");
			return {
				status: "ok",
				profiles: n
			};
		} catch (e) {
			if (e instanceof y) throw e;
			return { status: "unavailable" };
		}
	}
	async claim(e, t) {
		try {
			let n = await this.#t(C(this.#e, e, t, "/claim"), {
				method: "POST",
				credentials: "include",
				headers: { accept: "application/json" }
			});
			if (n.status === 401) return { status: "unauthenticated" };
			if (n.status === 409) return { status: "conflict" };
			if (n.status === 404 || n.status >= 500) return { status: "unavailable" };
			if (!n.ok) throw new y(n.status, `Profile claim failed with HTTP ${n.status}.`);
			let r = w(await n.json());
			if (r === null) throw new y(n.status, "Invalid profile claim response.");
			return r;
		} catch (e) {
			if (e instanceof y) throw e;
			return { status: "unavailable" };
		}
	}
}, x = class {
	#e;
	#t;
	constructor(e = {}) {
		this.#e = S(e.apiBaseUrl ?? ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async publishPublicPlayer(e) {
		let t = await this.#t(C(this.#e, e.gameId, e.playerId), {
			method: "PUT",
			credentials: "include",
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			},
			body: JSON.stringify(e)
		});
		if (!t.ok) throw new y(t.status, `Public-player publish failed with HTTP ${t.status}.`);
	}
};
function S(e) {
	let t = e.trim();
	return t === "" || t === "/" ? "" : t.replace(/\/+$/u, "");
}
function C(e, t, n, r = "") {
	return `${e}/v1/games/${encodeURIComponent(t)}/players/${encodeURIComponent(n)}${r}`;
}
function w(e) {
	if (!E(e) || e.status !== "claimed" && e.status !== "already-owned" || !E(e.ownership)) return null;
	let t = e.ownership;
	return typeof t.accountId != "string" || t.accountId.length === 0 || typeof t.gameId != "string" || t.gameId.length === 0 || typeof t.playerId != "string" || t.playerId.length === 0 || typeof t.createdAtMs != "number" || !Number.isSafeInteger(t.createdAtMs) || t.createdAtMs < 0 ? null : {
		status: e.status,
		ownership: {
			accountId: t.accountId,
			gameId: t.gameId,
			playerId: t.playerId,
			createdAtMs: t.createdAtMs
		}
	};
}
function T(e) {
	if (!E(e) || !Array.isArray(e.profiles)) return null;
	let t = [];
	for (let n of e.profiles) {
		if (!E(n) || typeof n.gameId != "string" || n.gameId.length === 0 || typeof n.playerId != "string" || n.playerId.length === 0 || typeof n.createdAtMs != "number" || !Number.isSafeInteger(n.createdAtMs) || n.createdAtMs < 0) return null;
		t.push({
			gameId: n.gameId,
			playerId: n.playerId,
			createdAtMs: n.createdAtMs
		});
	}
	return t;
}
function E(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/platform/cloudflare/authenticated-public-player-publish-handler.ts
function D(t, n, r, i) {
	let a = i.maxBodyBytes ?? 32768, o = i.maxDisplayNameLength ?? 80;
	return async (s) => {
		if (s.method !== "PUT") return null;
		let c = O(new URL(s.url).pathname);
		if (c === null) return null;
		let l = await t.authenticate(s);
		if (l === null) return M({ error: "unauthenticated" }, 401);
		if (!await e(n, l, c.gameId, c.playerId)) return M({ error: "forbidden" }, 403);
		if (i.allowWrite !== void 0 && !await i.allowWrite({
			accountId: l.accountId,
			gameId: c.gameId,
			playerId: c.playerId,
			request: s
		})) return M({ error: "rate-limited" }, 429);
		let u = Number(s.headers.get("content-length"));
		if (Number.isFinite(u) && u > a) return M({ error: "payload-too-large" }, 413);
		let d;
		try {
			d = await s.text();
		} catch {
			return M({ error: "invalid-body" }, 400);
		}
		if (new TextEncoder().encode(d).byteLength > a) return M({ error: "payload-too-large" }, 413);
		let f;
		try {
			f = JSON.parse(d);
		} catch {
			return M({ error: "invalid-json" }, 400);
		}
		let p = k(f, c.gameId, c.playerId, o, i.validateData);
		if (p === null) return M({ error: "invalid-snapshot" }, 400);
		try {
			return await r.publishPublicPlayer(p), new Response(null, {
				status: 204,
				headers: { "cache-control": "no-store" }
			});
		} catch {
			return M({ error: "publish-failed" }, 500);
		}
	};
}
function O(e) {
	let t = e.split("/").filter(Boolean);
	if (t.length !== 5 || t[0] !== "v1" || t[1] !== "games" || t[3] !== "players") return null;
	try {
		let e = decodeURIComponent(t[2] ?? ""), n = decodeURIComponent(t[4] ?? "");
		return e === "" || n === "" ? null : {
			gameId: e,
			playerId: n
		};
	} catch {
		return null;
	}
}
function k(e, t, n, r, i) {
	return !A(e) || e.gameId !== t || e.playerId !== n || typeof e.displayName != "string" || e.displayName.length < 1 || e.displayName.length > r || !j(e.schemaVersion) || e.schemaVersion < 1 || !j(e.revision) || !j(e.updatedAtMs) || !i(e.data) ? null : {
		gameId: t,
		playerId: n,
		displayName: e.displayName,
		schemaVersion: e.schemaVersion,
		revision: e.revision,
		updatedAtMs: e.updatedAtMs,
		data: e.data
	};
}
function A(e) {
	return typeof e == "object" && !!e;
}
function j(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function M(e, t) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": "no-store",
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
//#region src/platform/cloudflare/game-profile-claim-handler.ts
function N(e, t, n = {}) {
	let r = n.now ?? Date.now;
	return async (n) => {
		if (n.method !== "POST") return null;
		let i = P(new URL(n.url).pathname);
		if (i === null) return null;
		let a = await e.authenticate(n);
		if (a === null) return F({ error: "unauthenticated" }, 401);
		try {
			let e = await t.claimProfile({
				accountId: a.accountId,
				gameId: i.gameId,
				playerId: i.playerId,
				createdAtMs: r()
			});
			return e.status === "conflict" ? F({ error: "profile-owned-by-another-account" }, 409) : F({
				ownership: e.ownership,
				status: e.status
			}, e.status === "claimed" ? 201 : 200);
		} catch {
			return F({ error: "claim-failed" }, 500);
		}
	};
}
function P(e) {
	let t = e.split("/").filter(Boolean);
	if (t.length !== 6 || t[0] !== "v1" || t[1] !== "games" || t[3] !== "players" || t[5] !== "claim") return null;
	try {
		let e = decodeURIComponent(t[2] ?? ""), n = decodeURIComponent(t[4] ?? "");
		return e === "" || n === "" ? null : {
			gameId: e,
			playerId: n
		};
	} catch {
		return null;
	}
}
function F(e, t) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": "no-store",
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
//#region src/platform/cloudflare/d1-game-profile-ownership.ts
var I = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	async findOwner(e, t) {
		let n = await this.#e.prepare("\n      SELECT account_id, game_id, player_id, created_at_ms\n      FROM game_profiles\n      WHERE game_id = ? AND player_id = ?\n    ").bind(e, t).first();
		return n === null ? null : L(n);
	}
	async listOwnedProfiles(e, t) {
		return ((await (t === void 0 ? this.#e.prepare("\n          SELECT account_id, game_id, player_id, created_at_ms\n          FROM game_profiles\n          WHERE account_id = ?\n          ORDER BY created_at_ms ASC, game_id ASC, player_id ASC\n        ").bind(e) : this.#e.prepare("\n          SELECT account_id, game_id, player_id, created_at_ms\n          FROM game_profiles\n          WHERE account_id = ? AND game_id = ?\n          ORDER BY created_at_ms ASC, player_id ASC\n        ").bind(e, t)).all()).results ?? []).map(L);
	}
	async claimProfile(e) {
		if (!t(e)) throw Error("Invalid game-profile ownership claim input.");
		let n = await this.#e.prepare("\n      INSERT INTO game_profiles (account_id, game_id, player_id, created_at_ms)\n      VALUES (?, ?, ?, ?)\n      ON CONFLICT(game_id, player_id) DO NOTHING\n      RETURNING account_id, game_id, player_id, created_at_ms\n    ").bind(e.accountId, e.gameId, e.playerId, e.createdAtMs).first();
		if (n !== null) return {
			status: "claimed",
			ownership: L(n)
		};
		let r = await this.findOwner(e.gameId, e.playerId);
		if (r === null) throw Error("Game-profile claim conflict could not be resolved.");
		return r.accountId === e.accountId ? {
			status: "already-owned",
			ownership: r
		} : {
			status: "conflict",
			ownership: r
		};
	}
};
function L(e) {
	return {
		accountId: e.account_id,
		gameId: e.game_id,
		playerId: e.player_id,
		createdAtMs: e.created_at_ms
	};
}
//#endregion
//#region src/platform/cloudflare/d1-public-player-directory.ts
var R = class {
	#e;
	constructor(e) {
		this.#e = e;
	}
	async getPublicPlayer(e, t) {
		let n = await this.#e.prepare("\n      SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n      FROM public_player_snapshots\n      WHERE game_id = ? AND player_id = ?\n    ").bind(e, t).first();
		return n === null ? null : z(n);
	}
	async listPublicPlayers(e) {
		let t = B(e.limit), n = H(e.cursor), r = [...(await (n === null ? this.#e.prepare("\n          SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n          FROM public_player_snapshots\n          WHERE game_id = ?\n          ORDER BY updated_at_ms DESC, player_id ASC\n          LIMIT ?\n        ").bind(e.gameId, t + 1) : this.#e.prepare("\n          SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n          FROM public_player_snapshots\n          WHERE game_id = ?\n            AND (updated_at_ms < ? OR (updated_at_ms = ? AND player_id > ?))\n          ORDER BY updated_at_ms DESC, player_id ASC\n          LIMIT ?\n        ").bind(e.gameId, n.updatedAtMs, n.updatedAtMs, n.playerId, t + 1)).all()).results ?? []], i = r.length > t, a = i ? r.slice(0, t) : r, o = a.at(-1);
		return {
			players: a.map((e) => z(e)),
			nextCursor: i && o !== void 0 ? V(o.updated_at_ms, o.player_id) : null
		};
	}
	async publishPublicPlayer(e) {
		await this.#e.prepare("\n      INSERT INTO public_player_snapshots (\n        game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json\n      ) VALUES (?, ?, ?, ?, ?, ?, ?)\n      ON CONFLICT(game_id, player_id) DO UPDATE SET\n        display_name = excluded.display_name,\n        schema_version = excluded.schema_version,\n        revision = excluded.revision,\n        updated_at_ms = excluded.updated_at_ms,\n        payload_json = excluded.payload_json\n      WHERE excluded.revision > public_player_snapshots.revision\n    ").bind(e.gameId, e.playerId, e.displayName, e.schemaVersion, e.revision, e.updatedAtMs, JSON.stringify(e.data)).run();
	}
};
function z(e) {
	let t;
	try {
		t = JSON.parse(e.payload_json);
	} catch {
		throw Error(`Invalid public player payload JSON for ${e.game_id}/${e.player_id}.`);
	}
	return {
		gameId: e.game_id,
		playerId: e.player_id,
		displayName: e.display_name,
		schemaVersion: e.schema_version,
		revision: e.revision,
		updatedAtMs: e.updated_at_ms,
		data: t
	};
}
function B(e) {
	return e === void 0 ? 20 : !Number.isInteger(e) || e < 1 ? 1 : Math.min(100, e);
}
function V(e, t) {
	return encodeURIComponent(JSON.stringify([e, t]));
}
function H(e) {
	if (e === void 0 || e === "") return null;
	try {
		let t = JSON.parse(decodeURIComponent(e));
		if (!Array.isArray(t) || t.length !== 2) throw Error("shape");
		let n = t[0], r = t[1];
		if (typeof n != "number" || !Number.isFinite(n) || n < 0 || typeof r != "string") throw Error("value");
		return {
			updatedAtMs: n,
			playerId: r
		};
	} catch {
		throw Error("Invalid public-player cursor.");
	}
}
//#endregion
//#region src/platform/cloudflare/public-player-directory-client.ts
var U = class extends Error {
	status;
	constructor(e, t) {
		super(t), this.name = "PublicPlayerDirectoryRequestError", this.status = e;
	}
}, W = class extends Error {
	constructor(e) {
		super(e), this.name = "PublicPlayerDirectoryProtocolError";
	}
}, G = class {
	#e;
	#t;
	constructor(e) {
		this.#e = e.apiBaseUrl.replace(/\/+$/, ""), this.#t = e.fetch ?? globalThis.fetch.bind(globalThis);
	}
	async getPublicPlayer(e, t) {
		let n = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e)}/players/${encodeURIComponent(t)}`, { headers: { accept: "application/json" } });
		if (n.status === 404) return null;
		await q(n);
		let r = await n.json();
		if (!Y(r) || !("player" in r)) throw new W("Expected a player response envelope.");
		return J(r.player);
	}
	async listPublicPlayers(e) {
		let t = K(e.limit), n = new URLSearchParams({ limit: String(t) });
		e.cursor !== void 0 && n.set("cursor", e.cursor);
		let r = await this.#t(`${this.#e}/v1/games/${encodeURIComponent(e.gameId)}/players?${n.toString()}`, { headers: { accept: "application/json" } });
		await q(r);
		let i = await r.json();
		if (!Y(i) || !Array.isArray(i.players)) throw new W("Expected a public-player page response envelope.");
		let a = i.nextCursor;
		if (a !== null && typeof a != "string") throw new W("nextCursor must be a string or null.");
		return {
			players: i.players.map((e) => J(e)),
			nextCursor: a
		};
	}
};
function K(e) {
	return e === void 0 ? 20 : !Number.isInteger(e) || e < 1 ? 1 : Math.min(100, e);
}
async function q(e) {
	if (e.ok) return;
	let t = "";
	try {
		t = (await e.text()).trim();
	} catch {}
	throw new U(e.status, t === "" ? `Public player request failed with HTTP ${e.status}.` : t);
}
function J(e) {
	if (!Y(e)) throw new W("Public player must be an object.");
	let { gameId: t, playerId: n, displayName: r, schemaVersion: i, revision: a, updatedAtMs: o } = e;
	if (typeof t != "string" || t.length === 0) throw new W("Invalid gameId.");
	if (typeof n != "string" || n.length === 0) throw new W("Invalid playerId.");
	if (typeof r != "string") throw new W("Invalid displayName.");
	if (!X(i)) throw new W("Invalid schemaVersion.");
	if (!X(a)) throw new W("Invalid revision.");
	if (typeof o != "number" || !Number.isFinite(o) || o < 0) throw new W("Invalid updatedAtMs.");
	if (!("data" in e)) throw new W("Missing public player data.");
	return {
		gameId: t,
		playerId: n,
		displayName: r,
		schemaVersion: i,
		revision: a,
		updatedAtMs: o,
		data: e.data
	};
}
function Y(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function X(e) {
	return typeof e == "number" && Number.isInteger(e) && e >= 0;
}
//#endregion
//#region src/platform/cloudflare/public-player-directory-handler.ts
function Z(e, t = {}) {
	let n = t.cacheControl ?? "public, max-age=15, stale-while-revalidate=45";
	return async (t) => {
		if (t.method !== "GET") return null;
		let r = new URL(t.url), i = r.pathname.split("/").filter(Boolean);
		if (i.length < 4 || i[0] !== "v1" || i[1] !== "games" || i[3] !== "players") return null;
		let a = decodeURIComponent(i[2] ?? "");
		if (a === "") return Q({ error: "invalid-game-id" }, 400, n);
		if (i.length === 4) {
			let t = r.searchParams.get("limit"), i = t === null ? void 0 : Number(t), o = r.searchParams.get("cursor") ?? void 0;
			return Q(await e.listPublicPlayers({
				gameId: a,
				...i === void 0 ? {} : { limit: i },
				...o === void 0 ? {} : { cursor: o }
			}), 200, n);
		}
		if (i.length === 5) {
			let t = decodeURIComponent(i[4] ?? "");
			if (t === "") return Q({ error: "invalid-player-id" }, 400, n);
			let r = await e.getPublicPlayer(a, t);
			return r === null ? Q({ error: "not-found" }, 404, n) : Q({ player: r }, 200, n);
		}
		return null;
	};
}
function Q(e, t, n) {
	return Response.json(e, {
		status: t,
		headers: {
			"cache-control": n,
			"content-type": "application/json; charset=utf-8"
		}
	});
}
//#endregion
export { y as AuthenticatedPlayerRequestError, x as CloudflareAuthenticatedPublicPlayerPublisher, b as CloudflareGameProfileClaimClient, G as CloudflarePublicPlayerDirectory, n as D1AccountDataCleanup, d as D1CloudSaveRepository, h as D1CloudSaveWriteRateLimiter, I as D1GameProfileOwnershipRepository, R as D1PublicPlayerDirectory, W as PublicPlayerDirectoryProtocolError, U as PublicPlayerDirectoryRequestError, D as createAuthenticatedPublicPlayerPublishHandler, i as createCloudSaveHandler, N as createGameProfileClaimHandler, g as createOwnedGameProfilesHandler, Z as createPublicPlayerDirectoryHandler };
