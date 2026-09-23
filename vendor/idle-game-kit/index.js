import { n as e, r as t, t as n } from "./game-profile-ownership-DU25dHR3.js";
import { a as r, i, n as a, o, r as s, s as c, t as l } from "./purchases-CYzvMLE9.js";
//#region \0rolldown/runtime.js
var u = Object.create, d = Object.defineProperty, ee = Object.getOwnPropertyDescriptor, te = Object.getOwnPropertyNames, ne = Object.getPrototypeOf, f = Object.prototype.hasOwnProperty, re = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), ie = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = te(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !f.call(e, s) && s !== n && d(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = ee(t, s)) || r.enumerable
	});
	return e;
}, ae = (e, t, n) => (n = e == null ? {} : u(ne(e)), ie(t || !e || !e.__esModule || !f.call(e, "default") ? d(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), oe = class {
	#e;
	#t;
	#n;
	constructor(e) {
		if (ce(e.gameId, "gameId"), ce(e.playerId, "playerId"), e.profileId.trim() === "") throw Error("profileId must not be empty.");
		this.#e = e, this.#t = e.now ?? Date.now, this.#n = e.operationIdFactory ?? ue;
	}
	async markLocalDirty() {
		let e = await this.#e.metadataRepository.load(this.#e.gameId, this.#e.playerId);
		e?.status !== "conflict" && await this.#e.metadataRepository.save({
			gameId: this.#e.gameId,
			playerId: this.#e.playerId,
			lastSyncedRevision: e?.lastSyncedRevision ?? null,
			lastSyncedPayloadFingerprint: e?.lastSyncedPayloadFingerprint ?? null,
			lastSuccessfulSyncAtMs: e?.lastSuccessfulSyncAtMs ?? null,
			status: "local-dirty"
		});
	}
	async sync() {
		let [e, t, n] = await Promise.all([
			this.#e.localRepository.load(this.#e.profileId),
			this.#e.metadataRepository.load(this.#e.gameId, this.#e.playerId),
			this.#r()
		]);
		if (se(n)) return n;
		if (e === null) return n.status === "missing" ? { status: "local-missing" } : this.#o(null, n.snapshot);
		let r = await this.#e.stateAdapter.fingerprint(e.state);
		if (t === null || t.lastSyncedRevision === null) return n.status === "missing" ? this.#i(e, null, r) : this.#s(e, n.snapshot, null);
		if (n.status === "missing") return { status: "error" };
		let i = n.snapshot;
		if (i.revision < t.lastSyncedRevision) return { status: "error" };
		let a = r !== t.lastSyncedPayloadFingerprint;
		return i.revision === t.lastSyncedRevision ? a ? this.#i(e, i.revision, r) : (await this.#c(i.revision, r, "synced"), {
			status: "synced",
			revision: i.revision
		}) : a ? await this.#a(i, r) ? (await this.#c(i.revision, r, "synced"), {
			status: "synced",
			revision: i.revision
		}) : this.#s(e, i, t.lastSyncedRevision) : this.#o(e, i);
	}
	async resolveConflict(e) {
		let t = await this.#e.localRepository.load(this.#e.profileId);
		if (t === null) return { status: "local-missing" };
		let n = await this.#r();
		if (se(n)) return n;
		if (e === "use-cloud") return n.status === "missing" ? { status: "error" } : this.#o(t, n.snapshot);
		let r = n.status === "found" ? n.snapshot.revision : null, i = await this.#e.stateAdapter.fingerprint(t.state);
		return this.#i(t, r, i);
	}
	async #r() {
		try {
			return await this.#e.client.getLatest(this.#e.gameId, this.#e.playerId);
		} catch {
			return { status: "unavailable" };
		}
	}
	async #i(e, t, n) {
		let r;
		try {
			let n = this.#e.stateAdapter.getSchemaVersion(e.state);
			le(n), r = await this.#e.client.put({
				gameId: this.#e.gameId,
				playerId: this.#e.playerId,
				expectedRevision: t,
				operationId: this.#n(),
				schemaVersion: n,
				payload: this.#e.stateAdapter.encode(e.state)
			});
		} catch {
			return { status: "error" };
		}
		return r.status === "saved" ? (await this.#c(r.snapshot.revision, n, "synced"), {
			status: "uploaded",
			snapshot: r.snapshot
		}) : r.status === "conflict" ? r.current === null ? { status: "error" } : this.#s(e, r.current, t) : r;
	}
	async #a(e, t) {
		try {
			let n = await this.#e.stateAdapter.decode(e);
			return await this.#e.stateAdapter.fingerprint(n) === t;
		} catch {
			return !1;
		}
	}
	async #o(e, t) {
		let n;
		try {
			n = await this.#e.stateAdapter.decode(t);
		} catch {
			return { status: "error" };
		}
		if (e !== null && this.#e.backupLocal !== void 0) try {
			await this.#e.backupLocal(e);
		} catch {
			return { status: "error" };
		}
		let r = {
			profileId: this.#e.profileId,
			savedAtMs: this.#t(),
			state: n
		};
		try {
			await this.#e.localRepository.save(r);
		} catch {
			return { status: "error" };
		}
		let i = await this.#e.stateAdapter.fingerprint(n);
		return await this.#c(t.revision, i, "synced"), {
			status: "restored",
			snapshot: t,
			state: n
		};
	}
	async #s(e, t, n) {
		let r = await this.#e.metadataRepository.load(this.#e.gameId, this.#e.playerId);
		return await this.#e.metadataRepository.save({
			gameId: this.#e.gameId,
			playerId: this.#e.playerId,
			lastSyncedRevision: n,
			lastSyncedPayloadFingerprint: r?.lastSyncedPayloadFingerprint ?? null,
			lastSuccessfulSyncAtMs: r?.lastSuccessfulSyncAtMs ?? null,
			status: "conflict"
		}), {
			status: "conflict",
			conflict: {
				local: e,
				remote: t,
				lastSyncedRevision: n
			}
		};
	}
	async #c(e, t, n) {
		await this.#e.metadataRepository.save({
			gameId: this.#e.gameId,
			playerId: this.#e.playerId,
			lastSyncedRevision: e,
			lastSyncedPayloadFingerprint: t,
			lastSuccessfulSyncAtMs: this.#t(),
			status: n
		});
	}
};
function se(e) {
	return e.status === "unauthorized" || e.status === "forbidden" || e.status === "unavailable" || e.status === "error";
}
function ce(e, t) {
	if (e.length === 0 || e.length > 128) throw Error(`${t} must contain 1-128 characters.`);
}
function le(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw Error("Cloud Save schemaVersion must be a non-negative safe integer.");
}
function ue() {
	return typeof globalThis.crypto?.randomUUID == "function" ? globalThis.crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
//#endregion
//#region ../../idle-game-kit/node_modules/.pnpm/break_infinity.js@2.2.0/node_modules/break_infinity.js/dist/break_infinity.esm.js
var de = /* @__PURE__ */ ae((/* @__PURE__ */ re(((e, t) => {
	t.exports = function(e, t, n) {
		if (e == null || t == null) return e;
		var r = String(e), i = typeof t == "number" ? t : parseInt(t, 10);
		if (isNaN(i) || !isFinite(i)) return r;
		var a = r.length;
		if (a >= i) return r;
		var o = n == null ? "" : String(n);
		o === "" && (o = " ");
		for (var s = i - a; o.length < s;) o += o;
		return r + (o.length > s ? o.substr(0, s) : o);
	};
})))()), p = 9e15, m = function() {
	for (var e = [], t = -323; t <= 308; t++) e.push(Number("1e" + t));
	return function(t) {
		return e[t + 323];
	};
}(), h = function(e) {
	return e instanceof v ? e : new v(e);
}, g = function(e, t) {
	return new v().fromMantissaExponent(e, t);
}, _ = function(e, t) {
	return new v().fromMantissaExponent_noNormalize(e, t);
};
function fe(e, t, n, r) {
	var i = t.mul(n.pow(r));
	return v.floor(e.div(i).mul(n.sub(1)).add(1).log10() / n.log10());
}
function pe(e, t, n, r) {
	return t.mul(n.pow(r)).mul(v.sub(1, n.pow(e))).div(v.sub(1, n));
}
var v = function() {
	function e(t) {
		this.mantissa = NaN, this.exponent = NaN, t === void 0 ? (this.m = 0, this.e = 0) : t instanceof e ? this.fromDecimal(t) : typeof t == "number" ? this.fromNumber(t) : this.fromString(t);
	}
	return Object.defineProperty(e.prototype, "m", {
		get: function() {
			return this.mantissa;
		},
		set: function(e) {
			this.mantissa = e;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "e", {
		get: function() {
			return this.exponent;
		},
		set: function(e) {
			this.exponent = e;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "s", {
		get: function() {
			return this.sign();
		},
		set: function(e) {
			if (e === 0) return this.e = 0, void (this.m = 0);
			this.sgn() !== e && (this.m = -this.m);
		},
		enumerable: !1,
		configurable: !0
	}), e.fromMantissaExponent = function(t, n) {
		return new e().fromMantissaExponent(t, n);
	}, e.fromMantissaExponent_noNormalize = function(t, n) {
		return new e().fromMantissaExponent_noNormalize(t, n);
	}, e.fromDecimal = function(t) {
		return new e().fromDecimal(t);
	}, e.fromNumber = function(t) {
		return new e().fromNumber(t);
	}, e.fromString = function(t) {
		return new e().fromString(t);
	}, e.fromValue = function(t) {
		return new e().fromValue(t);
	}, e.fromValue_noAlloc = function(t) {
		return t instanceof e ? t : new e(t);
	}, e.abs = function(e) {
		return h(e).abs();
	}, e.neg = function(e) {
		return h(e).neg();
	}, e.negate = function(e) {
		return h(e).neg();
	}, e.negated = function(e) {
		return h(e).neg();
	}, e.sign = function(e) {
		return h(e).sign();
	}, e.sgn = function(e) {
		return h(e).sign();
	}, e.round = function(e) {
		return h(e).round();
	}, e.floor = function(e) {
		return h(e).floor();
	}, e.ceil = function(e) {
		return h(e).ceil();
	}, e.trunc = function(e) {
		return h(e).trunc();
	}, e.add = function(e, t) {
		return h(e).add(t);
	}, e.plus = function(e, t) {
		return h(e).add(t);
	}, e.sub = function(e, t) {
		return h(e).sub(t);
	}, e.subtract = function(e, t) {
		return h(e).sub(t);
	}, e.minus = function(e, t) {
		return h(e).sub(t);
	}, e.mul = function(e, t) {
		return h(e).mul(t);
	}, e.multiply = function(e, t) {
		return h(e).mul(t);
	}, e.times = function(e, t) {
		return h(e).mul(t);
	}, e.div = function(e, t) {
		return h(e).div(t);
	}, e.divide = function(e, t) {
		return h(e).div(t);
	}, e.recip = function(e) {
		return h(e).recip();
	}, e.reciprocal = function(e) {
		return h(e).recip();
	}, e.reciprocate = function(e) {
		return h(e).reciprocate();
	}, e.cmp = function(e, t) {
		return h(e).cmp(t);
	}, e.compare = function(e, t) {
		return h(e).cmp(t);
	}, e.eq = function(e, t) {
		return h(e).eq(t);
	}, e.equals = function(e, t) {
		return h(e).eq(t);
	}, e.neq = function(e, t) {
		return h(e).neq(t);
	}, e.notEquals = function(e, t) {
		return h(e).notEquals(t);
	}, e.lt = function(e, t) {
		return h(e).lt(t);
	}, e.lte = function(e, t) {
		return h(e).lte(t);
	}, e.gt = function(e, t) {
		return h(e).gt(t);
	}, e.gte = function(e, t) {
		return h(e).gte(t);
	}, e.max = function(e, t) {
		return h(e).max(t);
	}, e.min = function(e, t) {
		return h(e).min(t);
	}, e.clamp = function(e, t, n) {
		return h(e).clamp(t, n);
	}, e.clampMin = function(e, t) {
		return h(e).clampMin(t);
	}, e.clampMax = function(e, t) {
		return h(e).clampMax(t);
	}, e.cmp_tolerance = function(e, t, n) {
		return h(e).cmp_tolerance(t, n);
	}, e.compare_tolerance = function(e, t, n) {
		return h(e).cmp_tolerance(t, n);
	}, e.eq_tolerance = function(e, t, n) {
		return h(e).eq_tolerance(t, n);
	}, e.equals_tolerance = function(e, t, n) {
		return h(e).eq_tolerance(t, n);
	}, e.neq_tolerance = function(e, t, n) {
		return h(e).neq_tolerance(t, n);
	}, e.notEquals_tolerance = function(e, t, n) {
		return h(e).notEquals_tolerance(t, n);
	}, e.lt_tolerance = function(e, t, n) {
		return h(e).lt_tolerance(t, n);
	}, e.lte_tolerance = function(e, t, n) {
		return h(e).lte_tolerance(t, n);
	}, e.gt_tolerance = function(e, t, n) {
		return h(e).gt_tolerance(t, n);
	}, e.gte_tolerance = function(e, t, n) {
		return h(e).gte_tolerance(t, n);
	}, e.log10 = function(e) {
		return h(e).log10();
	}, e.absLog10 = function(e) {
		return h(e).absLog10();
	}, e.pLog10 = function(e) {
		return h(e).pLog10();
	}, e.log = function(e, t) {
		return h(e).log(t);
	}, e.log2 = function(e) {
		return h(e).log2();
	}, e.ln = function(e) {
		return h(e).ln();
	}, e.logarithm = function(e, t) {
		return h(e).logarithm(t);
	}, e.pow10 = function(e) {
		return Number.isInteger(e) ? _(1, e) : g(10 ** (e % 1), Math.trunc(e));
	}, e.pow = function(e, t) {
		return typeof e == "number" && e === 10 && typeof t == "number" && Number.isInteger(t) ? _(1, t) : h(e).pow(t);
	}, e.exp = function(e) {
		return h(e).exp();
	}, e.sqr = function(e) {
		return h(e).sqr();
	}, e.sqrt = function(e) {
		return h(e).sqrt();
	}, e.cube = function(e) {
		return h(e).cube();
	}, e.cbrt = function(e) {
		return h(e).cbrt();
	}, e.dp = function(e) {
		return h(e).dp();
	}, e.decimalPlaces = function(e) {
		return h(e).dp();
	}, e.affordGeometricSeries = function(e, t, n, r) {
		return fe(h(e), h(t), h(n), r);
	}, e.sumGeometricSeries = function(e, t, n, r) {
		return pe(e, h(t), h(n), r);
	}, e.affordArithmeticSeries = function(e, t, n, r) {
		return function(e, t, n, r) {
			var i = t.add(r.mul(n)).sub(n.div(2)), a = i.pow(2);
			return i.neg().add(a.add(n.mul(e).mul(2)).sqrt()).div(n).floor();
		}(h(e), h(t), h(n), h(r));
	}, e.sumArithmeticSeries = function(e, t, n, r) {
		return function(e, t, n, r) {
			var i = t.add(r.mul(n));
			return e.div(2).mul(i.mul(2).plus(e.sub(1).mul(n)));
		}(h(e), h(t), h(n), h(r));
	}, e.efficiencyOfPurchase = function(e, t, n) {
		return function(e, t, n) {
			return e.div(t).add(e.div(n));
		}(h(e), h(t), h(n));
	}, e.randomDecimalForTesting = function(e) {
		if (20 * Math.random() < 1) return _(0, 0);
		var t = 10 * Math.random();
		10 * Math.random() < 1 && (t = Math.round(t)), t *= Math.sign(2 * Math.random() - 1);
		var n = Math.floor(Math.random() * e * 2) - e;
		return g(t, n);
	}, e.prototype.normalize = function() {
		if (this.m >= 1 && this.m < 10) return this;
		if (this.m === 0) return this.m = 0, this.e = 0, this;
		var e = Math.floor(Math.log10(Math.abs(this.m)));
		return this.m = e === -324 ? 10 * this.m / 1e-323 : this.m / m(e), this.e += e, this;
	}, e.prototype.fromMantissaExponent = function(e, t) {
		return isFinite(e) && isFinite(t) ? (this.m = e, this.e = t, this.normalize(), this) : (e = NaN, t = NaN, this);
	}, e.prototype.fromMantissaExponent_noNormalize = function(e, t) {
		return this.m = e, this.e = t, this;
	}, e.prototype.fromDecimal = function(e) {
		return this.m = e.m, this.e = e.e, this;
	}, e.prototype.fromNumber = function(e) {
		return isNaN(e) ? (this.m = NaN, this.e = NaN) : e === Infinity ? (this.m = 1, this.e = p) : e === -Infinity ? (this.m = -1, this.e = p) : e === 0 ? (this.m = 0, this.e = 0) : (this.e = Math.floor(Math.log10(Math.abs(e))), this.m = this.e === -324 ? 10 * e / 1e-323 : e / m(this.e), this.normalize()), this;
	}, e.prototype.fromString = function(e) {
		if (e.indexOf("e") !== -1) {
			var t = e.split("e");
			this.m = parseFloat(t[0]), this.e = parseFloat(t[1]), this.normalize();
		} else if (e === "NaN") this.m = NaN, this.e = NaN;
		else if (this.fromNumber(parseFloat(e)), isNaN(this.m)) throw Error("[DecimalError] Invalid argument: " + e);
		return this;
	}, e.prototype.fromValue = function(t) {
		return t instanceof e ? this.fromDecimal(t) : typeof t == "number" ? this.fromNumber(t) : typeof t == "string" ? this.fromString(t) : (this.m = 0, this.e = 0, this);
	}, e.prototype.toNumber = function() {
		if (!isFinite(this.e)) return NaN;
		if (this.e > 308) return this.m > 0 ? Infinity : -Infinity;
		if (this.e < -324) return 0;
		if (this.e === -324) return this.m > 0 ? 5e-324 : -5e-324;
		var e = this.m * m(this.e);
		if (!isFinite(e) || this.e < 0) return e;
		var t = Math.round(e);
		return Math.abs(t - e) < 1e-10 ? t : e;
	}, e.prototype.mantissaWithDecimalPlaces = function(e) {
		if (isNaN(this.m) || isNaN(this.e)) return NaN;
		if (this.m === 0) return 0;
		var t = e + 1, n = Math.ceil(Math.log10(Math.abs(this.m))), r = Math.round(this.m * 10 ** (t - n)) * 10 ** (n - t);
		return parseFloat(r.toFixed(Math.max(t - n, 0)));
	}, e.prototype.toString = function() {
		return isNaN(this.m) || isNaN(this.e) ? "NaN" : this.e >= p ? this.m > 0 ? "Infinity" : "-Infinity" : this.e <= -p || this.m === 0 ? "0" : this.e < 21 && this.e > -7 ? this.toNumber().toString() : this.m + "e" + (this.e >= 0 ? "+" : "") + this.e;
	}, e.prototype.toExponential = function(e) {
		if (isNaN(this.m) || isNaN(this.e)) return "NaN";
		if (this.e >= p) return this.m > 0 ? "Infinity" : "-Infinity";
		if (this.e <= -p || this.m === 0) return "0" + (e > 0 ? (0, de.default)(".", e + 1, "0") : "") + "e+0";
		if (this.e > -324 && this.e < 308) return this.toNumber().toExponential(e);
		isFinite(e) || (e = 17);
		var t = e + 1, n = Math.max(1, Math.ceil(Math.log10(Math.abs(this.m))));
		return (Math.round(this.m * 10 ** (t - n)) * 10 ** (n - t)).toFixed(Math.max(t - n, 0)) + "e" + (this.e >= 0 ? "+" : "") + this.e;
	}, e.prototype.toFixed = function(e) {
		return isNaN(this.m) || isNaN(this.e) ? "NaN" : this.e >= p ? this.m > 0 ? "Infinity" : "-Infinity" : this.e <= -p || this.m === 0 ? "0" + (e > 0 ? (0, de.default)(".", e + 1, "0") : "") : this.e >= 17 ? this.m.toString().replace(".", "").padEnd(this.e + 1, "0") + (e > 0 ? (0, de.default)(".", e + 1, "0") : "") : this.toNumber().toFixed(e);
	}, e.prototype.toPrecision = function(e) {
		return this.e <= -7 ? this.toExponential(e - 1) : e > this.e ? this.toFixed(e - this.e - 1) : this.toExponential(e - 1);
	}, e.prototype.valueOf = function() {
		return this.toString();
	}, e.prototype.toJSON = function() {
		return this.toString();
	}, e.prototype.toStringWithDecimalPlaces = function(e) {
		return this.toExponential(e);
	}, e.prototype.abs = function() {
		return _(Math.abs(this.m), this.e);
	}, e.prototype.neg = function() {
		return _(-this.m, this.e);
	}, e.prototype.negate = function() {
		return this.neg();
	}, e.prototype.negated = function() {
		return this.neg();
	}, e.prototype.sign = function() {
		return Math.sign(this.m);
	}, e.prototype.sgn = function() {
		return this.sign();
	}, e.prototype.round = function() {
		return this.e < -1 ? new e(0) : this.e < 17 ? new e(Math.round(this.toNumber())) : this;
	}, e.prototype.floor = function() {
		return this.e < -1 ? Math.sign(this.m) >= 0 ? new e(0) : new e(-1) : this.e < 17 ? new e(Math.floor(this.toNumber())) : this;
	}, e.prototype.ceil = function() {
		return this.e < -1 ? Math.sign(this.m) > 0 ? new e(1) : new e(0) : this.e < 17 ? new e(Math.ceil(this.toNumber())) : this;
	}, e.prototype.trunc = function() {
		return this.e < 0 ? new e(0) : this.e < 17 ? new e(Math.trunc(this.toNumber())) : this;
	}, e.prototype.add = function(e) {
		var t, n, r = h(e);
		return this.m === 0 ? r : r.m === 0 ? this : (this.e >= r.e ? (t = this, n = r) : (t = r, n = this), t.e - n.e > 17 ? t : g(Math.round(0x5af3107a4000 * t.m + 0x5af3107a4000 * n.m * m(n.e - t.e)), t.e - 14));
	}, e.prototype.plus = function(e) {
		return this.add(e);
	}, e.prototype.sub = function(e) {
		return this.add(h(e).neg());
	}, e.prototype.subtract = function(e) {
		return this.sub(e);
	}, e.prototype.minus = function(e) {
		return this.sub(e);
	}, e.prototype.mul = function(t) {
		if (typeof t == "number") return t < 1e307 && t > -1e307 ? g(this.m * t, this.e) : g(1e-307 * this.m * t, this.e + 307);
		var n = typeof t == "string" ? new e(t) : t;
		return g(this.m * n.m, this.e + n.e);
	}, e.prototype.multiply = function(e) {
		return this.mul(e);
	}, e.prototype.times = function(e) {
		return this.mul(e);
	}, e.prototype.div = function(e) {
		return this.mul(h(e).recip());
	}, e.prototype.divide = function(e) {
		return this.div(e);
	}, e.prototype.divideBy = function(e) {
		return this.div(e);
	}, e.prototype.dividedBy = function(e) {
		return this.div(e);
	}, e.prototype.recip = function() {
		return g(1 / this.m, -this.e);
	}, e.prototype.reciprocal = function() {
		return this.recip();
	}, e.prototype.reciprocate = function() {
		return this.recip();
	}, e.prototype.cmp = function(e) {
		var t = h(e);
		if (this.m === 0) {
			if (t.m === 0) return 0;
			if (t.m < 0) return 1;
			if (t.m > 0) return -1;
		}
		if (t.m === 0) {
			if (this.m < 0) return -1;
			if (this.m > 0) return 1;
		}
		if (this.m > 0) return t.m < 0 || this.e > t.e ? 1 : this.e < t.e ? -1 : this.m > t.m ? 1 : this.m < t.m ? -1 : 0;
		if (this.m < 0) return t.m > 0 || this.e > t.e ? -1 : this.e < t.e || this.m > t.m ? 1 : this.m < t.m ? -1 : 0;
		throw Error("Unreachable code");
	}, e.prototype.compare = function(e) {
		return this.cmp(e);
	}, e.prototype.eq = function(e) {
		var t = h(e);
		return this.e === t.e && this.m === t.m;
	}, e.prototype.equals = function(e) {
		return this.eq(e);
	}, e.prototype.neq = function(e) {
		return !this.eq(e);
	}, e.prototype.notEquals = function(e) {
		return this.neq(e);
	}, e.prototype.lt = function(e) {
		var t = h(e);
		return this.m === 0 ? t.m > 0 : t.m === 0 ? this.m <= 0 : this.e === t.e ? this.m < t.m : this.m > 0 ? t.m > 0 && this.e < t.e : t.m > 0 || this.e > t.e;
	}, e.prototype.lte = function(e) {
		return !this.gt(e);
	}, e.prototype.gt = function(e) {
		var t = h(e);
		return this.m === 0 ? t.m < 0 : t.m === 0 ? this.m > 0 : this.e === t.e ? this.m > t.m : this.m > 0 ? t.m < 0 || this.e > t.e : t.m < 0 && this.e < t.e;
	}, e.prototype.gte = function(e) {
		return !this.lt(e);
	}, e.prototype.max = function(e) {
		var t = h(e);
		return this.lt(t) ? t : this;
	}, e.prototype.min = function(e) {
		var t = h(e);
		return this.gt(t) ? t : this;
	}, e.prototype.clamp = function(e, t) {
		return this.max(e).min(t);
	}, e.prototype.clampMin = function(e) {
		return this.max(e);
	}, e.prototype.clampMax = function(e) {
		return this.min(e);
	}, e.prototype.cmp_tolerance = function(e, t) {
		var n = h(e);
		return this.eq_tolerance(n, t) ? 0 : this.cmp(n);
	}, e.prototype.compare_tolerance = function(e, t) {
		return this.cmp_tolerance(e, t);
	}, e.prototype.eq_tolerance = function(t, n) {
		var r = h(t);
		return e.lte(this.sub(r).abs(), e.max(this.abs(), r.abs()).mul(n));
	}, e.prototype.equals_tolerance = function(e, t) {
		return this.eq_tolerance(e, t);
	}, e.prototype.neq_tolerance = function(e, t) {
		return !this.eq_tolerance(e, t);
	}, e.prototype.notEquals_tolerance = function(e, t) {
		return this.neq_tolerance(e, t);
	}, e.prototype.lt_tolerance = function(e, t) {
		var n = h(e);
		return !this.eq_tolerance(n, t) && this.lt(n);
	}, e.prototype.lte_tolerance = function(e, t) {
		var n = h(e);
		return this.eq_tolerance(n, t) || this.lt(n);
	}, e.prototype.gt_tolerance = function(e, t) {
		var n = h(e);
		return !this.eq_tolerance(n, t) && this.gt(n);
	}, e.prototype.gte_tolerance = function(e, t) {
		var n = h(e);
		return this.eq_tolerance(n, t) || this.gt(n);
	}, e.prototype.log10 = function() {
		return this.e + Math.log10(this.m);
	}, e.prototype.absLog10 = function() {
		return this.e + Math.log10(Math.abs(this.m));
	}, e.prototype.pLog10 = function() {
		return this.m <= 0 || this.e < 0 ? 0 : this.log10();
	}, e.prototype.log = function(e) {
		return Math.LN10 / Math.log(e) * this.log10();
	}, e.prototype.log2 = function() {
		return 3.321928094887362 * this.log10();
	}, e.prototype.ln = function() {
		return 2.302585092994045 * this.log10();
	}, e.prototype.logarithm = function(e) {
		return this.log(e);
	}, e.prototype.pow = function(t) {
		var n, r = t instanceof e ? t.toNumber() : t, i = this.e * r;
		if (Number.isSafeInteger(i) && (n = this.m ** +r, isFinite(n) && n !== 0)) return g(n, i);
		var a = Math.trunc(i), o = i - a;
		if (n = 10 ** (r * Math.log10(this.m) + o), isFinite(n) && n !== 0) return g(n, a);
		var s = e.pow10(r * this.absLog10());
		return this.sign() === -1 ? Math.abs(r % 2) === 1 ? s.neg() : Math.abs(r % 2) === 0 ? s : new e(NaN) : s;
	}, e.prototype.pow_base = function(e) {
		return h(e).pow(this);
	}, e.prototype.factorial = function() {
		var t = this.toNumber() + 1;
		return e.pow(t / Math.E * Math.sqrt(t * Math.sinh(1 / t) + 1 / (810 * t ** 6)), t).mul(Math.sqrt(2 * Math.PI / t));
	}, e.prototype.exp = function() {
		var t = this.toNumber();
		return -706 < t && t < 709 ? e.fromNumber(Math.exp(t)) : e.pow(Math.E, t);
	}, e.prototype.sqr = function() {
		return g(this.m ** 2, 2 * this.e);
	}, e.prototype.sqrt = function() {
		return this.m < 0 ? new e(NaN) : this.e % 2 == 0 ? g(Math.sqrt(this.m), Math.floor(this.e / 2)) : g(3.16227766016838 * Math.sqrt(this.m), Math.floor(this.e / 2));
	}, e.prototype.cube = function() {
		return g(this.m ** 3, 3 * this.e);
	}, e.prototype.cbrt = function() {
		var e = 1, t = this.m;
		t < 0 && (e = -1, t = -t);
		var n = e * t ** (1 / 3), r = this.e % 3;
		return g(r === 1 || r === -1 ? 2.154434690031883 * n : r === 0 ? n : 4.641588833612778 * n, Math.floor(this.e / 3));
	}, e.prototype.sinh = function() {
		return this.exp().sub(this.negate().exp()).div(2);
	}, e.prototype.cosh = function() {
		return this.exp().add(this.negate().exp()).div(2);
	}, e.prototype.tanh = function() {
		return this.sinh().div(this.cosh());
	}, e.prototype.asinh = function() {
		return e.ln(this.add(this.sqr().add(1).sqrt()));
	}, e.prototype.acosh = function() {
		return e.ln(this.add(this.sqr().sub(1).sqrt()));
	}, e.prototype.atanh = function() {
		return this.abs().gte(1) ? NaN : e.ln(this.add(1).div(new e(1).sub(this))) / 2;
	}, e.prototype.ascensionPenalty = function(e) {
		return e === 0 ? this : this.pow(10 ** -e);
	}, e.prototype.egg = function() {
		return this.add(9);
	}, e.prototype.lessThanOrEqualTo = function(e) {
		return this.cmp(e) < 1;
	}, e.prototype.lessThan = function(e) {
		return this.cmp(e) < 0;
	}, e.prototype.greaterThanOrEqualTo = function(e) {
		return this.cmp(e) > -1;
	}, e.prototype.greaterThan = function(e) {
		return this.cmp(e) > 0;
	}, e.prototype.decimalPlaces = function() {
		return this.dp();
	}, e.prototype.dp = function() {
		if (!isFinite(this.mantissa)) return NaN;
		if (this.exponent >= 17) return 0;
		for (var e = this.mantissa, t = -this.exponent, n = 1; Math.abs(Math.round(e * n) / n - e) > 1e-10;) n *= 10, t++;
		return t > 0 ? t : 0;
	}, Object.defineProperty(e, "MAX_VALUE", {
		get: function() {
			return me;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "MIN_VALUE", {
		get: function() {
			return he;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "NUMBER_MAX_VALUE", {
		get: function() {
			return ge;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e, "NUMBER_MIN_VALUE", {
		get: function() {
			return _e;
		},
		enumerable: !1,
		configurable: !0
	}), e;
}(), me = _(1, p), he = _(1, -p), ge = h(Number.MAX_VALUE), _e = h(Number.MIN_VALUE), y = class e {
	#e;
	constructor(e) {
		if (!Number.isFinite(e.m) || !Number.isFinite(e.e)) throw RangeError("GameNumber cannot contain NaN or Infinity.");
		this.#e = e;
	}
	static zero() {
		return new e(v.fromNumber(0));
	}
	static one() {
		return new e(v.fromNumber(1));
	}
	static from(t) {
		return t instanceof e ? t : typeof t == "number" || typeof t == "string" ? new e(v.fromValue(t)) : e.deserialize(t);
	}
	static deserialize(t) {
		if (!Number.isFinite(t.mantissa) || !Number.isFinite(t.exponent)) throw RangeError("Serialized GameNumber must be finite.");
		return new e(v.fromMantissaExponent(t.mantissa, t.exponent));
	}
	add(t) {
		return new e(this.#e.add(e.decimalOf(t)));
	}
	subtract(t) {
		return new e(this.#e.sub(e.decimalOf(t)));
	}
	multiply(t) {
		return new e(this.#e.mul(e.decimalOf(t)));
	}
	divide(t) {
		let n = e.decimalOf(t);
		if (n.eq(0)) throw RangeError("Division by zero.");
		return new e(this.#e.div(n));
	}
	pow(t) {
		if (!Number.isFinite(t)) throw RangeError("GameNumber exponent must be finite.");
		return new e(this.#e.pow(t));
	}
	floor() {
		return new e(this.#e.floor());
	}
	ceil() {
		return new e(this.#e.ceil());
	}
	round() {
		return new e(this.#e.round());
	}
	compare(t) {
		return this.#e.cmp(e.decimalOf(t));
	}
	equals(e) {
		return this.compare(e) === 0;
	}
	greaterThanOrEqual(e) {
		return this.compare(e) >= 0;
	}
	greaterThan(e) {
		return this.compare(e) > 0;
	}
	lessThan(e) {
		return this.compare(e) < 0;
	}
	isNegative() {
		return this.compare(0) < 0;
	}
	isZero() {
		return this.compare(0) === 0;
	}
	log10() {
		return this.#e.log10();
	}
	toNumber() {
		return this.#e.toNumber();
	}
	serialize() {
		return Object.freeze({
			mantissa: this.#e.m,
			exponent: this.#e.e
		});
	}
	toString() {
		return this.#e.toString();
	}
	static decimalOf(t) {
		return t instanceof e ? v.fromMantissaExponent(t.#e.m, t.#e.e) : typeof t == "number" || typeof t == "string" ? v.fromValue(t) : v.fromMantissaExponent(t.mantissa, t.exponent);
	}
}, ve = (e) => y.from(e);
//#endregion
//#region src/domain/curve/curve.ts
function b(e, t) {
	switch (Te(t), e.type) {
		case "linear": return y.from(e.base).add(y.from(e.step).multiply(t));
		case "polynomial": return ye(e.coefficients, t);
		case "geometric":
			if (!(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric ratio must be finite and positive.");
			return y.from(e.base).multiply(y.from(e.ratio).pow(t));
		case "table": {
			let n = e.values[t];
			if (n === void 0) throw RangeError(`Curve table has no value at index ${t}.`);
			return y.from(n);
		}
		case "piecewise": {
			let n = Se(e, t);
			return b(n.curve, t - n.startIndex);
		}
	}
}
function x(e, t, n) {
	if (Te(t), Ee(n), De(t, n), n === 0) return y.zero();
	if (e.type === "linear") {
		let r = b(e, t), i = b(e, t + n - 1);
		return r.add(i).multiply(n).divide(2);
	}
	if (e.type === "polynomial") return be(e.coefficients, t + n).subtract(be(e.coefficients, t));
	if (e.type === "geometric") {
		if (!(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric ratio must be finite and positive.");
		return e.ratio === 1 ? b(e, t).multiply(n) : b(e, t).multiply(y.from(e.ratio).pow(n).subtract(1)).divide(e.ratio - 1);
	}
	if (e.type === "piecewise") {
		we(e.segments);
		let r = y.zero(), i = t, a = n;
		for (; a > 0;) {
			let t = Ce(e.segments, i), n = e.segments[t], o = e.segments[t + 1]?.startIndex, s = o === void 0 ? a : Math.min(a, o - i);
			r = r.add(x(n.curve, i - n.startIndex, s)), i += s, a -= s;
		}
		return r;
	}
	let r = y.zero();
	for (let i = t; i < t + n; i += 1) r = r.add(b(e, i));
	return r;
}
function ye(e, t) {
	if (e.length === 0) throw RangeError("Polynomial curve must contain at least one coefficient.");
	let n = y.zero();
	for (let r = e.length - 1; r >= 0; --r) n = n.multiply(t).add(e[r]);
	return n;
}
function be(e, t) {
	if (Te(t), e.length === 0) throw RangeError("Polynomial curve must contain at least one coefficient.");
	let n = [y.zero()], r = y.zero();
	for (let t = 0; t <= e.length - 1; t += 1) r = r.add(ye(e, t)), n.push(r);
	let i = n, a = y.zero();
	for (let e = 0; e < n.length; e += 1) a = a.add(i[0].multiply(xe(t, e))), i = i.slice(1).map((e, t) => e.subtract(i[t]));
	return a;
}
function xe(e, t) {
	if (t < 0 || t > e) return y.zero();
	let n = y.one();
	for (let r = 1; r <= t; r += 1) n = n.multiply(e - r + 1).divide(r);
	return n;
}
function Se(e, t) {
	return we(e.segments), e.segments[Ce(e.segments, t)];
}
function Ce(e, t) {
	let n = 0, r = e.length - 1;
	for (; n < r;) {
		let i = Math.ceil((n + r) / 2);
		e[i].startIndex <= t ? n = i : r = i - 1;
	}
	return n;
}
function we(e) {
	if (e.length === 0 || e[0]?.startIndex !== 0) throw RangeError("Piecewise curve must start with segment index 0.");
	let t = -1;
	for (let n of e) {
		if (!Number.isSafeInteger(n.startIndex) || n.startIndex <= t) throw RangeError("Piecewise curve segment startIndex must be strictly increasing safe integers.");
		t = n.startIndex;
	}
}
function Te(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Curve index must be a non-negative safe integer.");
}
function Ee(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Curve count must be a non-negative safe integer.");
}
function De(e, t) {
	if (t > 2 ** 53 - 1 - e) throw RangeError("Curve interval end must remain a safe integer.");
}
//#endregion
//#region src/application/curve-purchase.ts
function Oe(e) {
	Ae(e.startIndex), ke(e.curve);
	let t = y.from(e.balance);
	if (t.isNegative()) throw RangeError("Purchase balance must be non-negative.");
	let n = e.curve.type === "table" ? Math.max(0, e.curve.values.length - e.startIndex) : 2 ** 53 - 1 - e.startIndex, r = e.maxCount === void 0 ? n : Math.min(je(e.maxCount), n);
	if (r === 0) return s(0);
	let i = (n) => x(e.curve, e.startIndex, n).compare(t) <= 0;
	if (!i(1)) return s(0);
	let a = 1, o = 1;
	for (; o < r;) {
		let e = Math.min(r, o * 2);
		if (!i(e)) {
			o = e;
			break;
		}
		a = e, o = e;
	}
	if (a < o) {
		let e = a + 1, t = o - 1;
		for (; e <= t;) {
			let n = e + Math.floor((t - e) / 2);
			i(n) ? (a = n, e = n + 1) : t = n - 1;
		}
	}
	return s(a);
	function s(n) {
		let i = x(e.curve, e.startIndex, n), a = n === r;
		return {
			count: n,
			totalCost: i,
			remainingBalance: t.subtract(i),
			nextUnitCost: a ? null : b(e.curve, e.startIndex + n),
			reachedLimit: a
		};
	}
}
function ke(e) {
	switch (e.type) {
		case "linear":
			S(e.base, "Linear purchase curve base"), S(e.step, "Linear purchase curve step");
			return;
		case "polynomial":
			if (e.coefficients.length === 0) throw RangeError("Polynomial purchase curve must contain coefficients.");
			e.coefficients.forEach((e, t) => S(e, `Polynomial purchase curve coefficient ${t}`));
			return;
		case "geometric":
			if (S(e.base, "Geometric purchase curve base"), !(e.ratio > 0) || !Number.isFinite(e.ratio)) throw RangeError("Geometric purchase curve ratio must be positive and finite.");
			return;
		case "table":
			e.values.forEach((e, t) => S(e, `Table purchase curve value ${t}`));
			return;
		case "piecewise": {
			if (e.segments.length === 0 || e.segments[0]?.startIndex !== 0) throw RangeError("Piecewise purchase curve must start at index 0.");
			let t = -1;
			for (let n of e.segments) {
				if (!Number.isSafeInteger(n.startIndex) || n.startIndex <= t) throw RangeError("Piecewise purchase curve startIndex must be strictly increasing safe integers.");
				t = n.startIndex, ke(n.curve);
			}
		}
	}
}
function S(e, t) {
	if (y.from(e).isNegative()) throw RangeError(`${t} must be non-negative.`);
}
function Ae(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Purchase startIndex must be a non-negative safe integer.");
}
function je(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Purchase maxCount must be a non-negative safe integer.");
	return e;
}
//#endregion
//#region src/application/engagement-cues.ts
function Me(e, t) {
	Re(t);
	let n = /* @__PURE__ */ new Set(), r = e.filter((e) => {
		if (Ie(e), n.has(e.id)) throw RangeError(`Duplicate attention candidate ID: ${e.id}`);
		return n.add(e.id), e.available && (e.expiresAtSimTimeSec === void 0 || e.expiresAtSimTimeSec > t);
	}).toSorted(Pe);
	return {
		items: r,
		primary: r[0] ?? null,
		count: r.length,
		actionableCount: r.filter((e) => e.urgency !== "notice").length,
		urgentCount: r.filter((e) => e.urgency === "urgent").length
	};
}
function Ne(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		if (Le(e), t.has(e.id)) throw RangeError(`Duplicate meaningful target ID: ${e.id}`);
		return t.add(e.id), e.available && e.progress < 1;
	}).toSorted((e, t) => t.priority - e.priority || t.progress - e.progress || e.id.localeCompare(t.id))[0] ?? null;
}
function Pe(e, t) {
	let n = Fe(t.urgency) - Fe(e.urgency);
	return n === 0 ? t.priority === e.priority ? (e.expiresAtSimTimeSec ?? Infinity) - (t.expiresAtSimTimeSec ?? Infinity) || e.id.localeCompare(t.id) : t.priority - e.priority : n;
}
function Fe(e) {
	switch (e) {
		case "notice": return 0;
		case "action": return 1;
		case "urgent": return 2;
	}
}
function Ie(e) {
	if (e.id.length === 0) throw RangeError("Attention candidate ID must not be empty.");
	if (e.kind.length === 0) throw RangeError("Attention candidate kind must not be empty.");
	if (!Number.isFinite(e.priority)) throw RangeError(`Attention priority must be finite: ${e.id}`);
	if (e.expiresAtSimTimeSec !== void 0 && (!Number.isSafeInteger(e.expiresAtSimTimeSec) || e.expiresAtSimTimeSec < 0)) throw RangeError(`Attention expiry must be a non-negative safe integer: ${e.id}`);
}
function Le(e) {
	if (e.id.length === 0) throw RangeError("Meaningful target ID must not be empty.");
	if (e.kind.length === 0) throw RangeError("Meaningful target kind must not be empty.");
	if (!Number.isFinite(e.priority)) throw RangeError(`Meaningful target priority must be finite: ${e.id}`);
	if (!Number.isFinite(e.progress) || e.progress < 0 || e.progress > 1) throw RangeError(`Meaningful target progress must be finite and in [0, 1]: ${e.id}`);
}
function Re(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("simTimeSec must be a non-negative safe integer.");
}
//#endregion
//#region src/application/format-game-number.ts
var ze = [
	"",
	"K",
	"M",
	"B",
	"T",
	"Qa",
	"Qi",
	"Sx",
	"Sp",
	"Oc",
	"No",
	"Dc"
];
function Be(e, t = 1) {
	if (e.isZero()) return "0";
	let n = e.serialize(), r = n.exponent;
	if (r < 3 && r > -4) return e.toNumber().toLocaleString("ja-JP", { maximumFractionDigits: t });
	let i = Math.floor(r / 3);
	return i > 0 && i < ze.length ? `${(n.mantissa * 10 ** (r - i * 3)).toFixed(t).replace(/\.0+$/, "")}${ze[i]}` : `${n.mantissa.toFixed(t)}e${n.exponent}`;
}
//#endregion
//#region src/application/offline-time.ts
function Ve(e, t, n = {}) {
	if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError("Offline wall clocks must be finite.");
	if (n.maxOfflineSec !== void 0 && (!Number.isSafeInteger(n.maxOfflineSec) || n.maxOfflineSec < 0)) throw RangeError("maxOfflineSec must be a non-negative safe integer.");
	let r = Math.max(0, t - e), i = Math.floor(r / 1e3), a = n.maxOfflineSec === void 0 ? i : Math.min(i, n.maxOfflineSec);
	return {
		observedElapsedSec: i,
		appliedElapsedSec: a,
		discardedByCapSec: i - a,
		nextWallClockMs: e + i * 1e3
	};
}
//#endregion
//#region src/application/offline-advance.ts
function He(e) {
	if (Ue("targetSimTimeSec", e.targetSimTimeSec), !Number.isSafeInteger(e.maxChunkSec) || e.maxChunkSec <= 0) throw RangeError("maxChunkSec must be a positive safe integer.");
	let t = e.initialState, n = e.getSimTimeSec(t);
	if (Ue("initial state simTimeSec", n), e.targetSimTimeSec < n) throw RangeError("targetSimTimeSec must be at or after current state simTimeSec.");
	let r = e.initialAccumulator, i = 0;
	for (; n < e.targetSimTimeSec;) {
		let a = Math.min(e.targetSimTimeSec, n + e.maxChunkSec), o = e.advanceChunk(t, a), s = e.getSimTimeSec(o.state);
		if (Ue("advanced state simTimeSec", s), s !== a) throw Error("Offline chunk advance must end exactly at its requested target (requested " + a + ", received " + s + ").");
		r = e.accumulate(r, o.events, {
			chunkIndex: i,
			fromSimTimeSec: n,
			toSimTimeSec: a
		}), t = o.state, n = s, i += 1;
	}
	return {
		state: t,
		accumulator: r,
		chunkCount: i
	};
}
function Ue(e, t) {
	if (!Number.isSafeInteger(t) || t < 0) throw RangeError(e + " must be a non-negative safe integer.");
}
//#endregion
//#region src/application/offline-return-summary.ts
function We(e) {
	let t = e.minimumObservedElapsedSec ?? 0;
	if (!Number.isSafeInteger(t) || t < 0) throw RangeError("minimumObservedElapsedSec must be a non-negative safe integer.");
	return Ge(e.elapsed), !e.meaningfulChange || e.elapsed.observedElapsedSec < t || e.elapsed.appliedElapsedSec === 0 ? null : {
		elapsed: e.elapsed,
		gains: e.gains ?? [],
		progressionChanges: e.progressionChanges ?? [],
		rewardSignals: e.rewardSignals ?? [],
		nextTarget: e.nextTarget ?? null
	};
}
function Ge(e) {
	for (let [t, n] of [
		["observedElapsedSec", e.observedElapsedSec],
		["appliedElapsedSec", e.appliedElapsedSec],
		["discardedByCapSec", e.discardedByCapSec]
	]) if (!Number.isSafeInteger(n) || n < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
	if (!Number.isFinite(e.nextWallClockMs)) throw RangeError("nextWallClockMs must be finite.");
	if (e.appliedElapsedSec > e.observedElapsedSec) throw RangeError("appliedElapsedSec must not exceed observedElapsedSec.");
	if (e.discardedByCapSec !== e.observedElapsedSec - e.appliedElapsedSec) throw RangeError("discardedByCapSec must match observed minus applied elapsed time.");
}
//#endregion
//#region src/application/reward-signals.ts
function Ke(e, t) {
	let n = [];
	for (let r of e) {
		let e = t(r);
		e != null && (qe(e) ? n.push(...e) : n.push(e));
	}
	let r = /* @__PURE__ */ new Set();
	for (let e of n) {
		if (Je(e), r.has(e.id)) throw RangeError(`Duplicate reward signal ID: ${e.id}`);
		r.add(e.id);
	}
	return n.toSorted((e, t) => e.simTimeSec - t.simTimeSec || e.id.localeCompare(t.id));
}
function qe(e) {
	return Array.isArray(e);
}
function Je(e) {
	if (e.id.length === 0) throw RangeError("Reward signal ID must not be empty.");
	if (!Number.isSafeInteger(e.simTimeSec) || e.simTimeSec < 0) throw RangeError(`Reward signal simTimeSec must be a non-negative safe integer: ${e.id}`);
	if (![
		"micro",
		"meaningful",
		"major"
	].includes(e.tier)) throw RangeError(`Unknown reward signal tier: ${e.id}`);
	if (typeof e.surprise != "boolean" || typeof e.nextExpectationCreated != "boolean") throw RangeError(`Reward signal flags must be boolean: ${e.id}`);
	if (e.anticipationKey !== void 0 && e.anticipationKey.length === 0) throw RangeError(`Reward signal anticipationKey must not be empty: ${e.id}`);
}
//#endregion
//#region src/application/rewarded-ad-flow.ts
async function Ye(e) {
	let t;
	try {
		t = await e.adapter.showRewarded(e.offerId);
	} catch {
		return "error";
	}
	if (t.status !== "reward-granted") return t.status;
	try {
		return await e.grantReward(t.externalGrantId) ? "granted" : "rejected";
	} catch {
		return "error";
	}
}
//#endregion
//#region src/application/state-migration.ts
function Xe(e) {
	if (Ze(e.currentSchemaVersion), Qe(e.migrations ?? []), !$e(e.candidate)) return {
		accepted: !1,
		reason: "not-object"
	};
	if (e.candidate.gameId !== e.expectedGameId) return {
		accepted: !1,
		reason: "wrong-game"
	};
	if (!C(e.candidate.schemaVersion)) return {
		accepted: !1,
		reason: "invalid-schema-version"
	};
	let t = e.candidate.schemaVersion;
	if (t > e.currentSchemaVersion) return {
		accepted: !1,
		reason: "newer-schema",
		schemaVersion: t
	};
	let n = new Map((e.migrations ?? []).map((e) => [e.fromSchemaVersion, e])), r = e.candidate, i = t, a = 0;
	for (; i < e.currentSchemaVersion;) {
		let t = n.get(i);
		if (t === void 0) return {
			accepted: !1,
			reason: "missing-migration",
			schemaVersion: i
		};
		let o;
		try {
			o = t.migrate(r);
		} catch {
			return {
				accepted: !1,
				reason: "migration-failed",
				schemaVersion: i,
				failedFromSchemaVersion: i
			};
		}
		if (!$e(o) || o.gameId !== e.expectedGameId || o.schemaVersion !== t.toSchemaVersion) return {
			accepted: !1,
			reason: "migration-failed",
			schemaVersion: i,
			failedFromSchemaVersion: i
		};
		r = o, i = t.toSchemaVersion, a += 1;
	}
	let o = !1;
	if (e.normalize !== void 0) try {
		let t = e.normalize(r);
		o = t !== r, r = t;
	} catch {
		return {
			accepted: !1,
			reason: "normalization-failed",
			schemaVersion: i
		};
	}
	return !$e(r) || r.gameId !== e.expectedGameId || r.schemaVersion !== e.currentSchemaVersion || !e.validate(r) ? {
		accepted: !1,
		reason: "invalid-state",
		schemaVersion: i
	} : {
		accepted: !0,
		state: r,
		initialSchemaVersion: t,
		finalSchemaVersion: e.currentSchemaVersion,
		migrationCount: a,
		normalized: o
	};
}
function Ze(e) {
	if (!C(e)) throw RangeError("currentSchemaVersion must be a non-negative safe integer.");
}
function Qe(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		if (!C(n.fromSchemaVersion) || !C(n.toSchemaVersion)) throw RangeError("State migration versions must be non-negative safe integers.");
		if (n.toSchemaVersion <= n.fromSchemaVersion) throw RangeError("State migration must advance schemaVersion.");
		if (t.has(n.fromSchemaVersion)) throw RangeError(`Duplicate state migration from schemaVersion ${n.fromSchemaVersion}.`);
		t.add(n.fromSchemaVersion);
	}
}
function C(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e >= 0;
}
function $e(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/application/save-transfer.ts
var et = "idle-game-kit-save-v1";
function tt(e, t) {
	let n = {
		formatId: et,
		gameId: e.gameId,
		exportedAtMs: t,
		state: e
	};
	return JSON.stringify(n, null, 2);
}
function nt(e, t) {
	let n;
	try {
		n = JSON.parse(e);
	} catch {
		return {
			accepted: !1,
			reason: "invalid-json"
		};
	}
	return !at(n) || n.formatId !== "idle-game-kit-save-v1" || typeof n.gameId != "string" || typeof n.exportedAtMs != "number" || !Number.isFinite(n.exportedAtMs) || !("state" in n) ? {
		accepted: !1,
		reason: "invalid-envelope"
	} : n.gameId === t ? {
		accepted: !0,
		envelope: {
			formatId: et,
			gameId: n.gameId,
			exportedAtMs: n.exportedAtMs,
			state: n.state
		}
	} : {
		accepted: !1,
		reason: "wrong-game"
	};
}
function rt(e, t, n) {
	let r = nt(e, t);
	return r.accepted ? n(r.envelope.state) ? {
		accepted: !0,
		envelope: {
			...r.envelope,
			state: r.envelope.state
		}
	} : {
		accepted: !1,
		reason: "invalid-state"
	} : r;
}
function it(e) {
	let t = nt(e.text, e.expectedGameId);
	if (!t.accepted) return t;
	let n = Xe({
		candidate: t.envelope.state,
		expectedGameId: e.expectedGameId,
		currentSchemaVersion: e.currentSchemaVersion,
		...e.migrations === void 0 ? {} : { migrations: e.migrations },
		...e.normalize === void 0 ? {} : { normalize: e.normalize },
		validate: e.validate
	});
	return n.accepted ? {
		accepted: !0,
		envelope: {
			...t.envelope,
			state: n.state
		},
		stateLoad: n
	} : {
		accepted: !1,
		reason: "invalid-state",
		stateLoad: n
	};
}
function at(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
//#endregion
//#region src/application/store.ts
var ot = class {
	#e;
	#t = /* @__PURE__ */ new Set();
	constructor(e) {
		this.#e = e;
	}
	getSnapshot = () => this.#e;
	subscribe = (e) => (this.#t.add(e), () => this.#t.delete(e));
	replaceState(e) {
		if (!Object.is(e, this.#e)) {
			this.#e = e;
			for (let e of this.#t) e();
		}
	}
	update(e) {
		this.replaceState(e(this.#e));
	}
};
//#endregion
//#region src/application/timeline-boundary.ts
function st(e) {
	if (ct("currentSimTimeSec", e.currentSimTimeSec), ct("targetSimTimeSec", e.targetSimTimeSec), e.targetSimTimeSec < e.currentSimTimeSec) throw RangeError("targetSimTimeSec must be at or after currentSimTimeSec.");
	if (e.targetSimTimeSec === e.currentSimTimeSec) return {
		targetSimTimeSec: e.targetSimTimeSec,
		boundaries: []
	};
	let t = /* @__PURE__ */ new Set(), n = [];
	if (e.candidates.forEach((r, i) => {
		if (r != null) {
			if (r.id.length === 0) throw RangeError("Timeline boundary id must not be empty.");
			if (t.has(r.id)) throw RangeError(`Duplicate timeline boundary id: ${r.id}`);
			if (t.add(r.id), ct(`timeline boundary ${r.id}`, r.atSimTimeSec), r.order !== void 0 && !Number.isSafeInteger(r.order)) throw RangeError(`Timeline boundary ${r.id} order must be a safe integer.`);
			if (r.atSimTimeSec <= e.currentSimTimeSec) throw RangeError(`Timeline boundary ${r.id} must be after currentSimTimeSec to guarantee progress.`);
			r.atSimTimeSec <= e.targetSimTimeSec && n.push({
				candidate: r,
				inputOrder: i
			});
		}
	}), n.length === 0) return {
		targetSimTimeSec: e.targetSimTimeSec,
		boundaries: []
	};
	let r = Math.min(...n.map(({ candidate: e }) => e.atSimTimeSec));
	return {
		targetSimTimeSec: r,
		boundaries: n.filter(({ candidate: e }) => e.atSimTimeSec === r).sort((e, t) => (e.candidate.order ?? 0) - (t.candidate.order ?? 0) || e.inputOrder - t.inputOrder).map(({ candidate: e }) => e)
	};
}
function ct(e, t) {
	if (!Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite non-negative number.`);
}
//#endregion
//#region src/domain/condition/condition.ts
function w(e, t) {
	switch (e.type) {
		case "and": return e.conditions.every((e) => w(e, t));
		case "or": return e.conditions.some((e) => w(e, t));
		case "not": return !w(e.condition, t);
		case "currency-balance-at-least": return t.currencyBalance(e.currencyId).greaterThanOrEqual(e.amount);
		case "lifetime-currency-earned-at-least": return t.lifetimeCurrencyEarned(e.currencyId).greaterThanOrEqual(e.amount);
		case "producer-count-at-least": return t.producerCount(e.producerId) >= e.count;
		case "producer-level-at-least": return T(t.producerLevel, "producerLevel")(e.producerId) >= e.level;
		case "character-owned": return t.characterOwned(e.characterDefinitionId);
		case "character-level-at-least": return T(t.characterLevel, "characterLevel")(e.characterDefinitionId) >= e.level;
		case "activity-progress-at-least": return t.activityProgress(e.activityId) >= e.progress;
		case "activity-milestone-reached": return T(t.activityMilestoneReached, "activityMilestoneReached")(e.activityId, e.milestoneId);
		case "achievement-completed": return t.achievementCompleted(e.achievementId);
		case "prestige-count-at-least": return T(t.prestigeCount, "prestigeCount")(e.prestigeId) >= e.count;
		case "gacha-draw-count-at-least": return T(t.gachaDrawCount, "gachaDrawCount")(e.gachaId) >= e.count;
		case "calendar-streak-at-least": return T(t.calendarStreak, "calendarStreak")(e.calendarRewardId) >= e.count;
		case "unlock-flag": return t.unlockFlag(e.flagId);
	}
}
function T(e, t) {
	if (e === void 0) throw Error(`ConditionContext.${t} is required for this predicate.`);
	return e;
}
//#endregion
//#region src/domain/achievement/achievement.ts
function lt(e, t, n) {
	let r = e.achievements[t.id] === !0;
	return {
		id: t.id,
		completed: r,
		visible: t.hidden !== !0 || r,
		progress: t.progressMetric === void 0 ? null : r ? 1 : ut(t.progressMetric, n)
	};
}
function ut(e, t) {
	switch (e.type) {
		case "currency-balance": return ft(t.currencyBalance(e.currencyId), e.target);
		case "lifetime-currency-earned": return ft(t.lifetimeCurrencyEarned(e.currencyId), e.target);
		case "producer-count": return E(t.producerCount(e.producerId), e.target);
		case "producer-level": return E(D(t.producerLevel, "producerLevel")(e.producerId), e.target);
		case "character-level": return E(D(t.characterLevel, "characterLevel")(e.characterDefinitionId), e.target);
		case "activity-progress": return E(t.activityProgress(e.activityId), e.target);
		case "gacha-draw-count": return E(D(t.gachaDrawCount, "gachaDrawCount")(e.gachaId), e.target);
		case "prestige-count": return E(D(t.prestigeCount, "prestigeCount")(e.prestigeId), e.target);
		case "calendar-streak": return E(D(t.calendarStreak, "calendarStreak")(e.calendarRewardId), e.target);
	}
}
function dt(e) {
	let t = e.state, n = [];
	for (let r of e.definitions) t.achievements[r.id] !== !0 && w(r.condition, e.createConditionContext(t)) && (t = {
		...t,
		achievements: {
			...t.achievements,
			[r.id]: !0
		}
	}, t = e.grantRewards(t, r.rewards), n.push({
		id: `achievement:${r.id}:${t.simTimeSec}`,
		type: "achievementCompleted",
		simTimeSec: t.simTimeSec,
		payload: { achievementId: r.id }
	}));
	return {
		state: t,
		events: n
	};
}
function ft(e, t) {
	let n = y.from(t);
	return n.compare(0) <= 0 || e.greaterThanOrEqual(n) ? 1 : e.compare(0) <= 0 ? 0 : pt(e.divide(n).toNumber());
}
function E(e, t) {
	if (!Number.isFinite(e) || !Number.isFinite(t)) throw RangeError("Achievement progress values must be finite.");
	return t <= 0 ? 1 : pt(e / t);
}
function pt(e) {
	return Math.min(1, Math.max(0, e));
}
function D(e, t) {
	if (e === void 0) throw Error(`ConditionContext.${t} is required for this achievement progress metric.`);
	return e;
}
//#endregion
//#region src/domain/currency/currency.ts
var O = (e, t) => y.deserialize(e[t] ?? y.zero().serialize());
function mt(e, t, n) {
	n !== void 0 && gt(n, t.currencyId);
	let r = y.from(t.amount);
	if (r.isNegative()) return {
		accepted: !1,
		balances: e,
		reason: "invalid-amount"
	};
	let i = ht(r, n), a = O(e, t.currencyId);
	if (t.kind === "spend") return n?.allowNegativeBalance !== !0 && a.compare(i) < 0 ? {
		accepted: !1,
		balances: e,
		reason: "insufficient-balance"
	} : c(a.subtract(i), i);
	let o = a.add(i), s = i;
	if (n?.cap !== void 0) {
		let e = y.from(n.cap);
		a.compare(e) < 0 && o.compare(e) > 0 ? (o = e, s = e.subtract(a)) : a.compare(e) >= 0 && (o = a, s = y.zero());
	}
	return c(o, s);
	function c(n, r) {
		return {
			accepted: !0,
			balances: {
				...e,
				[t.currencyId]: n.serialize()
			},
			appliedAmount: r
		};
	}
}
function ht(e, t) {
	if (t?.precision === void 0 || t.roundingMode === void 0) return e;
	let n = y.from(10).pow(t.precision), r = e.multiply(n);
	return (t.roundingMode === "floor" ? r.floor() : t.roundingMode === "ceil" ? r.ceil() : r.round()).divide(n);
}
function gt(e, t) {
	if (e.id !== t) throw RangeError(`CurrencyDefinition ID mismatch: expected ${t}, got ${e.id}`);
	if (e.precision !== void 0 != (e.roundingMode !== void 0)) throw RangeError("Currency precision and roundingMode must be specified together.");
	if (e.precision !== void 0 && (!Number.isSafeInteger(e.precision) || e.precision < 0)) throw RangeError("Currency precision must be a non-negative safe integer.");
	if (e.cap !== void 0 && y.from(e.cap).isNegative()) throw RangeError("Currency cap must be non-negative.");
}
//#endregion
//#region src/domain/modifier/modifier.ts
function _t(e) {
	return {
		id: e.id,
		operation: e.operation,
		value: e.value,
		...e.overridePriority === void 0 ? {} : { overridePriority: e.overridePriority }
	};
}
function vt(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = [];
	for (let a of e) {
		if (r.has(a)) continue;
		r.add(a);
		let e = t[a];
		if (e === void 0) throw Error(`Unknown active Modifier definition ID: ${a}`);
		e.target === n && i.push(_t(e));
	}
	return i;
}
function yt(e, t) {
	let n = t.filter((e) => e.operation === "flatAdd").reduce((e, t) => e.add(t.value), y.zero()), r = t.filter((e) => e.operation === "percentAdd").reduce((e, t) => e.add(t.value), y.zero()), i = t.filter((e) => e.operation === "multiply").reduce((e, t) => e.multiply(t.value), y.one()), a = y.from(e).add(n).multiply(y.one().add(r)).multiply(i), o = t.filter((e) => e.operation === "override").toSorted((e, t) => {
		let n = (t.overridePriority ?? 0) - (e.overridePriority ?? 0);
		return n === 0 ? e.id.localeCompare(t.id) : n;
	})[0];
	return o === void 0 ? a : y.from(o.value);
}
//#endregion
//#region src/domain/producer/producer.ts
function bt(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 0) throw RangeError("Producer ownedCount must be a non-negative safe integer.");
	let r = e[t] ?? {
		definitionId: t,
		ownedCount: 0,
		level: 1
	};
	return {
		...e,
		[t]: {
			...r,
			ownedCount: n
		}
	};
}
function xt(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 1) return {
		accepted: !1,
		producers: e,
		reason: "invalid-level"
	};
	let r = e[t];
	return r === void 0 ? {
		accepted: !1,
		producers: e,
		reason: "unknown-producer"
	} : {
		accepted: !0,
		producers: {
			...e,
			[t]: {
				...r,
				level: n
			}
		}
	};
}
//#endregion
//#region src/domain/token/token.ts
function St(e, t) {
	return e[t] ?? 0;
}
function Ct(e, t, n) {
	return Tt(n), {
		...e,
		[t]: St(e, t) + n
	};
}
function wt(e, t, n) {
	Tt(n);
	let r = St(e, t);
	return r < n ? {
		accepted: !1,
		tokens: e,
		reason: "insufficient-token"
	} : {
		accepted: !0,
		tokens: {
			...e,
			[t]: r - n
		}
	};
}
function Tt(e) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Token count must be a non-negative safe integer.");
}
//#endregion
//#region src/domain/reward/reward.ts
function Et(e, t, n = {}) {
	let r = e;
	for (let e of t) switch (e.type) {
		case "currency": {
			let t = mt(r.currencies, {
				currencyId: e.currencyId,
				amount: e.amount,
				kind: "earn",
				source: e.source
			}, n.resolveCurrencyDefinition?.(e.currencyId));
			if (!t.accepted) throw Error(`Invalid currency reward: ${e.currencyId}`);
			let i = y.deserialize(r.statistics.lifetimeCurrencyEarned[e.currencyId] ?? y.zero().serialize());
			r = {
				...r,
				currencies: t.balances,
				statistics: {
					...r.statistics,
					lifetimeCurrencyEarned: {
						...r.statistics.lifetimeCurrencyEarned,
						[e.currencyId]: i.add(t.appliedAmount).serialize()
					}
				}
			};
			break;
		}
		case "producer": {
			let t = r.producers[e.producerId]?.ownedCount ?? 0;
			r = {
				...r,
				producers: bt(r.producers, e.producerId, t + e.count)
			};
			break;
		}
		case "character":
			r = kt(n.grantCharacter, "character")(r, e.characterDefinitionId);
			break;
		case "token":
			r = {
				...r,
				tokens: Ct(r.tokens, e.tokenId, e.count)
			};
			break;
		case "boost":
			r = kt(n.activateBoost, "boost")(r, e.boostId);
			break;
		case "permanent-modifier":
			r = kt(n.grantPermanentModifier, "permanent-modifier")(r, e.modifierId);
			break;
		case "activity-advance": {
			if (!Number.isSafeInteger(e.seconds) || e.seconds <= 0) throw RangeError("Activity advance reward seconds must be a positive safe integer.");
			let t = n.advanceActivity;
			if (t === void 0) throw Error("Reward type activity-advance requires a RewardApplicationHooks handler.");
			r = t(r, e.activityId, e.seconds);
			break;
		}
		case "title":
			r = {
				...r,
				titles: {
					...r.titles,
					[e.titleId]: !0
				}
			};
			break;
		case "unlock":
			r = {
				...r,
				progressionFlags: {
					...r.progressionFlags,
					[e.flagId]: !0
				}
			};
			break;
		case "composite": r = Et(r, e.rewards, n);
	}
	return r;
}
function Dt(e, t, n) {
	let r = y.deserialize(e.statistics.lifetimeCurrencySpent[t] ?? y.zero().serialize());
	return {
		...e,
		statistics: {
			...e.statistics,
			lifetimeCurrencySpent: {
				...e.statistics.lifetimeCurrencySpent,
				[t]: r.add(n).serialize()
			}
		}
	};
}
var Ot = (e, t) => O(e.currencies, t);
function kt(e, t) {
	if (e === void 0) throw Error(`Reward type ${t} requires a RewardApplicationHooks handler.`);
	return e;
}
//#endregion
//#region src/domain/active-gain/active-gain.ts
function At(e) {
	let t = y.from(e.definition.baseAmount);
	if (t.isNegative()) throw RangeError("Active gain baseAmount must be non-negative.");
	if (e.definition.eligibility !== void 0) {
		if (e.createConditionContext === void 0) throw Error("Active gain eligibility requires createConditionContext.");
		if (!w(e.definition.eligibility, e.createConditionContext(e.state))) return {
			accepted: !1,
			state: e.state,
			events: [],
			reason: "ineligible"
		};
	}
	let n = yt(t, e.modifiers ?? []);
	if (n.isNegative()) throw RangeError("Active gain modifiers must not produce a negative reward.");
	let r = O(e.state.currencies, e.definition.currencyId), i = e.resolveCurrencyDefinition === void 0 ? {} : { resolveCurrencyDefinition: e.resolveCurrencyDefinition }, a = Et(e.state, [{
		type: "currency",
		currencyId: e.definition.currencyId,
		amount: n,
		source: `active-gain.${e.definition.id}`
	}], i), o = O(a.currencies, e.definition.currencyId).subtract(r);
	if (o.isZero()) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "no-effective-gain"
	};
	let s = a.statistics.lifetimeCurrencyEarned[e.definition.currencyId];
	if (s === void 0) throw Error("Active gain lifetime currency statistic was not recorded.");
	return {
		accepted: !0,
		state: a,
		events: [{
			id: `active-gain:${e.definition.id}:${e.state.simTimeSec}:${s.mantissa}e${s.exponent}`,
			type: "activeGainPerformed",
			simTimeSec: e.state.simTimeSec,
			payload: {
				activeGainId: e.definition.id,
				currencyId: e.definition.currencyId,
				amount: o.serialize()
			}
		}]
	};
}
//#endregion
//#region src/domain/activity/activity-common.ts
function jt(e) {
	if (k(e.definition), !(e.definition.eligibility === void 0 || w(e.definition.eligibility, Lt(e.createConditionContext)(e.state)))) return {
		eligible: !1,
		affordable: !0,
		canStart: !1,
		blockingCost: null
	};
	let t = Mt({
		state: e.state,
		costs: e.definition.startCosts ?? [],
		...e.resolveCurrencyDefinition === void 0 ? {} : { resolveCurrencyDefinition: e.resolveCurrencyDefinition }
	});
	return t.accepted ? {
		eligible: !0,
		affordable: !0,
		canStart: !0,
		blockingCost: null
	} : {
		eligible: !0,
		affordable: !1,
		canStart: !1,
		blockingCost: t.blockingCost
	};
}
function Mt(e) {
	let t = e.state;
	for (let n of e.costs) {
		if (It(n), n.type === "currency") {
			let r = mt(t.currencies, {
				currencyId: n.currencyId,
				amount: n.amount,
				kind: "spend",
				source: "activity.start"
			}, e.resolveCurrencyDefinition?.(n.currencyId));
			if (!r.accepted) return {
				accepted: !1,
				state: e.state,
				blockingCost: n,
				reason: "insufficient-currency"
			};
			t = Dt({
				...t,
				currencies: r.balances
			}, n.currencyId, r.appliedAmount);
			continue;
		}
		let r = wt(t.tokens, n.tokenId, n.count);
		if (!r.accepted) return {
			accepted: !1,
			state: e.state,
			blockingCost: n,
			reason: "insufficient-token"
		};
		t = {
			...t,
			tokens: r.tokens
		};
	}
	return {
		accepted: !0,
		state: t
	};
}
function Nt(e) {
	return e.offlinePolicy !== "pause";
}
function Pt(e, t, n) {
	if (k(e), !Number.isSafeInteger(t.maxSlots) || t.maxSlots <= 0) throw RangeError("Activity concurrency maxSlots must be a positive safe integer.");
	if (!Number.isSafeInteger(n) || n < 0) throw RangeError("Activity usedSlots must be a non-negative safe integer.");
	if (e.concurrencyGroupId !== t.id) throw RangeError(`Activity concurrency group mismatch: expected ${e.concurrencyGroupId ?? "none"}, got ${t.id}`);
	let r = e.slotCost ?? 1, i = Math.max(0, t.maxSlots - n);
	return {
		allowed: n + r <= t.maxSlots,
		requiredSlots: r,
		usedSlots: n,
		maxSlots: t.maxSlots,
		remainingSlots: i
	};
}
function Ft(e, t) {
	return (e.startCosts ?? []).filter((e) => e.type === "currency" && e.currencyId === t).reduce((e, t) => e.add(t.amount), y.zero());
}
function k(e, t) {
	if (e.id.length === 0) throw RangeError("Activity id must not be empty.");
	if (t !== void 0 && e.mode !== t) throw RangeError(`Activity mode mismatch: expected ${t}, got ${e.mode}`);
	if (e.concurrencyGroupId !== void 0 && e.concurrencyGroupId.length === 0) throw RangeError("Activity concurrencyGroupId must not be empty when specified.");
	if (e.slotCost !== void 0 && (!Number.isSafeInteger(e.slotCost) || e.slotCost <= 0)) throw RangeError("Activity slotCost must be a positive safe integer.");
	for (let t of e.startCosts ?? []) It(t);
}
function It(e) {
	if (e.type === "currency") {
		if (e.currencyId.length === 0) throw RangeError("Activity currency cost requires currencyId.");
		let t = y.from(e.amount);
		if (t.isNegative() || t.isZero()) throw RangeError("Activity currency cost must be positive.");
		return;
	}
	if (e.tokenId.length === 0) throw RangeError("Activity token cost requires tokenId.");
	if (!Number.isSafeInteger(e.count) || e.count <= 0) throw RangeError("Activity token cost must be a positive safe integer.");
}
function Lt(e) {
	if (e === void 0) throw Error("Activity eligibility requires createConditionContext.");
	return e;
}
//#endregion
//#region src/domain/activity/continuous-activity.ts
function Rt(e) {
	if (k(e.definition, "continuous"), !Number.isSafeInteger(e.elapsedSec) || e.elapsedSec < 0) throw RangeError("elapsedSec must be a non-negative safe integer.");
	if (!e.activity.running || e.elapsedSec === 0 || e.isOffline === !0 && e.definition.offlinePolicy === "pause") return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	let t = e.state, n = e.activity, r = e.elapsedSec, i = 0, a = [];
	for (; r > 0;) {
		let o = e.hooks.resolveRates(t);
		if (!Number.isFinite(o.progressPerSec) || o.progressPerSec < 0) throw RangeError("progressPerSec must be finite and non-negative.");
		let s = e.definition.milestones.filter((e) => !n.reachedMilestoneIds.includes(e.id)).toSorted((e, t) => e.threshold - t.threshold).find((e) => e.threshold > n.progress), c = s === void 0 || o.progressPerSec === 0 ? r : Math.max(1, Math.ceil((s.threshold - n.progress) / o.progressPerSec)), l = Math.min(r, c);
		for (let [n, r] of Object.entries(o.production)) t = e.hooks.grantProduction(t, n, y.from(r).multiply(l));
		n = {
			...n,
			progress: Math.min(1, n.progress + o.progressPerSec * l)
		}, r -= l, i += l;
		let u = e.definition.milestones.filter((e) => !n.reachedMilestoneIds.includes(e.id)).filter((e) => n.progress >= e.threshold).toSorted((e, t) => e.threshold - t.threshold);
		for (let r of u) t = e.hooks.grantRewards(t, r.rewards), n = {
			...n,
			reachedMilestoneIds: [...n.reachedMilestoneIds, r.id]
		}, a.push({
			id: `${e.definition.id}:${r.id}:${e.startSimTimeSec + i}`,
			type: "activityMilestoneReached",
			simTimeSec: e.startSimTimeSec + i,
			payload: {
				activityId: e.definition.id,
				milestoneId: r.id
			}
		});
	}
	return {
		state: t,
		activity: n,
		events: a
	};
}
function zt(e, t, n) {
	if (k(t, "continuous"), !Number.isSafeInteger(n) || n < 0) throw RangeError("simTimeSec must be a non-negative safe integer.");
	return e.running ? t.cancellationPolicy === "forbid" ? {
		accepted: !1,
		activity: e,
		events: [],
		reason: "cancellation-forbidden"
	} : {
		accepted: !0,
		activity: {
			...e,
			running: !1
		},
		events: [{
			id: `${t.id}:stopped:${n}`,
			type: "continuousActivityStopped",
			simTimeSec: n,
			payload: { activityId: t.id }
		}]
	} : {
		accepted: !1,
		activity: e,
		events: [],
		reason: "not-running"
	};
}
//#endregion
//#region src/domain/activity/timed-activity.ts
function Bt(e) {
	return {
		activityId: e,
		status: "available",
		startedAtSimTimeSec: null,
		completesAtSimTimeSec: null,
		completionCount: 0
	};
}
function Vt(e) {
	if (Kt(e.definition), A(e.startSimTimeSec, "startSimTimeSec"), e.activity.status !== "available") return Jt(e.state, e.activity, "not-available");
	let t = {
		...e.activity,
		status: "running",
		startedAtSimTimeSec: e.startSimTimeSec,
		completesAtSimTimeSec: e.startSimTimeSec + e.definition.durationSec
	};
	return qt(e.state, t, [j(e.definition.id, "timedActivityStarted", e.startSimTimeSec, e.activity.completionCount + 1)]);
}
function Ht(e) {
	if (Kt(e.definition), A(e.targetSimTimeSec, "targetSimTimeSec"), e.offlineElapsedSec !== void 0 && A(e.offlineElapsedSec, "offlineElapsedSec"), e.activity.status !== "running") return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	let t = e.activity.completesAtSimTimeSec;
	if (t === null) throw Error("Running Timed Activity is missing completesAtSimTimeSec.");
	let n = e.offlineElapsedSec ?? 0;
	if (n > 0 && e.definition.offlinePolicy === "pause") {
		let r = e.activity.startedAtSimTimeSec;
		if (r === null) throw Error("Running Timed Activity is missing startedAtSimTimeSec.");
		return {
			state: e.state,
			activity: {
				...e.activity,
				startedAtSimTimeSec: r + n,
				completesAtSimTimeSec: t + n
			},
			events: []
		};
	}
	if (e.targetSimTimeSec < t) return {
		state: e.state,
		activity: e.activity,
		events: []
	};
	if (e.definition.claimPolicy === "manual") return {
		state: e.state,
		activity: {
			...e.activity,
			status: "completed-unclaimed"
		},
		events: [j(e.definition.id, "timedActivityCompleted", t, e.activity.completionCount + 1)]
	};
	let r = e.hooks.grantRewards(e.state, e.definition.completionRewards), i = e.activity.completionCount + 1;
	return {
		state: r,
		activity: Gt(e.activity, e.definition, i),
		events: [j(e.definition.id, "timedActivityAutoResolved", t, i)]
	};
}
function Ut(e, t, n) {
	return Kt(t), A(n, "simTimeSec"), e.status === "running" ? t.cancellationPolicy === "forbid" ? {
		accepted: !1,
		activity: e,
		events: [],
		reason: "cancellation-forbidden"
	} : {
		accepted: !0,
		activity: {
			...e,
			status: "available",
			startedAtSimTimeSec: null,
			completesAtSimTimeSec: null
		},
		events: [j(t.id, "timedActivityCancelled", n, e.completionCount + 1)]
	} : {
		accepted: !1,
		activity: e,
		events: [],
		reason: "not-running"
	};
}
function Wt(e) {
	if (Kt(e.definition), A(e.claimSimTimeSec, "claimSimTimeSec"), e.activity.status !== "completed-unclaimed") return Jt(e.state, e.activity, "not-claimable");
	let t = e.hooks.grantRewards(e.state, e.definition.completionRewards), n = e.activity.completionCount + 1;
	return qt(t, Gt(e.activity, e.definition, n), [j(e.definition.id, "timedActivityClaimed", e.claimSimTimeSec, n)]);
}
function Gt(e, t, n) {
	return {
		...e,
		status: t.repeatPolicy === "repeatable" ? "available" : "exhausted",
		startedAtSimTimeSec: null,
		completesAtSimTimeSec: null,
		completionCount: n
	};
}
function Kt(e) {
	if (k(e, "timed"), !Number.isSafeInteger(e.durationSec) || e.durationSec <= 0) throw RangeError("Timed Activity durationSec must be a positive safe integer.");
}
function A(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function j(e, t, n, r) {
	return {
		id: `${e}:${t}:${r}:${n}`,
		type: t,
		simTimeSec: n,
		payload: {
			activityId: e,
			runNumber: r
		}
	};
}
function qt(e, t, n) {
	return {
		accepted: !0,
		state: e,
		activity: t,
		events: n
	};
}
function Jt(e, t, n) {
	return {
		accepted: !1,
		state: e,
		activity: t,
		events: [],
		reason: n
	};
}
//#endregion
//#region src/domain/boost/boost.ts
function Yt(e, t, n) {
	$t(t);
	let r = Object.values(e).find((e) => e.stackingKey === t.stackingKey && e.expiresAtSimTimeSec > n);
	if (r !== void 0 && t.stackingPolicy === "non-stackable") return e;
	if (r !== void 0 && t.stackingPolicy === "replace-weaker") {
		if (r.stackingStrength === void 0) throw Error(`Active Boost ${r.boostId} is missing stackingStrength for replace-weaker group ${t.stackingKey}.`);
		if (t.stackingStrength <= r.stackingStrength) return e;
	}
	let i = {
		boostId: t.id,
		stackingKey: t.stackingKey,
		activatedAtSimTimeSec: n,
		expiresAtSimTimeSec: n + t.durationSec,
		...t.stackingPolicy === "replace-weaker" ? { stackingStrength: t.stackingStrength } : {}
	};
	return r !== void 0 && (t.stackingPolicy === "refresh-duration" || t.stackingPolicy === "replace-weaker") ? {
		...Object.fromEntries(Object.entries(e).filter(([, e]) => e.stackingKey !== t.stackingKey)),
		[t.id]: i
	} : {
		...e,
		[t.id]: i
	};
}
function Xt(e, t, n, r) {
	return Object.values(e).flatMap((e) => {
		if (e.expiresAtSimTimeSec <= r) return [];
		let i = t[e.boostId];
		return i === void 0 || i.target !== n ? [] : [i.modifier];
	});
}
function Zt(e, t, n) {
	let r = null;
	for (let i of Object.values(e)) i.expiresAtSimTimeSec <= t || i.expiresAtSimTimeSec >= n || (r === null || i.expiresAtSimTimeSec < r) && (r = i.expiresAtSimTimeSec);
	return r;
}
function Qt(e, t) {
	return Object.fromEntries(Object.entries(e).filter(([, e]) => e.expiresAtSimTimeSec > t));
}
function $t(e) {
	if (!Number.isSafeInteger(e.durationSec) || e.durationSec <= 0) throw RangeError("Boost durationSec must be a positive safe integer.");
	if (e.stackingPolicy === "replace-weaker" && (!Number.isFinite(e.stackingStrength) || e.stackingStrength <= 0)) throw RangeError("replace-weaker Boost stackingStrength must be positive and finite.");
}
//#endregion
//#region src/domain/calendar/calendar-reward.ts
function en(e, t, n) {
	if (!Number.isFinite(e) || !Number.isSafeInteger(t)) throw RangeError("Calendar clock inputs must be finite integers.");
	let r = e + t * 6e4, i = new Date(r), a = i.getUTCFullYear(), o = i.getUTCMonth(), s = Date.UTC(a, o, i.getUTCDate()), c = Math.floor(s / 864e5);
	switch (n) {
		case "daily": return c;
		case "weekly": return Math.floor((c + 3) / 7);
		case "monthly": return a * 12 + o;
	}
}
function tn(e, t, n, r) {
	if (t.rewardsByClaim.length === 0) throw RangeError(`Calendar reward sequence is empty: ${t.id}`);
	let i = en(n, r, t.period), a = e.calendarRewardStates[t.id] ?? {
		lastClaimedPeriodIndex: null,
		claimCount: 0,
		streakCount: 0
	}, o = a.lastClaimedPeriodIndex === null ? null : i - a.lastClaimedPeriodIndex, s = o !== null && o > 1 && t.missPolicy === "reset-sequence", c = (s ? 0 : a.claimCount) % t.rewardsByClaim.length, l = a.lastClaimedPeriodIndex === null ? 1 : o === 0 ? a.streakCount : o === 1 ? a.streakCount + 1 : 1;
	return {
		claimable: a.lastClaimedPeriodIndex === null || i > a.lastClaimedPeriodIndex,
		claimPolicy: t.claimPolicy ?? "manual",
		periodIndex: i,
		sequenceIndex: c,
		rewards: t.rewardsByClaim[c],
		streakCountAfterClaim: l,
		sequenceReset: s
	};
}
function nn(e, t, n, r, i) {
	return (t.claimPolicy ?? "manual") === "auto" ? {
		accepted: !1,
		state: e,
		reason: "manual-claim-disabled"
	} : an(e, t, n, r, i);
}
function rn(e, t, n, r, i) {
	let a = e, o = [];
	for (let e of t) {
		if ((e.claimPolicy ?? "manual") !== "auto") continue;
		let t = an(a, e, n, r, i);
		t.accepted && (a = t.state, o.push({
			calendarRewardId: e.id,
			rewards: t.rewards
		}));
	}
	return {
		state: a,
		claimed: o
	};
}
function an(e, t, n, r, i) {
	let a = tn(e, t, n, r), o = e.calendarRewardStates[t.id] ?? {
		lastClaimedPeriodIndex: null,
		claimCount: 0,
		streakCount: 0
	};
	if (!a.claimable) return {
		accepted: !1,
		state: e,
		reason: o.lastClaimedPeriodIndex !== null && a.periodIndex < o.lastClaimedPeriodIndex ? "clock-rollback" : "already-claimed"
	};
	let s = i(e, a.rewards);
	return s = {
		...s,
		calendarRewardStates: {
			...s.calendarRewardStates,
			[t.id]: {
				lastClaimedPeriodIndex: a.periodIndex,
				claimCount: a.sequenceReset ? 1 : o.claimCount + 1,
				streakCount: a.streakCountAfterClaim
			}
		}
	}, {
		accepted: !0,
		state: s,
		rewards: a.rewards
	};
}
//#endregion
//#region src/domain/character/character.ts
var on = (e, t) => Object.values(e).some((e) => e.definitionId === t);
function sn(e, t) {
	return e[t.instanceId] === void 0 ? {
		accepted: !0,
		characters: {
			...e,
			[t.instanceId]: t
		}
	} : {
		accepted: !1,
		characters: e
	};
}
function cn(e, t, n) {
	if (!Number.isSafeInteger(n) || n < 1) return {
		accepted: !1,
		characters: e,
		reason: "invalid-level"
	};
	let r = e[t];
	return r === void 0 ? {
		accepted: !1,
		characters: e,
		reason: "unknown-character"
	} : {
		accepted: !0,
		characters: {
			...e,
			[t]: {
				...r,
				level: n
			}
		}
	};
}
function ln(e, t, n = 1, r = {}) {
	if (!Number.isSafeInteger(n) || n <= 0) return {
		accepted: !1,
		characters: e,
		reason: "invalid-count"
	};
	let i = e[t];
	if (i === void 0) return {
		accepted: !1,
		characters: e,
		reason: "unknown-character"
	};
	if (r.maxCount !== void 0) {
		if (!Number.isSafeInteger(r.maxCount) || r.maxCount <= 0) throw RangeError("Character limitBreak maxCount must be a positive safe integer.");
		if ((i.limitBreakCount ?? 0) + n > r.maxCount) return {
			accepted: !1,
			characters: e,
			reason: "limit-reached"
		};
	}
	let a = (i.limitBreakCount ?? 0) + n;
	return {
		accepted: !0,
		characters: {
			...e,
			[t]: {
				...i,
				limitBreakCount: a
			}
		},
		limitBreakCount: a
	};
}
//#endregion
//#region src/domain/cooldown/cooldown.ts
function un() {
	return {
		readyAtSimTimeSec: 0,
		useCount: 0
	};
}
function dn(e, t, n) {
	mn(e), _n(n, "simTimeSec");
	let r = t ?? un();
	hn(r);
	let i = Math.max(0, r.readyAtSimTimeSec - n);
	return {
		ready: i === 0,
		remainingSec: i,
		readyAtSimTimeSec: r.readyAtSimTimeSec,
		useCount: r.useCount
	};
}
function fn(e) {
	let t = e.cooldown ?? un(), n = dn(e.definition, t, e.simTimeSec);
	if (!n.ready) return {
		accepted: !1,
		cooldown: t,
		reason: "cooldown-active",
		remainingSec: n.remainingSec
	};
	let r = e.durationSecOverride ?? e.definition.durationSec;
	gn(r, "durationSecOverride");
	let i = e.simTimeSec + r;
	if (!Number.isSafeInteger(i)) throw RangeError("Cooldown readyAtSimTimeSec exceeds safe integer range.");
	return {
		accepted: !0,
		cooldown: {
			readyAtSimTimeSec: i,
			useCount: t.useCount + 1
		},
		previous: t
	};
}
function pn(e) {
	hn(e.cooldown), _n(e.simTimeSec, "simTimeSec"), gn(e.reductionSec, "reductionSec");
	let t = Math.max(e.simTimeSec, e.cooldown.readyAtSimTimeSec - e.reductionSec);
	return t === e.cooldown.readyAtSimTimeSec ? e.cooldown : {
		...e.cooldown,
		readyAtSimTimeSec: t
	};
}
function mn(e) {
	if (e.id.length === 0) throw RangeError("Cooldown id must not be empty.");
	gn(e.durationSec, "Cooldown durationSec");
}
function hn(e) {
	if (_n(e.readyAtSimTimeSec, "Cooldown readyAtSimTimeSec"), !Number.isSafeInteger(e.useCount) || e.useCount < 0) throw RangeError("Cooldown useCount must be a non-negative safe integer.");
}
function gn(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function _n(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
//#endregion
//#region src/domain/definition/definition-validation.ts
function vn(e) {
	let t = [], n = /* @__PURE__ */ new Map(), r = e.continuousActivities ?? [], i = e.timedActivities ?? [], a = e.achievements ?? [], o = e.missions ?? [], s = e.missionSets ?? [], c = e.gachas ?? [];
	for (let [r, i] of Object.entries(e.ids)) bn(i, `ids.${r}`, t, n);
	M(e.activeGains ?? [], "activeGains", t, n), M(e.curves ?? [], "curves", t, n), M(e.levelDefinitions ?? [], "levelDefinitions", t, n), M(e.activityConcurrencyGroups ?? [], "activityConcurrencyGroups", t, n), M(r, "continuousActivities", t, n), M(i, "timedActivities", t, n), M(e.boosts ?? [], "boosts", t, n), M(c, "gachas", t, n), M(e.calendarRewards ?? [], "calendarRewards", t, n), M(e.rewardedOffers ?? [], "rewardedOffers", t, n), M(a, "achievements", t, n), M(s, "missionSets", t, n), M(o, "missions", t, n), M(e.opportunities ?? [], "opportunities", t, n), M(e.prestiges ?? [], "prestiges", t, n);
	let l = {
		currencies: new Set(e.ids.currencies),
		producers: new Set(e.ids.producers),
		tokens: new Set(e.ids.tokens),
		characters: new Set(e.ids.characters),
		boosts: new Set((e.boosts ?? []).map((e) => e.id)),
		permanentModifiers: new Set(e.ids.permanentModifiers),
		titles: new Set(e.ids.titles),
		unlockFlags: new Set(e.ids.unlockFlags),
		rngStreams: new Set(e.ids.rngStreams),
		activities: new Set([...r, ...i].map((e) => e.id)),
		activityConcurrencyGroups: new Set((e.activityConcurrencyGroups ?? []).map((e) => e.id)),
		activityMilestones: new Map(r.map((e) => [e.id, new Set(e.milestones.map((e) => e.id))])),
		achievements: new Set(a.map((e) => e.id)),
		missions: new Set(o.map((e) => e.id)),
		missionSets: new Set(s.map((e) => e.id)),
		gachas: new Set(c.map((e) => e.id)),
		calendarRewards: new Set((e.calendarRewards ?? []).map((e) => e.id)),
		prestiges: new Set((e.prestiges ?? []).map((e) => e.id)),
		levels: new Set((e.levelDefinitions ?? []).map((e) => e.id))
	}, u = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.titleDefinitions ?? []).entries()) {
		let e = `titleDefinitions[${n}]`;
		u.has(r.id) && V(t, "duplicate-id", `${e}.id`, `Duplicate TitleDefinition ID: ${r.id}`), u.add(r.id), B(l.titles, r.id, `${e}.id`, "title", t), r.displayName.length === 0 && V(t, "invalid-value", `${e}.displayName`, "Title displayName must not be empty."), r.description !== void 0 && r.description.length === 0 && V(t, "invalid-value", `${e}.description`, "Title description must not be empty when specified.");
	}
	let d = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.modifierDefinitions ?? []).entries()) {
		let e = `modifierDefinitions[${n}]`;
		d.has(r.id) && V(t, "duplicate-id", `${e}.id`, `Duplicate ModifierDefinition ID: ${r.id}`), d.add(r.id), B(l.permanentModifiers, r.id, `${e}.id`, "permanent modifier", t), kn(r, e, t);
	}
	let ee = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.currencyDefinitions ?? []).entries()) {
		let e = `currencyDefinitions[${n}]`;
		ee.has(r.id) && V(t, "duplicate-id", `${e}.id`, `Duplicate CurrencyDefinition ID: ${r.id}`), ee.add(r.id), B(l.currencies, r.id, `${e}.id`, "currency", t), xn(r, e, t);
	}
	let te = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.producerDefinitions ?? []).entries()) {
		let e = `producerDefinitions[${n}]`;
		te.has(r.id) && V(t, "duplicate-id", `${e}.id`, `Duplicate ProducerDefinition ID: ${r.id}`), te.add(r.id), B(l.producers, r.id, `${e}.id`, "producer", t), r.displayName !== void 0 && r.displayName.length === 0 && V(t, "invalid-value", `${e}.displayName`, "Producer displayName must not be empty when specified."), r.hireCostCurve !== void 0 && N(r.hireCostCurve, `${e}.hireCostCurve`, t), r.levelDefinitionId !== void 0 && B(l.levels, r.levelDefinitionId, `${e}.levelDefinitionId`, "level definition", t), r.unlockCondition !== void 0 && F(r.unlockCondition, `${e}.unlockCondition`, l, t);
		for (let [n, i] of Object.entries(r.baseProduction ?? {})) B(l.currencies, n, `${e}.baseProduction.${n}`, "currency", t), R(i, `${e}.baseProduction.${n}`, t, !0);
		r.tags?.forEach((n, r) => {
			n.length === 0 && V(t, "invalid-value", `${e}.tags[${r}]`, "Producer tag must not be empty.");
		});
	}
	let ne = /* @__PURE__ */ new Set();
	for (let [n, r] of (e.characterDefinitions ?? []).entries()) {
		let e = `characterDefinitions[${n}]`;
		ne.has(r.id) && V(t, "duplicate-id", `${e}.id`, `Duplicate CharacterDefinition ID: ${r.id}`), ne.add(r.id), B(l.characters, r.id, `${e}.id`, "character", t), r.displayName !== void 0 && r.displayName.length === 0 && V(t, "invalid-value", `${e}.displayName`, "Character displayName must not be empty when specified."), r.rarity !== void 0 && r.rarity.length === 0 && V(t, "invalid-value", `${e}.rarity`, "Character rarity must not be empty when specified."), r.levelDefinitionId !== void 0 && B(l.levels, r.levelDefinitionId, `${e}.levelDefinitionId`, "level definition", t), r.unlockCondition !== void 0 && F(r.unlockCondition, `${e}.unlockCondition`, l, t), r.limitBreak?.maxCount !== void 0 && (!Number.isSafeInteger(r.limitBreak.maxCount) || r.limitBreak.maxCount <= 0) && V(t, "invalid-value", `${e}.limitBreak.maxCount`, "Character limitBreak maxCount must be a positive safe integer.");
		for (let [n, i] of Object.entries(r.baseStats ?? {})) n.length === 0 && V(t, "invalid-value", `${e}.baseStats`, "Character stat ID must not be empty."), R(i, `${e}.baseStats.${n}`, t, !1);
		r.traits?.forEach((n, r) => {
			n.length === 0 && V(t, "invalid-value", `${e}.traits[${r}]`, "Character trait must not be empty.");
		});
	}
	for (let [n, r] of (e.activeGains ?? []).entries()) {
		let e = `activeGains[${n}]`;
		B(l.currencies, r.currencyId, `${e}.currencyId`, "currency", t), jn(r.baseAmount, `${e}.baseAmount`, t), r.eligibility !== void 0 && F(r.eligibility, `${e}.eligibility`, l, t);
	}
	for (let [n, r] of (e.curves ?? []).entries()) N(r.definition, `curves[${n}].definition`, t);
	for (let [n, r] of (e.levelDefinitions ?? []).entries()) {
		let e = `levelDefinitions[${n}]`;
		N(r.costCurve, `${e}.costCurve`, t), r.statCurve !== void 0 && N(r.statCurve, `${e}.statCurve`, t), r.maxLevel !== void 0 && z(r.maxLevel, `${e}.maxLevel`, "Level maxLevel", t), r.eligibility !== void 0 && F(r.eligibility, `${e}.eligibility`, l, t);
		let i = /* @__PURE__ */ new Set(), a = 0;
		for (let [n, o] of (r.milestones ?? []).entries()) {
			let s = `${e}.milestones[${n}]`;
			i.has(o.id) && V(t, "duplicate-id", `${s}.id`, `Duplicate level milestone ID: ${o.id}`), i.add(o.id), z(o.level, `${s}.level`, "Level milestone level", t), o.level < a && V(t, "invalid-value", `${s}.level`, "Level milestones must be authored in non-decreasing level order."), a = o.level, r.maxLevel !== void 0 && o.level > r.maxLevel && V(t, "invalid-value", `${s}.level`, "Level milestone cannot exceed maxLevel."), P(o.rewards, `${s}.rewards`, l, t);
		}
	}
	for (let [n, r] of (e.activityConcurrencyGroups ?? []).entries()) {
		let e = `activityConcurrencyGroups[${n}]`;
		(!Number.isSafeInteger(r.maxSlots) || r.maxSlots <= 0) && V(t, "invalid-value", `${e}.maxSlots`, "Activity concurrency group maxSlots must be a positive safe integer.");
	}
	for (let [e, n] of r.entries()) {
		let r = `continuousActivities[${e}]`;
		Sn(n, "continuous", r, l, t);
		let i = /* @__PURE__ */ new Set();
		for (let [e, a] of n.milestones.entries()) {
			let n = `${r}.milestones[${e}]`;
			i.has(a.id) && V(t, "duplicate-id", `${n}.id`, `Duplicate milestone ID: ${a.id}`), i.add(a.id), (!Number.isFinite(a.threshold) || a.threshold < 0 || a.threshold > 1) && V(t, "invalid-value", `${n}.threshold`, "Continuous milestone threshold must be finite and in [0, 1]."), P(a.rewards, `${n}.rewards`, l, t);
		}
	}
	for (let [e, n] of i.entries()) {
		let r = `timedActivities[${e}]`;
		Sn(n, "timed", r, l, t), (!Number.isSafeInteger(n.durationSec) || n.durationSec <= 0) && V(t, "invalid-value", `${r}.durationSec`, "Timed Activity durationSec must be a positive safe integer."), P(n.completionRewards, `${r}.completionRewards`, l, t);
	}
	let f = /* @__PURE__ */ new Map();
	for (let [n, r] of (e.boosts ?? []).entries()) {
		let e = `boosts[${n}]`;
		(!Number.isSafeInteger(r.durationSec) || r.durationSec <= 0) && V(t, "invalid-value", `${e}.durationSec`, "Boost durationSec must be a positive safe integer."), An(r.modifier, `${e}.modifier`, t), r.target.length === 0 && V(t, "invalid-value", `${e}.target`, "Boost target must not be empty."), r.stackingKey.length === 0 && V(t, "invalid-value", `${e}.stackingKey`, "Boost stackingKey must not be empty."), r.stackingPolicy === "replace-weaker" && (!Number.isFinite(r.stackingStrength) || r.stackingStrength <= 0) && V(t, "invalid-value", `${e}.stackingStrength`, "replace-weaker Boost stackingStrength must be positive and finite.");
		let i = f.get(r.stackingKey);
		i !== void 0 && i.policy !== r.stackingPolicy ? V(t, "invalid-value", `${e}.stackingPolicy`, `Boosts sharing stackingKey ${r.stackingKey} must use one stacking policy; ${i.path} uses ${i.policy}.`) : i === void 0 && f.set(r.stackingKey, {
			policy: r.stackingPolicy,
			path: e
		});
	}
	for (let [n, r] of c.entries()) {
		let i = `gachas[${n}]`;
		"currencyId" in r.cost ? (B(l.currencies, r.cost.currencyId, `${i}.cost.currencyId`, "currency", t), R(r.cost.amountPerDraw, `${i}.cost.amountPerDraw`, t, !0)) : (r.cost.tokenId.length === 0 && V(t, "invalid-value", `${i}.cost.tokenId`, "Gacha token ID must not be empty."), (!Number.isSafeInteger(r.cost.countPerDraw) || r.cost.countPerDraw < 0) && V(t, "invalid-value", `${i}.cost.countPerDraw`, "Gacha token cost must be a non-negative safe integer.")), B(l.rngStreams, r.rngStreamName, `${i}.rngStreamName`, "RNG stream", t), r.allowedDrawCounts.length === 0 && V(t, "invalid-value", `${i}.allowedDrawCounts`, "Gacha requires at least one allowed draw count.");
		let a = /* @__PURE__ */ new Set();
		for (let [e, n] of r.allowedDrawCounts.entries()) (!Number.isSafeInteger(n) || n <= 0) && V(t, "invalid-value", `${i}.allowedDrawCounts[${e}]`, "Gacha draw count must be a positive safe integer."), a.has(n) && V(t, "duplicate-id", `${i}.allowedDrawCounts[${e}]`, `Duplicate Gacha draw count: ${n}`), a.add(n);
		r.pool.length === 0 && V(t, "invalid-value", `${i}.pool`, "Gacha pool must not be empty.");
		let o = /* @__PURE__ */ new Set();
		for (let [n, a] of r.pool.entries()) {
			let r = `${i}.pool[${n}]`;
			o.has(a.id) && V(t, "duplicate-id", `${r}.id`, `Duplicate Gacha pool entry ID: ${a.id}`), o.add(a.id), (!(a.weight > 0) || !Number.isFinite(a.weight)) && V(t, "invalid-value", `${r}.weight`, "Gacha weight must be positive and finite."), a.rarity !== void 0 && a.rarity.length === 0 && V(t, "invalid-value", `${r}.rarity`, "Gacha rarity metadata must not be empty."), t.push(...e.validateGachaReward?.(a.reward, `${r}.reward`) ?? []);
		}
		let s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set();
		for (let [e, n] of (r.guaranteedSlots ?? []).entries()) {
			let a = `${i}.guaranteedSlots[${e}]`;
			wn(n.id, a, s, t), r.allowedDrawCounts.includes(n.drawCount) || V(t, "invalid-value", `${a}.drawCount`, `Guaranteed slot drawCount is not allowed: ${n.drawCount}`), (!Number.isSafeInteger(n.drawIndex) || n.drawIndex < 0 || n.drawIndex >= n.drawCount) && V(t, "invalid-value", `${a}.drawIndex`, "Guaranteed slot drawIndex must be within its drawCount.");
			let l = `${n.drawCount}:${n.drawIndex}`;
			c.has(l) && V(t, "duplicate-id", a, `Duplicate guaranteed Gacha slot: ${l}`), c.add(l), Tn(n.poolEntryIds, o, `${a}.poolEntryIds`, t);
		}
		let u = /* @__PURE__ */ new Set();
		for (let [e, n] of (r.batchGuarantees ?? []).entries()) {
			let a = `${i}.batchGuarantees[${e}]`;
			wn(n.id, a, s, t), r.allowedDrawCounts.includes(n.drawCount) || V(t, "invalid-value", `${a}.drawCount`, `Batch guarantee drawCount is not allowed: ${n.drawCount}`), !Number.isSafeInteger(n.batchSize) || n.batchSize <= 0 || n.batchSize > n.drawCount ? V(t, "invalid-value", `${a}.batchSize`, "Batch guarantee batchSize must be a positive safe integer <= drawCount.") : n.drawCount % n.batchSize !== 0 && V(t, "invalid-value", `${a}.batchSize`, "Batch guarantee batchSize must evenly divide drawCount."), u.has(n.drawCount) && V(t, "duplicate-id", a, `Only one batch guarantee may target drawCount ${n.drawCount}.`), u.add(n.drawCount), Tn(n.poolEntryIds, o, `${a}.poolEntryIds`, t);
		}
		if (r.pity !== void 0) {
			let e = `${i}.pity`;
			wn(r.pity.id, e, s, t), (!Number.isSafeInteger(r.pity.threshold) || r.pity.threshold <= 0) && V(t, "invalid-value", `${e}.threshold`, "Gacha pity threshold must be a positive safe integer."), Tn(r.pity.poolEntryIds, o, `${e}.poolEntryIds`, t);
			let n = new Set(r.pity.poolEntryIds);
			for (let [e, a] of (r.batchGuarantees ?? []).entries()) a.poolEntryIds.some((e) => n.has(e)) || V(t, "invalid-value", `${i}.batchGuarantees[${e}].poolEntryIds`, "Batch guarantee and pity pools must overlap.");
		}
	}
	for (let [n, r] of (e.opportunities ?? []).entries()) {
		let e = `opportunities[${n}]`;
		(!Number.isSafeInteger(r.lifetimeSec) || r.lifetimeSec <= 0) && V(t, "invalid-value", `${e}.lifetimeSec`, "Opportunity lifetimeSec must be a positive safe integer."), r.offlinePolicy !== void 0 && r.offlinePolicy !== "elapse" && r.offlinePolicy !== "pause" && V(t, "invalid-value", `${e}.offlinePolicy`, "Opportunity offlinePolicy must be elapse or pause."), r.dismissalPolicy !== void 0 && r.dismissalPolicy !== "allow" && r.dismissalPolicy !== "forbid" && V(t, "invalid-value", `${e}.dismissalPolicy`, "Opportunity dismissalPolicy must be allow or forbid.");
	}
	for (let [n, r] of (e.rewardedOffers ?? []).entries()) {
		let e = `rewardedOffers[${n}]`;
		r.placementId.length === 0 && V(t, "invalid-value", `${e}.placementId`, "Rewarded Offer placementId must not be empty."), r.rewards.length === 0 && V(t, "invalid-value", `${e}.rewards`, "Rewarded Offer rewards must not be empty."), r.cooldownSec !== void 0 && (!Number.isSafeInteger(r.cooldownSec) || r.cooldownSec < 0) && V(t, "invalid-value", `${e}.cooldownSec`, "Rewarded Offer cooldownSec must be a non-negative safe integer."), r.dailyCap !== void 0 && (!Number.isSafeInteger(r.dailyCap) || r.dailyCap <= 0) && V(t, "invalid-value", `${e}.dailyCap`, "Rewarded Offer dailyCap must be a positive safe integer."), r.eligibility !== void 0 && F(r.eligibility, `${e}.eligibility`, l, t), P(r.rewards, `${e}.rewards`, l, t);
	}
	for (let [n, r] of (e.calendarRewards ?? []).entries()) {
		let e = `calendarRewards[${n}]`;
		r.rewardsByClaim.length === 0 && V(t, "invalid-value", `${e}.rewardsByClaim`, "Calendar reward sequence must not be empty.");
		for (let [n, i] of r.rewardsByClaim.entries()) i.length === 0 && V(t, "invalid-value", `${e}.rewardsByClaim[${n}]`, "Calendar claim reward must not be empty."), P(i, `${e}.rewardsByClaim[${n}]`, l, t);
	}
	for (let [e, n] of a.entries()) {
		let r = `achievements[${e}]`;
		F(n.condition, `${r}.condition`, l, t), P(n.rewards, `${r}.rewards`, l, t), n.displayName !== void 0 && n.displayName.length === 0 && V(t, "invalid-value", `${r}.displayName`, "Achievement displayName must not be empty when specified."), n.description !== void 0 && n.description.length === 0 && V(t, "invalid-value", `${r}.description`, "Achievement description must not be empty when specified."), n.progressMetric !== void 0 && Cn(n.progressMetric, `${r}.progressMetric`, l, t);
	}
	Dn(a, t);
	let re = new Map(o.map((e) => [e.id, e]));
	for (let [e, n] of s.entries()) {
		let r = `missionSets[${e}]`;
		n.missionIds.length === 0 && V(t, "invalid-value", `${r}.missionIds`, "Mission set must contain at least one Mission ID.");
		let i = /* @__PURE__ */ new Set();
		for (let [e, a] of n.missionIds.entries()) {
			let o = `${r}.missionIds[${e}]`;
			i.has(a) && V(t, "duplicate-id", o, `Duplicate Mission ID in set: ${a}`), i.add(a), B(l.missions, a, o, "mission", t);
			let s = re.get(a);
			s !== void 0 && s.setId !== n.id && V(t, "invalid-value", o, `Mission ${a} belongs to ${s.setId}, not ${n.id}.`);
		}
		let a = /* @__PURE__ */ new Set(), o = 0;
		for (let [e, i] of (n.pointMilestones ?? []).entries()) {
			let n = `${r}.pointMilestones[${e}]`;
			a.has(i.id) && V(t, "duplicate-id", `${n}.id`, `Duplicate Mission point milestone ID: ${i.id}`), a.add(i.id), !Number.isSafeInteger(i.pointsRequired) || i.pointsRequired <= 0 ? V(t, "invalid-value", `${n}.pointsRequired`, "Mission point milestone pointsRequired must be a positive safe integer.") : i.pointsRequired <= o && V(t, "invalid-value", `${n}.pointsRequired`, "Mission point milestones must be authored in strictly increasing point order."), o = Math.max(o, i.pointsRequired), i.rewards.length === 0 && V(t, "invalid-value", `${n}.rewards`, "Mission point milestone rewards must not be empty."), P(i.rewards, `${n}.rewards`, l, t);
		}
	}
	let ie = new Map(s.map((e) => [e.id, new Set(e.missionIds)]));
	for (let [e, n] of o.entries()) {
		let r = `missions[${e}]`;
		B(l.missionSets, n.setId, `${r}.setId`, "mission set", t);
		let i = ie.get(n.setId);
		i !== void 0 && !i.has(n.id) && V(t, "invalid-value", `${r}.setId`, `Mission ${n.id} is not listed by Mission set ${n.setId}.`), n.objective.type === "condition" ? (F(n.objective.condition, `${r}.objective.condition`, l, t), n.objective.progressMetric !== void 0 && Cn(n.objective.progressMetric, `${r}.objective.progressMetric`, l, t)) : (n.objective.metricId.length === 0 && V(t, "invalid-value", `${r}.objective.metricId`, "Mission counter metricId must not be empty."), jn(n.objective.target, `${r}.objective.target`, t)), n.rewards.length === 0 && V(t, "invalid-value", `${r}.rewards`, "Mission rewards must not be empty."), P(n.rewards, `${r}.rewards`, l, t), n.points !== void 0 && (!Number.isSafeInteger(n.points) || n.points < 0) && V(t, "invalid-value", `${r}.points`, "Mission points must be a non-negative safe integer."), n.displayName !== void 0 && n.displayName.length === 0 && V(t, "invalid-value", `${r}.displayName`, "Mission displayName must not be empty when specified."), n.description !== void 0 && n.description.length === 0 && V(t, "invalid-value", `${r}.description`, "Mission description must not be empty when specified.");
	}
	for (let [n, r] of (e.prestiges ?? []).entries()) {
		let e = `prestiges[${n}]`;
		F(r.eligibility, `${e}.eligibility`, l, t), En(r.resetPolicy, `${e}.resetPolicy`, l, t);
	}
	for (let n of e.additionalConditions ?? []) F(n.condition, n.path, l, t);
	for (let n of e.additionalRewardSets ?? []) P(n.rewards, n.path, l, t);
	return t;
}
function yn(e) {
	let t = vn(e);
	if (t.length !== 0) throw Error(`Invalid definition bundle:\n${t.map((e) => `- [${e.code}] ${e.path}: ${e.message}`).join("\n")}`);
}
function M(e, t, n, r) {
	bn(e.map((e) => e.id), t, n, r);
}
function bn(e, t, n, r) {
	let i = /* @__PURE__ */ new Set();
	for (let [a, o] of e.entries()) {
		let e = `${t}[${a}]`;
		o.length === 0 && V(n, "invalid-value", e, "Definition ID must not be empty."), i.has(o) && V(n, "duplicate-id", e, `Duplicate ID in ${t}: ${o}`), i.add(o);
		let s = r.get(o);
		s !== void 0 && s !== t ? V(n, "duplicate-id", e, `ID ${o} is also declared in ${s}.`) : s === void 0 && r.set(o, t);
	}
}
function xn(e, t, n) {
	e.precision !== void 0 != (e.roundingMode !== void 0) && V(n, "invalid-value", t, "Currency precision and roundingMode must be specified together."), e.precision !== void 0 && (!Number.isSafeInteger(e.precision) || e.precision < 0) && V(n, "invalid-value", `${t}.precision`, "Currency precision must be a non-negative safe integer."), e.cap !== void 0 && R(e.cap, `${t}.cap`, n, !0), e.displayName !== void 0 && e.displayName.length === 0 && V(n, "invalid-value", `${t}.displayName`, "Currency displayName must not be empty when specified."), e.symbol !== void 0 && e.symbol.length === 0 && V(n, "invalid-value", `${t}.symbol`, "Currency symbol must not be empty when specified.");
}
function Sn(e, t, n, r, i) {
	e.mode !== t && V(i, "invalid-value", `${n}.mode`, `Activity mode must be ${t}.`), e.eligibility !== void 0 && F(e.eligibility, `${n}.eligibility`, r, i), e.concurrencyGroupId !== void 0 && (e.concurrencyGroupId.length === 0 ? V(i, "invalid-value", `${n}.concurrencyGroupId`, "Activity concurrencyGroupId must not be empty.") : B(r.activityConcurrencyGroups, e.concurrencyGroupId, `${n}.concurrencyGroupId`, "activity concurrency group", i)), e.slotCost !== void 0 && (!Number.isSafeInteger(e.slotCost) || e.slotCost <= 0) && V(i, "invalid-value", `${n}.slotCost`, "Activity slotCost must be a positive safe integer.");
	for (let [t, a] of (e.startCosts ?? []).entries()) {
		let e = `${n}.startCosts[${t}]`;
		if (a.type === "currency") {
			B(r.currencies, a.currencyId, `${e}.currencyId`, "currency", i), R(a.amount, `${e}.amount`, i, !0);
			try {
				y.from(a.amount).isZero() && V(i, "invalid-value", `${e}.amount`, "Activity currency start cost must be positive.");
			} catch {}
			continue;
		}
		B(r.tokens, a.tokenId, `${e}.tokenId`, "token", i), Mn(a.count, `${e}.count`, "Activity token start cost", i);
	}
}
function N(e, t, n) {
	switch (e.type) {
		case "linear":
			R(e.base, `${t}.base`, n, !1), R(e.step, `${t}.step`, n, !1);
			return;
		case "polynomial":
			e.coefficients.length === 0 && V(n, "invalid-value", `${t}.coefficients`, "Polynomial curve must contain at least one coefficient."), e.coefficients.forEach((e, r) => R(e, `${t}.coefficients[${r}]`, n, !1));
			return;
		case "geometric":
			R(e.base, `${t}.base`, n, !1), (!(e.ratio > 0) || !Number.isFinite(e.ratio)) && V(n, "invalid-value", `${t}.ratio`, "Geometric curve ratio must be positive and finite.");
			return;
		case "table":
			e.values.length === 0 && V(n, "invalid-value", `${t}.values`, "Curve table must not be empty."), e.values.forEach((e, r) => R(e, `${t}.values[${r}]`, n, !1));
			return;
		case "piecewise": {
			(e.segments.length === 0 || e.segments[0]?.startIndex !== 0) && V(n, "invalid-value", `${t}.segments`, "Piecewise curve must start with segment index 0.");
			let r = -1;
			for (let [i, a] of e.segments.entries()) {
				let e = `${t}.segments[${i}]`;
				(!Number.isSafeInteger(a.startIndex) || a.startIndex <= r) && V(n, "invalid-value", `${e}.startIndex`, "Piecewise segment startIndex must be strictly increasing safe integers."), r = a.startIndex, N(a.curve, `${e}.curve`, n);
			}
		}
	}
}
function P(e, t, n, r) {
	for (let [i, a] of e.entries()) {
		let e = `${t}[${i}]`;
		switch (a.type) {
			case "currency":
				B(n.currencies, a.currencyId, `${e}.currencyId`, "currency", r), R(a.amount, `${e}.amount`, r, !0);
				break;
			case "producer":
				B(n.producers, a.producerId, `${e}.producerId`, "producer", r), Mn(a.count, `${e}.count`, "Producer reward count", r);
				break;
			case "character":
				B(n.characters, a.characterDefinitionId, `${e}.characterDefinitionId`, "character", r);
				break;
			case "token":
				B(n.tokens, a.tokenId, `${e}.tokenId`, "token", r), Mn(a.count, `${e}.count`, "Token reward count", r);
				break;
			case "boost":
				B(n.boosts, a.boostId, `${e}.boostId`, "boost", r);
				break;
			case "permanent-modifier":
				B(n.permanentModifiers, a.modifierId, `${e}.modifierId`, "permanent modifier", r);
				break;
			case "activity-advance":
				B(n.activities, a.activityId, `${e}.activityId`, "activity", r), (!Number.isSafeInteger(a.seconds) || a.seconds <= 0) && V(r, "invalid-value", `${e}.seconds`, "Activity advance reward seconds must be a positive safe integer.");
				break;
			case "title":
				B(n.titles, a.titleId, `${e}.titleId`, "title", r);
				break;
			case "unlock":
				B(n.unlockFlags, a.flagId, `${e}.flagId`, "unlock flag", r);
				break;
			case "composite": P(a.rewards, `${e}.rewards`, n, r);
		}
	}
}
function F(e, t, n, r) {
	switch (e.type) {
		case "and":
		case "or":
			e.conditions.forEach((e, i) => F(e, `${t}.conditions[${i}]`, n, r));
			return;
		case "not":
			F(e.condition, `${t}.condition`, n, r);
			return;
		case "currency-balance-at-least":
		case "lifetime-currency-earned-at-least":
			B(n.currencies, e.currencyId, `${t}.currencyId`, "currency", r), R(e.amount, `${t}.amount`, r, !0);
			return;
		case "producer-count-at-least":
			B(n.producers, e.producerId, `${t}.producerId`, "producer", r), (!Number.isSafeInteger(e.count) || e.count < 0) && V(r, "invalid-value", `${t}.count`, "Producer condition count must be a non-negative safe integer.");
			return;
		case "producer-level-at-least":
			B(n.producers, e.producerId, `${t}.producerId`, "producer", r), z(e.level, `${t}.level`, "Producer level", r);
			return;
		case "character-owned":
			B(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r);
			return;
		case "character-level-at-least":
			B(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r), z(e.level, `${t}.level`, "Character level", r);
			return;
		case "activity-progress-at-least":
			B(n.activities, e.activityId, `${t}.activityId`, "activity", r), (!Number.isFinite(e.progress) || e.progress < 0) && V(r, "invalid-value", `${t}.progress`, "Activity progress condition must be finite and non-negative.");
			return;
		case "activity-milestone-reached": {
			B(n.activities, e.activityId, `${t}.activityId`, "activity", r);
			let i = n.activityMilestones.get(e.activityId);
			i !== void 0 && !i.has(e.milestoneId) && V(r, "missing-reference", `${t}.milestoneId`, `Unknown activity milestone ID: ${e.milestoneId}`);
			return;
		}
		case "achievement-completed":
			B(n.achievements, e.achievementId, `${t}.achievementId`, "achievement", r);
			return;
		case "prestige-count-at-least":
			B(n.prestiges, e.prestigeId, `${t}.prestigeId`, "prestige", r), (!Number.isSafeInteger(e.count) || e.count < 0) && V(r, "invalid-value", `${t}.count`, "Prestige count must be a non-negative safe integer.");
			return;
		case "gacha-draw-count-at-least":
			B(n.gachas, e.gachaId, `${t}.gachaId`, "gacha", r), (!Number.isSafeInteger(e.count) || e.count < 0) && V(r, "invalid-value", `${t}.count`, "Gacha draw count must be a non-negative safe integer.");
			return;
		case "calendar-streak-at-least":
			B(n.calendarRewards, e.calendarRewardId, `${t}.calendarRewardId`, "calendar reward", r), (!Number.isSafeInteger(e.count) || e.count < 0) && V(r, "invalid-value", `${t}.count`, "Calendar streak count must be a non-negative safe integer.");
			return;
		case "unlock-flag": B(n.unlockFlags, e.flagId, `${t}.flagId`, "unlock flag", r);
	}
}
function Cn(e, t, n, r) {
	switch (e.type) {
		case "currency-balance":
		case "lifetime-currency-earned":
			B(n.currencies, e.currencyId, `${t}.currencyId`, "currency", r), jn(e.target, `${t}.target`, r);
			return;
		case "producer-count":
		case "producer-level":
			B(n.producers, e.producerId, `${t}.producerId`, "producer", r), I(e.target, `${t}.target`, r);
			return;
		case "character-level":
			B(n.characters, e.characterDefinitionId, `${t}.characterDefinitionId`, "character", r), I(e.target, `${t}.target`, r);
			return;
		case "activity-progress":
			B(n.activities, e.activityId, `${t}.activityId`, "activity", r), (!Number.isFinite(e.target) || e.target <= 0 || e.target > 1) && V(r, "invalid-value", `${t}.target`, "Activity progress target must be > 0 and <= 1.");
			return;
		case "gacha-draw-count":
			B(n.gachas, e.gachaId, `${t}.gachaId`, "gacha", r), I(e.target, `${t}.target`, r);
			return;
		case "prestige-count":
			B(n.prestiges, e.prestigeId, `${t}.prestigeId`, "prestige", r), I(e.target, `${t}.target`, r);
			return;
		case "calendar-streak": B(n.calendarRewards, e.calendarRewardId, `${t}.calendarRewardId`, "calendar reward", r), I(e.target, `${t}.target`, r);
	}
}
function I(e, t, n) {
	(!Number.isFinite(e) || e <= 0) && V(n, "invalid-value", t, "Achievement progress target must be a positive finite number.");
}
function wn(e, t, n, r) {
	e.length === 0 && V(r, "invalid-value", `${t}.id`, "Gacha rule ID must not be empty."), n.has(e) && V(r, "duplicate-id", `${t}.id`, `Duplicate Gacha rule ID: ${e}`), n.add(e);
}
function Tn(e, t, n, r) {
	e.length === 0 && V(r, "invalid-value", n, "Gacha rule pool must not be empty.");
	let i = /* @__PURE__ */ new Set();
	for (let [a, o] of e.entries()) i.has(o) && V(r, "duplicate-id", `${n}[${a}]`, `Duplicate Gacha rule pool entry ID: ${o}`), i.add(o), t.has(o) || V(r, "missing-reference", `${n}[${a}]`, `Unknown Gacha pool entry ID: ${o}`);
}
function En(e, t, n, r) {
	L(e.currencies, n.currencies, `${t}.currencies`, "currency", r), L(e.tokens, n.tokens, `${t}.tokens`, "token", r), L(e.producers, n.producers, `${t}.producers`, "producer", r), L(e.characters, n.characters, `${t}.characters`, "character", r), L(e.achievements, n.achievements, `${t}.achievements`, "achievement", r), L(e.titles, n.titles, `${t}.titles`, "title", r), L(e.progressionFlags, n.unlockFlags, `${t}.progressionFlags`, "unlock flag", r), L(e.gachaStates, n.gachas, `${t}.gachaStates`, "gacha", r), L(e.activeBoosts, n.boosts, `${t}.activeBoosts`, "boost", r);
}
function L(e, t, n, r, i) {
	if (e === void 0 || e === "retain" || e === "reset") return;
	let a = /* @__PURE__ */ new Set();
	for (let [o, s] of e.resetIds.entries()) a.has(s) && V(i, "duplicate-id", `${n}.resetIds[${o}]`, `Duplicate reset ${r} ID: ${s}`), a.add(s), B(t, s, `${n}.resetIds[${o}]`, r, i);
}
function Dn(e, t) {
	let n = new Map(e.map((e) => [e.id, On(e.condition)])), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = (e, o) => {
		if (!i.has(e)) {
			if (r.has(e)) {
				let n = o.indexOf(e);
				V(t, "cyclic-dependency", "achievements", `Achievement dependency cycle: ${[...o.slice(Math.max(0, n)), e].join(" -> ")}`);
				return;
			}
			r.add(e);
			for (let t of n.get(e) ?? []) n.has(t) && a(t, [...o, e]);
			r.delete(e), i.add(e);
		}
	};
	for (let e of n.keys()) a(e, []);
}
function On(e) {
	switch (e.type) {
		case "achievement-completed": return [e.achievementId];
		case "and":
		case "or": return e.conditions.flatMap(On);
		case "not": return On(e.condition);
		default: return [];
	}
}
function kn(e, t, n) {
	e.target.length === 0 && V(n, "invalid-value", `${t}.target`, "Modifier target must not be empty."), e.source.length === 0 && V(n, "invalid-value", `${t}.source`, "Modifier source must not be empty."), An(e, t, n);
}
function An(e, t, n) {
	R(e.value, `${t}.value`, n, !1), e.operation === "override" ? e.overridePriority !== void 0 && !Number.isSafeInteger(e.overridePriority) && V(n, "invalid-value", `${t}.overridePriority`, "Override priority must be a safe integer when specified.") : e.overridePriority !== void 0 && V(n, "invalid-value", `${t}.overridePriority`, "overridePriority is only valid for override modifiers.");
}
function jn(e, t, n) {
	try {
		y.from(e).compare(0) <= 0 && V(n, "invalid-value", t, "Value must be positive.");
	} catch {
		V(n, "invalid-value", t, "Value must be a finite GameNumber.");
	}
}
function R(e, t, n, r) {
	try {
		let i = y.from(e);
		r && i.isNegative() && V(n, "invalid-value", t, "Value must be non-negative.");
	} catch {
		V(n, "invalid-value", t, "Value must be a finite GameNumber.");
	}
}
function z(e, t, n, r) {
	(!Number.isSafeInteger(e) || e < 1) && V(r, "invalid-value", t, `${n} must be a positive safe integer.`);
}
function Mn(e, t, n, r) {
	(!Number.isSafeInteger(e) || e <= 0) && V(r, "invalid-value", t, `${n} must be a positive safe integer.`);
}
function B(e, t, n, r, i) {
	e.has(t) || V(i, "missing-reference", n, `Unknown ${r} ID: ${t}`);
}
function V(e, t, n, r) {
	e.push({
		code: t,
		path: n,
		message: r
	});
}
//#endregion
//#region src/domain/rng/rng.ts
var Nn = 4294967296;
function Pn(e) {
	let t = e.state + 1831565813 >>> 0, n = t;
	return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), {
		value: ((n ^ n >>> 14) >>> 0) / Nn,
		stream: {
			algorithmId: "mulberry32-v1",
			state: t
		}
	};
}
function Fn(e, t) {
	if (!(t >= 0 && t < 1)) throw RangeError("randomValue must be in [0, 1).");
	if (e.length === 0) throw RangeError("Weighted candidate list must not be empty.");
	let n = 0;
	for (let t of e) {
		if (!(t.weight > 0) || !Number.isFinite(t.weight)) throw RangeError("Weighted candidate weights must be positive and finite.");
		n += t.weight;
	}
	if (!Number.isFinite(n)) throw RangeError("Weighted candidate total weight must be finite.");
	let r = t * n, i = 0;
	for (let t of e) if (i += t.weight, r < i) return t;
	return e[e.length - 1];
}
function In(e, t) {
	let n = e >>> 0;
	return Object.fromEntries(t.map((e, t) => [e, {
		algorithmId: "mulberry32-v1",
		state: Ln(n, t + 1, e)
	}]));
}
function Ln(e, t, n) {
	let r = (e ^ Math.imul(t, 2654435769)) >>> 0;
	for (let e of n) r = Math.imul(r ^ e.codePointAt(0), 2246822507) >>> 0;
	return r || 1831565813;
}
//#endregion
//#region src/domain/gacha/gacha.ts
function Rn(e) {
	if (Vn(e.definition), !e.definition.allowedDrawCounts.includes(e.drawCount)) return H(e.state, "invalid-draw-count");
	let t = e.state.rngStreams[e.definition.rngStreamName];
	if (t === void 0) return H(e.state, "missing-rng-stream");
	let n = e.state;
	if ("currencyId" in e.definition.cost) {
		let t = y.from(e.definition.cost.amountPerDraw).multiply(e.drawCount), r = mt(e.state.currencies, {
			currencyId: e.definition.cost.currencyId,
			amount: t,
			kind: "spend",
			source: `gacha.${e.definition.id}`
		}, e.resolveCurrencyDefinition?.(e.definition.cost.currencyId));
		if (!r.accepted) return H(e.state, "insufficient-currency");
		n = {
			...e.state,
			currencies: r.balances
		}, n = Dt(n, e.definition.cost.currencyId, r.appliedAmount);
	} else {
		let t = e.definition.cost.countPerDraw * e.drawCount;
		if (!Number.isSafeInteger(t)) throw RangeError("Gacha token cost exceeds safe integer range.");
		let r = wt(e.state.tokens, e.definition.cost.tokenId, t);
		if (!r.accepted) return H(e.state, "insufficient-token");
		n = {
			...e.state,
			tokens: r.tokens
		};
	}
	let r = e.state.gachaStates[e.definition.id], i = r?.totalDrawCount ?? 0, a = r?.pityMissCount ?? 0, o = t, s = [], c = e.definition.batchGuarantees?.find((t) => t.drawCount === e.drawCount);
	for (let t = 0; t < e.drawCount; t += 1) {
		let n = zn({
			definition: e.definition,
			drawCount: e.drawCount,
			drawIndex: t,
			stream: o,
			pityMissCount: a
		});
		if (o = n.stream, a = n.pityMissCount, s.push(n.draw), c === void 0 || (t + 1) % c.batchSize !== 0) continue;
		let r = t + 1 - c.batchSize, i = s.slice(r, t + 1), l = new Set(c.poolEntryIds);
		if (i.some((e) => l.has(e.entry.id))) continue;
		a = s[t].pityMissCountBefore;
		let u = Math.floor(t / c.batchSize), d = zn({
			definition: e.definition,
			drawCount: e.drawCount,
			drawIndex: t,
			stream: o,
			pityMissCount: a,
			forcedPoolEntryIds: c.poolEntryIds,
			forcedSelectionRule: {
				kind: "batch-guarantee",
				ruleId: c.id,
				batchIndex: u
			}
		});
		o = d.stream, a = d.pityMissCount, s[t] = d.draw;
	}
	let l = [], u = e.definition.duplicatePolicy ?? "resolve-with-hook";
	for (let [t, r] of s.entries()) {
		let a = i + t + 1, o = {
			gachaId: e.definition.id,
			entryId: r.entry.id,
			drawIndex: t,
			globalDrawNumber: a,
			selectionRule: r.selectionRule
		}, s = e.hooks.isDuplicate(n, r.entry.reward);
		s ? u === "resolve-with-hook" ? n = e.hooks.grantDuplicate(n, r.entry.reward, o) : u === "grant-again" && (n = e.hooks.grantReward(n, r.entry.reward, o)) : n = e.hooks.grantReward(n, r.entry.reward, o);
		let c = {
			...o,
			duplicate: s,
			duplicatePolicy: u
		};
		l.push({
			id: `${e.definition.id}:draw:${a}:${e.state.simTimeSec}`,
			type: "gachaDrawn",
			simTimeSec: e.state.simTimeSec,
			payload: c
		});
	}
	let d = e.definition.pity === void 0 ? { totalDrawCount: i + e.drawCount } : {
		totalDrawCount: i + e.drawCount,
		pityMissCount: a
	};
	return n = {
		...n,
		rngStreams: {
			...n.rngStreams,
			[e.definition.rngStreamName]: o
		},
		gachaStates: {
			...n.gachaStates,
			[e.definition.id]: d
		}
	}, {
		accepted: !0,
		state: n,
		events: l
	};
}
function zn(e) {
	let t = Pn(e.stream), n = e.definition.pity, r = n !== void 0 && e.pityMissCount + 1 >= n.threshold, i = e.definition.guaranteedSlots?.find((t) => t.drawCount === e.drawCount && t.drawIndex === e.drawIndex), a, o;
	e.forcedPoolEntryIds === void 0 ? r && n !== void 0 ? (a = {
		kind: "pity",
		ruleId: n.id
	}, o = n.poolEntryIds) : i === void 0 ? (a = null, o = void 0) : (a = {
		kind: "guaranteed-slot",
		ruleId: i.id
	}, o = i.poolEntryIds) : (a = e.forcedSelectionRule ?? null, o = r && n !== void 0 ? Wn(e.forcedPoolEntryIds, n.poolEntryIds) : e.forcedPoolEntryIds);
	let s = Bn(o === void 0 ? e.definition.pool : e.definition.pool.filter((e) => o.includes(e.id)), t.value), c = n === void 0 ? e.pityMissCount : n.poolEntryIds.includes(s.id) ? 0 : e.pityMissCount + 1;
	return {
		draw: {
			entry: s,
			selectionRule: a,
			pityMissCountBefore: e.pityMissCount
		},
		stream: t.stream,
		pityMissCount: c
	};
}
function Bn(e, t) {
	return Fn(e, t);
}
function Vn(e) {
	if (e.pool.length === 0) throw RangeError("Gacha pool must not be empty.");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.pool) {
		if (t.has(n.id)) throw RangeError(`Duplicate Gacha pool entry ID: ${n.id}`);
		if (t.add(n.id), !(n.weight > 0) || !Number.isFinite(n.weight)) throw RangeError(`Gacha weight must be positive and finite: ${n.id}`);
		if (n.rarity !== void 0 && n.rarity.length === 0) throw RangeError(`Gacha rarity must not be empty: ${n.id}`);
	}
	if ("currencyId" in e.cost) {
		if (y.from(e.cost.amountPerDraw).isNegative()) throw RangeError("Gacha currency cost must be non-negative.");
	} else if (!Number.isSafeInteger(e.cost.countPerDraw) || e.cost.countPerDraw < 0) throw RangeError("Gacha token cost must be a non-negative safe integer.");
	if (e.allowedDrawCounts.length === 0) throw RangeError("Gacha must allow at least one draw count.");
	let n = /* @__PURE__ */ new Set();
	for (let t of e.allowedDrawCounts) {
		if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("Allowed Gacha draw counts must be positive safe integers.");
		if (n.has(t)) throw RangeError(`Duplicate allowed Gacha draw count: ${t}`);
		n.add(t);
	}
	let r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set();
	for (let a of e.guaranteedSlots ?? []) {
		if (Hn(a.id, r), !n.has(a.drawCount)) throw RangeError(`Guaranteed slot drawCount is not allowed: ${a.drawCount}`);
		if (!Number.isSafeInteger(a.drawIndex) || a.drawIndex < 0 || a.drawIndex >= a.drawCount) throw RangeError(`Guaranteed slot drawIndex is outside its drawCount: ${a.drawIndex}`);
		let e = `${a.drawCount}:${a.drawIndex}`;
		if (i.has(e)) throw RangeError(`Duplicate guaranteed Gacha slot: ${e}`);
		i.add(e), Un(a.poolEntryIds, t, `Guaranteed slot ${a.id}`);
	}
	let a = /* @__PURE__ */ new Set();
	for (let i of e.batchGuarantees ?? []) {
		if (Hn(i.id, r), !n.has(i.drawCount)) throw RangeError(`Batch guarantee drawCount is not allowed: ${i.drawCount}`);
		if (!Number.isSafeInteger(i.batchSize) || i.batchSize <= 0 || i.batchSize > i.drawCount) throw RangeError(`Batch guarantee batchSize must be a positive safe integer <= drawCount: ${i.id}`);
		if (i.drawCount % i.batchSize !== 0) throw RangeError(`Batch guarantee batchSize must evenly divide drawCount: ${i.id}`);
		if (a.has(i.drawCount)) throw RangeError(`Only one batch guarantee may target a drawCount: ${i.drawCount}`);
		a.add(i.drawCount), Un(i.poolEntryIds, t, `Batch guarantee ${i.id}`);
	}
	if (e.pity !== void 0) {
		if (Hn(e.pity.id, r), !Number.isSafeInteger(e.pity.threshold) || e.pity.threshold <= 0) throw RangeError("Gacha pity threshold must be a positive safe integer.");
		Un(e.pity.poolEntryIds, t, `Pity ${e.pity.id}`);
		for (let t of e.batchGuarantees ?? []) if (Wn(t.poolEntryIds, e.pity.poolEntryIds).length === 0) throw RangeError(`Batch guarantee and pity pools must overlap: ${t.id}`);
	}
}
function Hn(e, t) {
	if (e.length === 0) throw RangeError("Gacha rule ID must not be empty.");
	if (t.has(e)) throw RangeError(`Duplicate Gacha rule ID: ${e}`);
	t.add(e);
}
function Un(e, t, n) {
	if (e.length === 0) throw RangeError(`${n} pool must not be empty.`);
	let r = /* @__PURE__ */ new Set();
	for (let i of e) {
		if (r.has(i)) throw RangeError(`${n} contains duplicate pool entry ID: ${i}`);
		if (r.add(i), !t.has(i)) throw RangeError(`${n} references unknown pool entry ID: ${i}`);
	}
}
function Wn(e, t) {
	let n = new Set(t);
	return e.filter((e) => n.has(e));
}
function H(e, t) {
	return {
		accepted: !1,
		state: e,
		events: [],
		reason: t
	};
}
//#endregion
//#region src/domain/inventory/inventory.ts
function Gn(e, t) {
	return $n(t) ? e[t.instanceId] === void 0 ? {
		accepted: !0,
		inventory: {
			...e,
			[t.instanceId]: t
		}
	} : {
		accepted: !1,
		inventory: e,
		reason: "duplicate-instance"
	} : {
		accepted: !1,
		inventory: e,
		reason: "invalid-item"
	};
}
function Kn(e, t) {
	let n = e[t];
	if (n === void 0) return {
		accepted: !1,
		inventory: e,
		reason: "unknown-instance"
	};
	let r = { ...e };
	return delete r[t], {
		accepted: !0,
		inventory: r,
		removed: n
	};
}
function qn(e) {
	W(e);
	let t = e.slots.filter((e) => e.initiallyLocked === !0).map((e) => e.id);
	return {
		definitionId: e.id,
		equipped: Object.fromEntries(e.slots.map((e) => [e.id, null])),
		...t.length > 0 ? { lockedSlotIds: t } : {}
	};
}
function U(e, t) {
	return !(e.lockedSlotIds ?? []).includes(t);
}
function Jn(e, t, n) {
	if (W(e), t.definitionId !== e.id) return {
		accepted: !1,
		loadout: t,
		reason: "definition-mismatch"
	};
	if (!e.slots.some((e) => e.id === n)) return {
		accepted: !1,
		loadout: t,
		reason: "unknown-slot"
	};
	if (U(t, n)) return {
		accepted: !0,
		loadout: t,
		changed: !1
	};
	let r = (t.lockedSlotIds ?? []).filter((e) => e !== n), i = {
		definitionId: t.definitionId,
		equipped: t.equipped
	};
	return {
		accepted: !0,
		loadout: r.length > 0 ? {
			...i,
			lockedSlotIds: r
		} : i,
		changed: !0
	};
}
function Yn(e) {
	if (W(e.loadoutDefinition), e.loadout.definitionId !== e.loadoutDefinition.id) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "definition-mismatch"
	};
	let t = e.loadoutDefinition.slots.find((t) => t.id === e.slotId);
	if (t === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-slot"
	};
	if (!U(e.loadout, e.slotId)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-locked"
	};
	let n = e.inventory[e.itemInstanceId];
	if (n === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item"
	};
	let r = e.itemDefinitions[n.definitionId];
	if (r === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item-definition"
	};
	if (!Qn(t, r)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-restriction"
	};
	if (Object.entries(e.loadout.equipped).find(([t, n]) => t !== e.slotId && n === e.itemInstanceId) !== void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "already-equipped"
	};
	let i = e.loadout.equipped[e.slotId] ?? null;
	return i === e.itemInstanceId ? {
		accepted: !0,
		loadout: e.loadout,
		replacedItemInstanceId: i
	} : {
		accepted: !0,
		loadout: {
			...e.loadout,
			equipped: {
				...e.loadout.equipped,
				[e.slotId]: e.itemInstanceId
			}
		},
		replacedItemInstanceId: i
	};
}
function Xn(e, t, n) {
	if (W(e), t.definitionId !== e.id) return {
		accepted: !1,
		loadout: t,
		reason: "definition-mismatch"
	};
	if (!e.slots.some((e) => e.id === n)) return {
		accepted: !1,
		loadout: t,
		reason: "unknown-slot"
	};
	let r = t.equipped[n] ?? null;
	return r === null ? {
		accepted: !0,
		loadout: t,
		removedItemInstanceId: r
	} : {
		accepted: !0,
		loadout: {
			...t,
			equipped: {
				...t.equipped,
				[n]: null
			}
		},
		removedItemInstanceId: r
	};
}
function Zn(e) {
	if (W(e.loadoutDefinition), e.loadout.definitionId !== e.loadoutDefinition.id) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "definition-mismatch"
	};
	let t = e.loadoutDefinition.slots.find((t) => t.id === e.fromSlotId), n = e.loadoutDefinition.slots.find((t) => t.id === e.toSlotId);
	if (t === void 0 || n === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-slot"
	};
	let r = e.loadout.equipped[e.fromSlotId] ?? null;
	if (r === null) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "source-empty"
	};
	if (e.fromSlotId === e.toSlotId) return {
		accepted: !0,
		loadout: e.loadout,
		movedItemInstanceId: r,
		swappedItemInstanceId: null
	};
	if (!U(e.loadout, e.toSlotId)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-locked"
	};
	let i = e.inventory[r];
	if (i === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item"
	};
	let a = e.itemDefinitions[i.definitionId];
	if (a === void 0) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "unknown-item-definition"
	};
	if (!Qn(n, a)) return {
		accepted: !1,
		loadout: e.loadout,
		reason: "slot-restriction"
	};
	let o = e.loadout.equipped[e.toSlotId] ?? null;
	if (o !== null) {
		if (e.allowSwap !== !0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "target-occupied"
		};
		let n = e.inventory[o];
		if (n === void 0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "unknown-item"
		};
		let r = e.itemDefinitions[n.definitionId];
		if (r === void 0) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "unknown-item-definition"
		};
		if (!Qn(t, r)) return {
			accepted: !1,
			loadout: e.loadout,
			reason: "slot-restriction"
		};
	}
	return {
		accepted: !0,
		loadout: {
			...e.loadout,
			equipped: {
				...e.loadout.equipped,
				[e.fromSlotId]: o,
				[e.toSlotId]: r
			}
		},
		movedItemInstanceId: r,
		swappedItemInstanceId: o
	};
}
function Qn(e, t) {
	if (e.acceptsTags === void 0 || e.acceptsTags.length === 0) return !0;
	let n = new Set(t.tags ?? []);
	return e.acceptsTags.some((e) => n.has(e));
}
function $n(e) {
	return e.instanceId.length > 0 && e.definitionId.length > 0 && Number.isSafeInteger(e.quantity) && e.quantity > 0;
}
function W(e) {
	if (e.id.length === 0) throw RangeError("Loadout id must not be empty.");
	if (e.slots.length === 0) throw RangeError("Loadout must contain at least one slot.");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.slots) {
		if (n.id.length === 0) throw RangeError("Loadout slot id must not be empty.");
		if (t.has(n.id)) throw RangeError(`Duplicate loadout slot id: ${n.id}`);
		if (t.add(n.id), n.acceptsTags?.some((e) => e.length === 0)) throw RangeError(`Loadout slot ${n.id} contains an empty accepted tag.`);
	}
}
//#endregion
//#region src/domain/level/level.ts
function er(e) {
	rr(e.currentLevel, "currentLevel");
	let t = e.count ?? 1;
	if (!Number.isSafeInteger(t) || t <= 0) throw RangeError("Level-up count must be a positive safe integer.");
	nr(e.definition);
	let n = tr(e.definition);
	if (n !== null && e.currentLevel >= n) return {
		available: !1,
		currentLevel: e.currentLevel,
		requestedCount: t,
		reason: "max-level"
	};
	if (t > 2 ** 53 - 1 - e.currentLevel) throw RangeError("Target level must remain a safe integer.");
	let r = e.currentLevel + t;
	if (n !== null && r > n) return {
		available: !1,
		currentLevel: e.currentLevel,
		requestedCount: t,
		reason: "exceeds-max-level"
	};
	if (e.definition.eligibility !== void 0) {
		if (e.conditionContext === void 0) throw Error("Level eligibility requires conditionContext.");
		if (!w(e.definition.eligibility, e.conditionContext)) return {
			available: !1,
			currentLevel: e.currentLevel,
			requestedCount: t,
			reason: "ineligible"
		};
	}
	let i = x(e.definition.costCurve, e.currentLevel - 1, t);
	if (i.isNegative()) throw RangeError("Level-up cost curve must not produce a negative interval cost.");
	let a = [...e.definition.milestones ?? []].filter((t) => e.currentLevel < t.level && t.level <= r).toSorted((e, t) => e.level - t.level || e.id.localeCompare(t.id));
	return {
		available: !0,
		currentLevel: e.currentLevel,
		targetLevel: r,
		count: t,
		totalCost: i,
		currentStat: e.definition.statCurve === void 0 ? null : b(e.definition.statCurve, e.currentLevel - 1),
		targetStat: e.definition.statCurve === void 0 ? null : b(e.definition.statCurve, r - 1),
		crossedMilestones: a
	};
}
function tr(e) {
	let t = [
		e.maxLevel ?? null,
		e.costCurve.type === "table" ? e.costCurve.values.length + 1 : null,
		e.statCurve?.type === "table" ? e.statCurve.values.length : null
	].filter((e) => e !== null);
	return t.length === 0 ? null : Math.min(...t);
}
function nr(e) {
	e.maxLevel !== void 0 && rr(e.maxLevel, "maxLevel");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.milestones ?? []) {
		if (t.has(n.id)) throw RangeError(`Duplicate level milestone ID: ${n.id}`);
		t.add(n.id), rr(n.level, `milestone ${n.id} level`);
	}
}
function rr(e, t) {
	if (!Number.isSafeInteger(e) || e < 1) throw RangeError(`${t} must be a positive safe integer.`);
}
//#endregion
//#region src/domain/mission/mission.ts
function ir(e, t, n, r) {
	K(n);
	let i = G(e, t.id, n), a = i?.completed === !0, o = i?.claimed === !0;
	return {
		id: t.id,
		completed: a,
		claimed: o,
		claimable: a && !o && (t.claimPolicy ?? "manual") === "manual",
		progress: a ? 1 : fr(i, t, r),
		points: Sr(t.points)
	};
}
function ar(e, t, n, r) {
	K(r);
	let i = mr(e, t, n, r), a = _r(e, t.id, r), o = new Set(a?.claimedMilestoneIds ?? []);
	return {
		id: t.id,
		periodIndex: r,
		points: i,
		milestones: (t.pointMilestones ?? []).map((e) => ({
			id: e.id,
			pointsRequired: e.pointsRequired,
			claimed: o.has(e.id),
			claimable: i >= e.pointsRequired && !o.has(e.id) && (e.claimPolicy ?? "manual") === "manual"
		}))
	};
}
function or(e) {
	if (K(e.periodIndex), gr(e.state, e.setDefinition, e.missionDefinitions, e.periodIndex)) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "clock-rollback"
	};
	let t = hr(e.setDefinition, e.missionDefinitions), n = e.state, r = [];
	for (let i of e.setDefinition.missionIds) {
		let a = t.get(i);
		if (a === void 0 || a.objective.type !== "condition" || G(n, a.id, e.periodIndex)?.completed === !0 || !w(a.objective.condition, e.createConditionContext(n))) continue;
		let o = ur(n, a, e.periodIndex, e.grantRewards);
		n = o.state, r.push(...o.events);
	}
	let i = dr(n, e.setDefinition, e.missionDefinitions, e.periodIndex, e.grantRewards);
	return {
		accepted: !0,
		state: i.state,
		events: [...r, ...i.events]
	};
}
function sr(e) {
	if (K(e.periodIndex), gr(e.state, e.setDefinition, e.missionDefinitions, e.periodIndex)) return {
		accepted: !1,
		state: e.state,
		events: [],
		reason: "clock-rollback"
	};
	let t = pr(e.updates), n = hr(e.setDefinition, e.missionDefinitions), r = e.state, i = [];
	for (let a of e.setDefinition.missionIds) {
		let o = n.get(a);
		if (o === void 0 || o.objective.type !== "counter") continue;
		let s = t.get(o.objective.metricId);
		if (s === void 0 || s.compare(0) <= 0) continue;
		let c = G(r, o.id, e.periodIndex);
		if (c?.completed === !0) continue;
		let l = c?.progress === void 0 ? y.zero() : y.from(c.progress), u = y.from(o.objective.target), d = l.add(s);
		if (r = vr(r, o.id, {
			periodIndex: e.periodIndex,
			completed: !1,
			claimed: !1,
			progress: d.serialize()
		}), d.greaterThanOrEqual(u)) {
			let t = ur(r, o, e.periodIndex, e.grantRewards, d.serialize());
			r = t.state, i.push(...t.events);
		}
	}
	let a = dr(r, e.setDefinition, e.missionDefinitions, e.periodIndex, e.grantRewards);
	return {
		accepted: !0,
		state: a.state,
		events: [...i, ...a.events]
	};
}
function cr(e, t, n, r) {
	K(n);
	let i = e.missionStates?.[t.id];
	if (i !== void 0 && i.periodIndex > n) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "clock-rollback"
	};
	if ((t.claimPolicy ?? "manual") === "auto") return {
		accepted: !1,
		state: e,
		events: [],
		reason: "auto-claim"
	};
	let a = G(e, t.id, n);
	if (a?.completed !== !0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "not-completed"
	};
	if (a.claimed) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "already-claimed"
	};
	let o = r(e, t.rewards);
	return o = vr(o, t.id, {
		...a,
		claimed: !0
	}), {
		accepted: !0,
		state: o,
		rewards: t.rewards,
		events: [br(o, "missionClaimed", t.id, n)]
	};
}
function lr(e, t, n, r, i, a) {
	K(i);
	let o = e.missionSetStates?.[t.id];
	if (o !== void 0 && o.periodIndex > i) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "clock-rollback"
	};
	let s = t.pointMilestones?.find((e) => e.id === r);
	if (s === void 0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "unknown-milestone"
	};
	if ((s.claimPolicy ?? "manual") === "auto") return {
		accepted: !1,
		state: e,
		events: [],
		reason: "auto-claim"
	};
	let c = _r(e, t.id, i);
	if (c?.claimedMilestoneIds.includes(s.id) === !0) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "already-claimed"
	};
	if (mr(e, t, n, i) < s.pointsRequired) return {
		accepted: !1,
		state: e,
		events: [],
		reason: "not-reached"
	};
	let l = a(e, s.rewards);
	return l = yr(l, t.id, {
		periodIndex: i,
		claimedMilestoneIds: [...c?.claimedMilestoneIds ?? [], s.id]
	}), {
		accepted: !0,
		state: l,
		rewards: s.rewards,
		events: [xr(l, t.id, s.id, i)]
	};
}
function ur(e, t, n, r, i) {
	let a = (t.claimPolicy ?? "manual") === "auto", o = vr(e, t.id, {
		periodIndex: n,
		completed: !0,
		claimed: a,
		...i === void 0 ? {} : { progress: i }
	}), s = [br(o, "missionCompleted", t.id, n)];
	return a && (o = r(o, t.rewards), s.push(br(o, "missionClaimed", t.id, n))), {
		state: o,
		events: s
	};
}
function dr(e, t, n, r, i) {
	let a = mr(e, t, n, r), o = _r(e, t.id, r), s = new Set(o?.claimedMilestoneIds ?? []), c = e, l = [];
	for (let e of t.pointMilestones ?? []) (e.claimPolicy ?? "manual") === "auto" && (s.has(e.id) || a < e.pointsRequired || (c = i(c, e.rewards), s.add(e.id), c = yr(c, t.id, {
		periodIndex: r,
		claimedMilestoneIds: [...s]
	}), l.push(xr(c, t.id, e.id, r))));
	return {
		state: c,
		events: l
	};
}
function fr(e, t, n) {
	if (t.objective.type === "condition") return t.objective.progressMetric === void 0 ? null : ut(t.objective.progressMetric, n);
	let r = y.from(t.objective.target);
	if (r.compare(0) <= 0) return 1;
	let i = e?.progress === void 0 ? y.zero() : y.from(e.progress);
	return i.greaterThanOrEqual(r) ? 1 : i.compare(0) <= 0 ? 0 : Math.min(1, Math.max(0, i.divide(r).toNumber()));
}
function pr(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (n.metricId.length === 0) throw RangeError("Mission progress metricId must not be empty.");
		let e = y.from(n.amount);
		if (e.compare(0) < 0) throw RangeError("Mission progress amount must be non-negative.");
		t.set(n.metricId, (t.get(n.metricId) ?? y.zero()).add(e));
	}
	return t;
}
function mr(e, t, n, r) {
	let i = hr(t, n);
	return t.missionIds.reduce((t, n) => {
		let a = i.get(n);
		return a === void 0 ? t : G(e, n, r)?.completed === !0 ? t + Sr(a.points) : t;
	}, 0);
}
function hr(e, t) {
	return new Map(t.filter((t) => t.setId === e.id).map((e) => [e.id, e]));
}
function gr(e, t, n, r) {
	let i = e.missionSetStates?.[t.id];
	if (i !== void 0 && i.periodIndex > r) return !0;
	let a = new Set(t.missionIds);
	return n.some((n) => {
		if (n.setId !== t.id || !a.has(n.id)) return !1;
		let i = e.missionStates?.[n.id];
		return i !== void 0 && i.periodIndex > r;
	});
}
function G(e, t, n) {
	let r = e.missionStates?.[t];
	return r?.periodIndex === n ? r : void 0;
}
function _r(e, t, n) {
	let r = e.missionSetStates?.[t];
	return r?.periodIndex === n ? r : void 0;
}
function vr(e, t, n) {
	return {
		...e,
		missionStates: {
			...e.missionStates ?? {},
			[t]: n
		}
	};
}
function yr(e, t, n) {
	return {
		...e,
		missionSetStates: {
			...e.missionSetStates ?? {},
			[t]: n
		}
	};
}
function br(e, t, n, r) {
	return {
		id: `${t}:${n}:${r}:${e.simTimeSec}`,
		type: t,
		simTimeSec: e.simTimeSec,
		payload: {
			missionId: n,
			periodIndex: r
		}
	};
}
function xr(e, t, n, r) {
	return {
		id: `missionPointMilestoneClaimed:${t}:${n}:${r}:${e.simTimeSec}`,
		type: "missionPointMilestoneClaimed",
		simTimeSec: e.simTimeSec,
		payload: {
			missionSetId: t,
			milestoneId: n,
			periodIndex: r
		}
	};
}
function Sr(e) {
	if (e === void 0) return 0;
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError("Mission points must be a non-negative safe integer.");
	return e;
}
function K(e) {
	if (!Number.isSafeInteger(e)) throw RangeError("Mission periodIndex must be a safe integer.");
}
//#endregion
//#region src/domain/opportunity/opportunity.ts
function Cr(e) {
	if (q(e.definition), J(e.offeredAtSimTimeSec, "offeredAtSimTimeSec"), e.instanceId.length === 0) throw RangeError("Opportunity instanceId must not be empty.");
	let t = {
		instanceId: e.instanceId,
		opportunityId: e.definition.id,
		status: "open",
		offeredAtSimTimeSec: e.offeredAtSimTimeSec,
		expiresAtSimTimeSec: e.offeredAtSimTimeSec + e.definition.lifetimeSec,
		resolvedAtSimTimeSec: null,
		snapshot: e.snapshot
	};
	return {
		opportunity: t,
		events: [kr(t, "opportunityOffered", e.offeredAtSimTimeSec)]
	};
}
function wr(e) {
	q(e.definition), Or(e.opportunity, e.definition), J(e.targetSimTimeSec, "targetSimTimeSec");
	let t = e.offlineElapsedSec ?? 0;
	if (J(t, "offlineElapsedSec"), e.opportunity.status !== "open") return {
		opportunity: e.opportunity,
		events: []
	};
	let n = e.definition.offlinePolicy === "pause" && t > 0 ? e.opportunity.expiresAtSimTimeSec + t : e.opportunity.expiresAtSimTimeSec, r = n === e.opportunity.expiresAtSimTimeSec ? e.opportunity : {
		...e.opportunity,
		expiresAtSimTimeSec: n
	};
	if (e.targetSimTimeSec < n) return {
		opportunity: r,
		events: []
	};
	let i = {
		...r,
		status: "expired",
		resolvedAtSimTimeSec: n
	};
	return {
		opportunity: i,
		events: [kr(i, "opportunityExpired", n)]
	};
}
function Tr(e) {
	if (q(e.definition), Or(e.opportunity, e.definition), J(e.acceptedAtSimTimeSec, "acceptedAtSimTimeSec"), e.opportunity.status !== "open") return Y(e.opportunity, "not-open");
	if (e.acceptedAtSimTimeSec >= e.opportunity.expiresAtSimTimeSec) return Y(e.opportunity, "expired");
	let t = {
		...e.opportunity,
		status: "accepted",
		resolvedAtSimTimeSec: e.acceptedAtSimTimeSec
	};
	return Ar(t, kr(t, "opportunityAccepted", e.acceptedAtSimTimeSec));
}
function Er(e) {
	if (q(e.definition), Or(e.opportunity, e.definition), J(e.dismissedAtSimTimeSec, "dismissedAtSimTimeSec"), e.opportunity.status !== "open") return Y(e.opportunity, "not-open");
	if (e.dismissedAtSimTimeSec >= e.opportunity.expiresAtSimTimeSec) return Y(e.opportunity, "expired");
	if (e.definition.dismissalPolicy === "forbid") return Y(e.opportunity, "dismissal-forbidden");
	let t = {
		...e.opportunity,
		status: "dismissed",
		resolvedAtSimTimeSec: e.dismissedAtSimTimeSec
	};
	return Ar(t, kr(t, "opportunityDismissed", e.dismissedAtSimTimeSec));
}
function Dr(e, t) {
	return J(t, "simTimeSec"), e.status === "open" ? Math.max(0, e.expiresAtSimTimeSec - t) : 0;
}
function q(e) {
	if (e.id.length === 0) throw RangeError("Opportunity id must not be empty.");
	if (!Number.isSafeInteger(e.lifetimeSec) || e.lifetimeSec <= 0) throw RangeError("Opportunity lifetimeSec must be a positive safe integer.");
}
function Or(e, t) {
	if (e.opportunityId !== t.id) throw RangeError(`Opportunity definition mismatch: expected ${e.opportunityId}, got ${t.id}`);
}
function J(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function kr(e, t, n) {
	return {
		id: `${e.instanceId}:${t}:${n}`,
		type: t,
		simTimeSec: n,
		payload: {
			opportunityId: e.opportunityId,
			instanceId: e.instanceId
		}
	};
}
function Ar(e, t) {
	return {
		accepted: !0,
		opportunity: e,
		events: [t]
	};
}
function Y(e, t) {
	return {
		accepted: !1,
		opportunity: e,
		events: [],
		reason: t
	};
}
//#endregion
//#region src/domain/prestige/prestige.ts
function jr(e, t) {
	return {
		records: [
			X("currencies", e.currencies, t.currencies),
			X("tokens", e.tokens, t.tokens),
			X("producers", e.producers, t.producers),
			X("characters", e.characters, t.characters),
			X("achievements", e.achievements, t.achievements),
			X("titles", e.titles, t.titles),
			X("progressionFlags", e.progressionFlags, t.progressionFlags),
			X("gachaStates", e.gachaStates, t.gachaStates),
			X("activeBoosts", e.activeBoosts, t.activeBoosts)
		],
		statistics: t.statistics === "reset" ? "reset" : "retain"
	};
}
function Mr(e, t, n) {
	return {
		eligible: w(t.eligibility, n(e)),
		nextCount: (e.prestigeStates[t.id]?.count ?? 0) + 1,
		rewards: t.rewards(e),
		resetImpact: jr(e, t.resetPolicy)
	};
}
function Nr(e, t, n) {
	let r = Mr(e, t, n.createConditionContext);
	if (!r.eligible) return {
		accepted: !1,
		state: e,
		reason: "not-eligible"
	};
	let i = Pr(e, t.resetPolicy);
	return n.transformAfterReset !== void 0 && (i = n.transformAfterReset(i)), i = n.grantRewards(i, r.rewards), i = {
		...i,
		prestigeStates: {
			...i.prestigeStates,
			[t.id]: { count: r.nextCount }
		}
	}, {
		accepted: !0,
		state: i,
		rewards: r.rewards,
		prestigeCount: r.nextCount
	};
}
function Pr(e, t) {
	return {
		...e,
		currencies: Z(e.currencies, t.currencies),
		tokens: Z(e.tokens, t.tokens),
		producers: Z(e.producers, t.producers),
		characters: Z(e.characters, t.characters),
		achievements: Z(e.achievements, t.achievements),
		titles: Z(e.titles, t.titles),
		progressionFlags: Z(e.progressionFlags, t.progressionFlags),
		gachaStates: Z(e.gachaStates, t.gachaStates),
		activeBoosts: Z(e.activeBoosts, t.activeBoosts),
		statistics: t.statistics === "reset" ? {
			lifetimeCurrencyEarned: {},
			lifetimeCurrencySpent: {}
		} : e.statistics
	};
}
function X(e, t, n) {
	let r = Object.keys(t).toSorted();
	if (n === void 0 || n === "retain") return {
		category: e,
		mode: "retain",
		resetIds: [],
		retainedIds: r,
		configuredResetIds: []
	};
	if (n === "reset") return {
		category: e,
		mode: "reset",
		resetIds: r,
		retainedIds: [],
		configuredResetIds: []
	};
	let i = [...n.resetIds], a = new Set(i);
	return {
		category: e,
		mode: "reset-selected",
		resetIds: r.filter((e) => a.has(e)),
		retainedIds: r.filter((e) => !a.has(e)),
		configuredResetIds: i
	};
}
function Z(e, t) {
	if (t === void 0 || t === "retain") return e;
	if (t === "reset") return {};
	let n = new Set(t.resetIds);
	return Object.fromEntries(Object.entries(e).filter(([e]) => !n.has(e)));
}
//#endregion
//#region src/domain/rewarded-offer/rewarded-offer.ts
function Fr(e) {
	if (Br(e.definition), Vr(e.simTimeSec, "simTimeSec"), !Number.isSafeInteger(e.dailyPeriodIndex)) throw RangeError("dailyPeriodIndex must be a safe integer.");
	let t = e.offerState ?? Lr();
	if (e.definition.eligibility !== void 0) {
		if (e.createConditionContext === void 0) throw Error("Rewarded Offer eligibility requires createConditionContext.");
		if (!w(e.definition.eligibility, e.createConditionContext(e.state))) return Rr(!1, "ineligible", t, e);
	}
	if (zr(t, e.definition, e.simTimeSec) > 0) return Rr(!1, "cooldown", t, e);
	let n = t.dailyPeriodIndex === e.dailyPeriodIndex ? t.dailyGrantCount : 0;
	return e.definition.dailyCap !== void 0 && n >= e.definition.dailyCap ? Rr(!1, "daily-cap", t, e) : Rr(!0, null, t, e);
}
function Ir(e) {
	let t = e.offerStates[e.definition.id] ?? Lr(), n = Fr({
		state: e.state,
		offerState: t,
		definition: e.definition,
		simTimeSec: e.simTimeSec,
		dailyPeriodIndex: e.dailyPeriodIndex,
		...e.createConditionContext === void 0 ? {} : { createConditionContext: e.createConditionContext }
	});
	if (!n.available) return {
		accepted: !1,
		state: e.state,
		offerStates: e.offerStates,
		events: [],
		reason: n.reason
	};
	let r = e.grantRewards(e.state, e.definition.rewards), i = t.dailyPeriodIndex === e.dailyPeriodIndex ? t.dailyGrantCount + 1 : 1, a = {
		grantCount: t.grantCount + 1,
		lastGrantedAtSimTimeSec: e.simTimeSec,
		dailyPeriodIndex: e.dailyPeriodIndex,
		dailyGrantCount: i
	};
	return {
		accepted: !0,
		state: r,
		offerStates: {
			...e.offerStates,
			[e.definition.id]: a
		},
		events: [{
			id: `rewarded-offer:${e.definition.id}:${a.grantCount}:${e.simTimeSec}`,
			type: "rewardedOfferGranted",
			simTimeSec: e.simTimeSec,
			payload: {
				offerId: e.definition.id,
				placementId: e.definition.placementId,
				grantCount: a.grantCount,
				dailyGrantCount: i
			}
		}]
	};
}
function Lr() {
	return {
		grantCount: 0,
		lastGrantedAtSimTimeSec: null,
		dailyPeriodIndex: null,
		dailyGrantCount: 0
	};
}
function Rr(e, t, n, r) {
	let i = n.dailyPeriodIndex === r.dailyPeriodIndex ? n.dailyGrantCount : 0;
	return {
		available: e,
		reason: t,
		rewards: r.definition.rewards,
		grantCount: n.grantCount,
		cooldownRemainingSec: zr(n, r.definition, r.simTimeSec),
		dailyRemaining: r.definition.dailyCap === void 0 ? null : Math.max(0, r.definition.dailyCap - i)
	};
}
function zr(e, t, n) {
	return t.cooldownSec === void 0 || e.lastGrantedAtSimTimeSec === null ? 0 : Math.max(0, e.lastGrantedAtSimTimeSec + t.cooldownSec - n);
}
function Br(e) {
	if (e.id.length === 0) throw RangeError("Rewarded Offer id must not be empty.");
	if (e.placementId.length === 0) throw RangeError("Rewarded Offer placementId must not be empty.");
	if (e.rewards.length === 0) throw RangeError("Rewarded Offer rewards must not be empty.");
	if (e.cooldownSec !== void 0 && (!Number.isSafeInteger(e.cooldownSec) || e.cooldownSec < 0)) throw RangeError("Rewarded Offer cooldownSec must be a non-negative safe integer.");
	if (e.dailyCap !== void 0 && (!Number.isSafeInteger(e.dailyCap) || e.dailyCap <= 0)) throw RangeError("Rewarded Offer dailyCap must be a positive safe integer.");
}
function Vr(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
//#endregion
//#region src/domain/title/title.ts
function Hr(e, t) {
	let n = e[t.id] === !0;
	return {
		id: t.id,
		displayName: t.displayName,
		description: t.description ?? null,
		acquired: n,
		visible: t.hidden !== !0 || n
	};
}
function Ur(e, t) {
	return t.map((t) => Hr(e, t)).filter((e) => e.visible);
}
//#endregion
//#region src/domain/title/progressive-title.ts
function Wr() {
	return {
		copies: {},
		equipped: []
	};
}
function Q(e, t) {
	$(e, "copies"), $r(t);
	let n = 0;
	for (let r of t) {
		if (e < r) break;
		n += 1;
	}
	return n;
}
function Gr(e, t, n) {
	Qr(n), ti(t, "titleId");
	let r = e.copies[t] ?? 0;
	$(r, `copies[${t}]`);
	let i = n.copyThresholds.at(-1), a = Math.min(i, r + 1);
	return a === r ? {
		collection: e,
		added: !1,
		previousCopies: r,
		copies: a,
		previousLevel: Q(r, n.copyThresholds),
		level: Q(a, n.copyThresholds)
	} : {
		collection: {
			...e,
			copies: {
				...e.copies,
				[t]: a
			}
		},
		added: !0,
		previousCopies: r,
		copies: a,
		previousLevel: Q(r, n.copyThresholds),
		level: Q(a, n.copyThresholds)
	};
}
function Kr(e, t) {
	let n = new Map(t.map((e) => [e.id, e])), r = 0;
	for (let t of e.equipped) {
		let e = n.get(t.titleId);
		e !== void 0 && (r += e.cost);
	}
	return r;
}
function qr(e) {
	let { collection: t, definitions: n, rules: r, titleId: i, level: a, costLimit: o } = e;
	Qr(r), $(o, "costLimit");
	let s = n.find((e) => e.id === i);
	if (s === void 0) return {
		accepted: !1,
		collection: t,
		reason: "unknown-title"
	};
	ei(s);
	let c = Q(t.copies[i] ?? 0, r.copyThresholds);
	return c === 0 ? {
		accepted: !1,
		collection: t,
		reason: "not-owned"
	} : !Number.isSafeInteger(a) || a < 1 || a > c ? {
		accepted: !1,
		collection: t,
		reason: "invalid-level"
	} : t.equipped.some((e) => e.titleId === i) ? {
		accepted: !1,
		collection: t,
		reason: "already-equipped"
	} : t.equipped.length >= r.maxSlots ? {
		accepted: !1,
		collection: t,
		reason: "slot-limit"
	} : Kr(t, n) + s.cost > o ? {
		accepted: !1,
		collection: t,
		reason: "cost-limit"
	} : {
		accepted: !0,
		collection: {
			...t,
			equipped: [...t.equipped, {
				titleId: i,
				level: a
			}]
		}
	};
}
function Jr(e) {
	let { collection: t, rules: n, titleId: r, level: i } = e;
	Qr(n);
	let a = t.equipped.findIndex((e) => e.titleId === r);
	if (a < 0) return {
		accepted: !1,
		collection: t,
		reason: "not-equipped"
	};
	let o = Q(t.copies[r] ?? 0, n.copyThresholds);
	if (!Number.isSafeInteger(i) || i < 1 || i > o) return {
		accepted: !1,
		collection: t,
		reason: "invalid-level"
	};
	let s = t.equipped[a];
	if (s.level === i) return {
		accepted: !0,
		collection: t
	};
	let c = [...t.equipped];
	return c[a] = {
		...s,
		level: i
	}, {
		accepted: !0,
		collection: {
			...t,
			equipped: c
		}
	};
}
function Yr(e, t, n) {
	$(n, "targetIndex");
	let r = e.equipped.findIndex((e) => e.titleId === t);
	if (r < 0 || n >= e.equipped.length || r === n) return e;
	let i = [...e.equipped], [a] = i.splice(r, 1);
	return a === void 0 ? e : (i.splice(n, 0, a), {
		...e,
		equipped: i
	});
}
function Xr(e, t) {
	let n = e.equipped.filter((e) => e.titleId !== t);
	return n.length === e.equipped.length ? e : {
		...e,
		equipped: n
	};
}
function Zr(e) {
	return e.equipped.length === 0 ? e : {
		...e,
		equipped: []
	};
}
function Qr(e) {
	if ($r(e.copyThresholds), !Number.isSafeInteger(e.maxSlots) || e.maxSlots <= 0) throw RangeError("maxSlots must be a positive safe integer.");
}
function $r(e) {
	if (e.length === 0) throw RangeError("copyThresholds must not be empty.");
	let t = 0;
	for (let n of e) {
		if (!Number.isSafeInteger(n) || n <= t) throw RangeError("copyThresholds must contain strictly increasing positive safe integers.");
		t = n;
	}
}
function ei(e) {
	if (ti(e.id, "definition.id"), !Number.isSafeInteger(e.cost) || e.cost <= 0) throw RangeError("title cost must be a positive safe integer.");
}
function $(e, t) {
	if (!Number.isSafeInteger(e) || e < 0) throw RangeError(`${t} must be a non-negative safe integer.`);
}
function ti(e, t) {
	if (e.trim().length === 0) throw RangeError(`${t} must not be empty.`);
}
//#endregion
export { ot as ApplicationStore, oe as CloudSaveCoordinator, y as GameNumber, et as SAVE_FORMAT_ID, Tr as acceptOpportunity, ut as achievementProgressRatio, Yt as activateTemporaryBoost, Xt as activeBoostModifiers, Nt as activityAdvancesOffline, Ft as activityStartCurrencyCost, sn as addCharacter, Gn as addItemInstance, Gr as addProgressiveTitleCopy, Rt as advanceContinuousActivity, He as advanceOfflineInChunks, wr as advanceOpportunity, Ht as advanceTimedActivity, Mt as applyActivityStartCosts, mt as applyCurrencyTransaction, yt as applyModifiers, l as applyNonConsumableEntitlementTransaction, Et as applyRewards, yn as assertValidDefinitionBundle, en as calendarPeriodIndex, Ut as cancelTimedActivity, nn as claimCalendarReward, cr as claimMission, lr as claimMissionPointMilestone, Wt as claimTimedActivity, Ke as classifyRewardSignals, Zr as clearEquippedProgressiveTitles, fn as consumeCooldown, un as createCooldownState, a as createEmptyNonConsumableEntitlementState, qn as createLoadoutState, We as createOfflineReturnSummary, Cr as createOpportunityState, Wr as createProgressiveTitleCollection, In as createRngStreams, Bt as createTimedActivityState, Ot as currencyBalance, x as curveIntervalSum, b as curveValueAt, o as dismissCurrentPresentation, Er as dismissOpportunity, Rn as drawGacha, Lr as emptyRewardedOfferState, c as enqueuePresentationItems, Yn as equipItem, qr as equipProgressiveTitle, dt as evaluateAchievements, w as evaluateCondition, or as evaluateMissions, At as executeActiveGain, Nr as executePrestige, Be as formatGameNumber, ve as gameNumber, Ir as grantRewardedOffer, Ct as grantToken, s as hasNonConsumableEntitlement, ln as incrementCharacterLimitBreak, U as isLoadoutSlotUnlocked, n as isValidIdentityPart, Oe as maxAffordableCurvePurchase, Xe as migrateNormalizeAndValidateState, _t as modifierFromDefinition, Zn as moveEquippedItem, Zt as nextBoostExpiry, Pn as nextRandom, Dr as opportunityRemainingSec, on as ownsCharacterDefinition, e as ownsGameProfile, it as parseMigratedSaveImport, nt as parseSaveEnvelope, rt as parseSaveImport, Bn as pickWeightedEntry, Pt as previewActivityConcurrency, jt as previewActivityStart, tn as previewCalendarReward, dn as previewCooldown, er as previewLevelUp, Mr as previewPrestige, jr as previewPrestigeResetImpact, Fr as previewRewardedOffer, Q as progressiveTitleLevelFromCopies, Kr as progressiveTitleTotalCost, Qt as pruneExpiredBoosts, O as readCurrency, St as readToken, Dt as recordCurrencySpend, sr as recordMissionProgress, pn as reduceCooldown, Kn as removeItemInstance, Yr as reorderProgressiveTitle, rn as resolveAutomaticCalendarRewards, vt as resolveModifierDefinitions, Ve as resolveOfflineElapsed, i as restoreNonConsumablePurchases, r as runNonConsumablePurchaseFlow, Ye as runRewardedAdFlow, lt as selectAchievementStatus, Me as selectAttentionSummary, ar as selectMissionSetStatus, ir as selectMissionStatus, Ne as selectNextMeaningfulTarget, st as selectTimelineSegment, Hr as selectTitleStatus, Ur as selectVisibleTitles, Fn as selectWeightedCandidate, tt as serializeSave, cn as setCharacterLevel, xt as setProducerLevel, bt as setProducerOwnedCount, wt as spendToken, Vt as startTimedActivity, zt as stopContinuousActivity, Xn as unequipItem, Xr as unequipProgressiveTitle, Jn as unlockLoadoutSlot, Jr as updateProgressiveTitleLevel, k as validateCommonActivityDefinition, vn as validateDefinitionBundle, t as validateGameProfileOwnershipInput, q as validateOpportunityDefinition, Je as validateRewardSignal };
