import { createAuthenticatedPublicPlayerPublishHandler as e, createCloudSaveHandler as t, createGameProfileClaimHandler as n, createOwnedGameProfilesHandler as r, createPublicPlayerDirectoryHandler as i } from "./cloudflare.js";
import { betterAuth as a } from "better-auth";
//#region src/platform/cloudflare/better-auth-provider.ts
function o(e) {
	l(e);
	let t = e.accountIdFactory ?? (() => crypto.randomUUID()), n = a({
		database: e.database,
		secret: e.secret,
		baseURL: e.baseURL,
		trustedOrigins: [...e.trustedOrigins ?? []],
		telemetry: { enabled: !1 },
		user: {
			additionalFields: { accountId: {
				type: "string",
				required: !0,
				input: !1,
				returned: !0,
				defaultValue: t
			} },
			...e.deleteAccountData === void 0 ? {} : { deleteUser: {
				enabled: !0,
				beforeDelete: async (t) => {
					let n = c(t);
					if (n === null) throw Error("Cannot delete account-scoped game data without accountId.");
					await e.deleteAccountData?.(n);
				}
			} }
		},
		account: {
			encryptOAuthTokens: !0,
			accountLinking: {
				enabled: !0,
				trustedProviders: ["google"],
				allowDifferentEmails: !1
			}
		},
		socialProviders: { ...e.google === void 0 ? {} : { google: {
			clientId: s(e.google.clientId),
			clientSecret: e.google.clientSecret,
			...e.google.redirectURI === void 0 ? {} : { redirectURI: e.google.redirectURI }
		} } }
	});
	return {
		handler: (e) => n.handler(e),
		authenticator: { authenticate: async (e) => {
			try {
				let t = await n.api.getSession({ headers: e.headers });
				if (t === null) return null;
				let r = c(t.user);
				return r === null ? null : { accountId: r };
			} catch {
				return null;
			}
		} }
	};
}
function s(e) {
	return typeof e == "string" ? e : [...e];
}
function c(e) {
	if (typeof e != "object" || !e || !("accountId" in e)) return null;
	let t = e.accountId;
	return typeof t == "string" && t.length > 0 ? t : null;
}
function l(e) {
	if (e.database === null || e.database === void 0) throw Error("Better Auth D1 database binding is required.");
	if (e.secret.trim().length < 32) throw Error("Better Auth secret must contain at least 32 characters.");
	let t;
	try {
		t = new URL(e.baseURL);
	} catch {
		throw Error("Better Auth baseURL must be an absolute URL.");
	}
	if (t.protocol !== "https:" && t.hostname !== "localhost" && t.hostname !== "127.0.0.1") throw Error("Better Auth baseURL must use HTTPS outside localhost.");
}
//#endregion
//#region src/platform/cloudflare-auth/account-backend-handler.ts
function u(a) {
	let o = g(a.authBasePath ?? "/api/auth"), s = a.cors === void 0 ? null : d(a.cors), c = n(a.auth.authenticator, a.ownershipRepository), l = r(a.auth.authenticator, a.ownershipRepository), u = a.cloudSaveRepository === void 0 ? null : t(a.auth.authenticator, a.ownershipRepository, a.cloudSaveRepository, a.cloudSave), f = a.publicDirectory === void 0 ? null : i(a.publicDirectory, a.publicRead), m = a.publicPublisher === void 0 || a.validatePublicData === void 0 ? null : e(a.auth.authenticator, a.ownershipRepository, a.publicPublisher, {
		validateData: a.validatePublicData,
		...a.publicWrite
	}), v = async (e) => {
		let t = new URL(e.url).pathname;
		if (_(t, o)) return a.auth.handler(e);
		let n = await c(e);
		if (n !== null) return n;
		let r = await l(e);
		if (r !== null) return r;
		if (u !== null) {
			let t = await u(e);
			if (t !== null) return t;
		}
		if (m !== null) {
			let t = await m(e);
			if (t !== null) return t;
		}
		if (f !== null) {
			let t = await f(e);
			if (t !== null) return t;
		}
		return a.fallback === void 0 ? Response.json({ error: "not-found" }, {
			status: 404,
			headers: {
				"cache-control": "no-store",
				"content-type": "application/json; charset=utf-8"
			}
		}) : a.fallback(e);
	};
	return s === null ? v : async (e) => {
		let t = e.headers.get("origin"), n = t !== null && s.allowedOrigins.has(t);
		if (e.method === "OPTIONS") return n ? p(new Response(null, { status: 204 }), t, s) : new Response(null, {
			status: 403,
			headers: { "cache-control": "no-store" }
		});
		if (t !== null && !n && !h(e.method)) return Response.json({ error: "origin-not-allowed" }, {
			status: 403,
			headers: {
				"cache-control": "no-store",
				"content-type": "application/json; charset=utf-8"
			}
		});
		let r = await v(e);
		return n ? p(r, t, s) : r;
	};
}
function d(e) {
	let t = new Set(e.allowedOrigins.map((e) => f(e)));
	if (t.size === 0) throw Error("At least one CORS origin is required.");
	let n = e.allowedHeaders ?? ["content-type"], r = e.allowedMethods ?? [
		"GET",
		"HEAD",
		"POST",
		"PUT",
		"DELETE",
		"OPTIONS"
	], i = e.maxAgeSec ?? 600;
	if (!Number.isSafeInteger(i) || i < 0) throw Error("CORS maxAgeSec must be a non-negative safe integer.");
	return {
		allowedOrigins: t,
		allowedHeaders: n.join(", "),
		allowedMethods: r.join(", "),
		maxAgeSec: i
	};
}
function f(e) {
	let t = new URL(e);
	if (t.origin !== e.replace(/\/$/u, "")) throw Error(`CORS origin must not contain a path: ${e}`);
	if (t.protocol !== "https:" && t.hostname !== "localhost" && t.hostname !== "127.0.0.1") throw Error(`CORS origin must use HTTPS outside localhost: ${e}`);
	return t.origin;
}
function p(e, t, n) {
	let r = new Headers(e.headers);
	return r.set("access-control-allow-origin", t), r.set("access-control-allow-credentials", "true"), r.set("access-control-allow-methods", n.allowedMethods), r.set("access-control-allow-headers", n.allowedHeaders), r.set("access-control-max-age", String(n.maxAgeSec)), m(r, "Origin"), new Response(e.body, {
		status: e.status,
		statusText: e.statusText,
		headers: r
	});
}
function m(e, t) {
	let n = e.get("vary");
	if (n === null || n.trim() === "") {
		e.set("vary", t);
		return;
	}
	n.split(",").map((e) => e.trim().toLowerCase()).includes(t.toLowerCase()) || e.set("vary", `${n}, ${t}`);
}
function h(e) {
	return e === "GET" || e === "HEAD";
}
function g(e) {
	let t = e.trim();
	if (!t.startsWith("/")) throw Error("Auth base path must start with /.");
	if (t === "/") throw Error("Auth base path must not capture the entire application.");
	return t.replace(/\/+$/u, "");
}
function _(e, t) {
	return e === t || e.startsWith(`${t}/`);
}
//#endregion
export { u as createCloudflareAccountBackendHandler, o as createCloudflareBetterAuth };
