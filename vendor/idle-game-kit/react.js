import { a as e, i as t, o as n, s as r } from "./purchases-CYzvMLE9.js";
import { useCallback as i, useEffect as a, useRef as o, useState as s, useSyncExternalStore as c } from "react";
import { Fragment as l, jsx as u, jsxs as d } from "react/jsx-runtime";
//#region src/react-bindings/use-application-store.ts
function f(e) {
	return c(e.subscribe, e.getSnapshot, e.getSnapshot);
}
//#endregion
//#region src/react-motion/preferences.ts
function p() {
	return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
//#endregion
//#region src/react-motion/presets.ts
var m = {
	bump: {
		keyframes: [
			{
				transform: "translateY(0)",
				opacity: 1
			},
			{
				transform: "translateY(-2px)",
				opacity: .72,
				offset: .5
			},
			{
				transform: "translateY(0)",
				opacity: 1
			}
		],
		options: {
			duration: 240,
			easing: "ease-out"
		}
	},
	pop: {
		keyframes: [
			{ transform: "scale(1)" },
			{
				transform: "scale(1.05)",
				offset: .55
			},
			{ transform: "scale(1)" }
		],
		options: {
			duration: 360,
			easing: "cubic-bezier(.2,.75,.2,1)"
		}
	},
	pulse: {
		keyframes: [
			{
				transform: "scale(1)",
				opacity: 1
			},
			{
				transform: "scale(1.025)",
				opacity: .86,
				offset: .5
			},
			{
				transform: "scale(1)",
				opacity: 1
			}
		],
		options: {
			duration: 600,
			easing: "ease-in-out"
		}
	},
	reveal: {
		keyframes: [{
			transform: "translateY(4px)",
			opacity: 0
		}, {
			transform: "translateY(0)",
			opacity: 1
		}],
		options: {
			duration: 160,
			easing: "cubic-bezier(.2,.7,.2,1)",
			fill: "both"
		}
	},
	shake: {
		keyframes: [
			{ transform: "translateX(0)" },
			{
				transform: "translateX(-2px)",
				offset: .2
			},
			{
				transform: "translateX(2px)",
				offset: .4
			},
			{
				transform: "translateX(-1px)",
				offset: .6
			},
			{
				transform: "translateX(1px)",
				offset: .8
			},
			{ transform: "translateX(0)" }
		],
		options: {
			duration: 260,
			easing: "ease-out"
		}
	}
};
//#endregion
//#region src/react-motion/Motion.tsx
function h({ as: e = "div", preset: t, children: n, className: r, style: s, delayMs: c = 0, motionKey: l }) {
	let d = o(null), f = i((e) => {
		d.current = e;
	}, []);
	return a(() => {
		let e = d.current;
		if (e === null || typeof e.animate != "function" || p()) return;
		let n = m[t], r = e.animate(n.keyframes.map((e) => ({ ...e })), {
			...n.options,
			delay: Math.max(0, c)
		});
		return () => r.cancel();
	}, [
		c,
		l,
		t
	]), u(e === "span" ? "span" : "div", {
		ref: f,
		className: r,
		style: s,
		children: n
	});
}
//#endregion
//#region src/react-ui/AsyncActionButton.tsx
function g({ pending: e, children: t, pendingChildren: n, disabled: r, ...i }) {
	return /* @__PURE__ */ u("button", {
		...i,
		disabled: r === !0 || e,
		"aria-busy": e || void 0,
		children: e ? n ?? t : t
	});
}
//#endregion
//#region src/react-ui/AttentionBadge.tsx
function _({ label: e, count: t, maxCount: n = 99, className: r }) {
	let i = t === void 0 ? void 0 : Number.isFinite(t) ? Math.max(0, Math.floor(t)) : 0, a = i === void 0 ? "!" : i > n ? `${n}+` : String(i);
	return i === 0 ? null : /* @__PURE__ */ u("span", {
		className: r,
		role: "status",
		"aria-label": e,
		children: a
	});
}
//#endregion
//#region src/react-ui/BottomSheet.tsx
var v = [
	"button:not([disabled])",
	"[href]",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(",");
function y({ title: e, onClose: t, children: n, ariaLabel: r = e, closeLabel: i = "Close", backdropClassName: s, sheetClassName: c, headerClassName: l, closeButtonClassName: f }) {
	let p = o(null), m = o(t);
	return a(() => {
		m.current = t;
	}, [t]), a(() => {
		let e = p.current;
		if (e === null) return;
		let t = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		(e.querySelector(v) ?? e).focus();
		let n = (t) => {
			if (t.defaultPrevented) return;
			if (t.key === "Escape") {
				t.preventDefault(), m.current();
				return;
			}
			if (t.key !== "Tab") return;
			let n = [...e.querySelectorAll(v)].filter((e) => !e.hidden && e.getAttribute("aria-hidden") !== "true");
			if (n.length === 0) {
				t.preventDefault(), e.focus();
				return;
			}
			let r = n[0], i = n[n.length - 1];
			t.shiftKey && document.activeElement === r ? (t.preventDefault(), i.focus()) : !t.shiftKey && document.activeElement === i && (t.preventDefault(), r.focus());
		};
		return document.addEventListener("keydown", n), () => {
			document.removeEventListener("keydown", n), t?.isConnected && t.focus();
		};
	}, []), /* @__PURE__ */ u("div", {
		className: s,
		role: "presentation",
		onMouseDown: (e) => {
			e.target === e.currentTarget && t();
		},
		children: /* @__PURE__ */ d("section", {
			ref: p,
			className: c,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": r,
			tabIndex: -1,
			children: [/* @__PURE__ */ d("header", {
				className: l,
				children: [/* @__PURE__ */ u("h2", { children: e }), /* @__PURE__ */ u("button", {
					className: f,
					type: "button",
					onClick: t,
					"aria-label": i,
					children: "×"
				})]
			}), n]
		})
	});
}
//#endregion
//#region src/react-ui/ProgressBar.tsx
function b({ value: e, label: t, className: n, fillClassName: r, style: i }) {
	let a = (Number.isFinite(e) ? Math.min(1, Math.max(0, e)) : 0) * 100;
	return /* @__PURE__ */ u("div", {
		className: n,
		role: "progressbar",
		"aria-label": t,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": Math.round(a),
		style: i,
		children: /* @__PURE__ */ u("span", {
			className: r,
			style: { width: `${a}%` }
		})
	});
}
//#endregion
//#region src/react-ui/PurchaseProductCard.tsx
function x({ product: e, owned: t, pending: n, onPurchase: r, className: i, titleClassName: a, descriptionClassName: o, priceClassName: s, actionClassName: c, ownedLabel: l = "Owned", unavailableLabel: f = "Unavailable", purchaseLabel: p = "Purchase", pendingLabel: m = "Processing…" }) {
	let h = e === null;
	return /* @__PURE__ */ d("article", {
		className: i,
		"aria-busy": n || void 0,
		children: [
			/* @__PURE__ */ u("strong", {
				className: a,
				children: e?.displayName ?? f
			}),
			e?.description !== void 0 && /* @__PURE__ */ u("span", {
				className: o,
				children: e.description
			}),
			e !== null && /* @__PURE__ */ u("span", {
				className: s,
				children: e.priceText
			}),
			t ? /* @__PURE__ */ u("span", {
				className: c,
				role: "status",
				children: l
			}) : /* @__PURE__ */ u(g, {
				className: c,
				type: "button",
				pending: n,
				pendingChildren: m,
				disabled: h,
				onClick: r,
				children: h ? f : p
			})
		]
	});
}
function S({ owned: e, children: t, fallback: n = null }) {
	return /* @__PURE__ */ u(l, { children: e ? t : n });
}
//#endregion
//#region src/react-ui/useNonConsumablePurchase.ts
function C(t) {
	let [n, r] = s("idle"), c = o(!1), l = o(t);
	a(() => {
		l.current = t;
	}, [t]);
	let u = i(async () => {
		if (c.current) return null;
		c.current = !0, r("requesting");
		try {
			let t = await e(l.current);
			return r(t.status), t;
		} finally {
			c.current = !1;
		}
	}, []), d = i(() => r("idle"), []);
	return {
		status: n,
		pending: n === "requesting",
		run: u,
		reset: d
	};
}
//#endregion
//#region src/react-ui/usePurchaseCatalog.ts
function w(e, t) {
	let n = t.join("\0"), [r, i] = s(null);
	return a(() => {
		let t = !1, r = n === "" ? [] : n.split("\0");
		return e.loadProducts(r).then((e) => {
			t || i({
				key: n,
				status: "ready",
				products: new Map(e.map((e) => [e.productId, e]))
			});
		}).catch(() => {
			t || i({
				key: n,
				status: "error",
				products: /* @__PURE__ */ new Map()
			});
		}), () => {
			t = !0;
		};
	}, [e, n]), r === null || r.key !== n ? {
		status: "loading",
		products: /* @__PURE__ */ new Map()
	} : {
		status: r.status,
		products: r.products
	};
}
//#endregion
//#region src/react-ui/useRewardedAction.ts
function T(e) {
	let t = o(e);
	a(() => {
		t.current = e;
	}, [e]);
	let n = o(!1), [r, c] = s("idle"), l = i(async (...e) => {
		if (n.current) return null;
		n.current = !0, c("requesting");
		try {
			let n = await t.current(...e);
			return c(n), n;
		} catch {
			return c("error"), "error";
		} finally {
			n.current = !1;
		}
	}, []), u = i(() => {
		n.current || c("idle");
	}, []);
	return {
		status: r,
		pending: r === "requesting",
		run: l,
		reset: u
	};
}
//#endregion
//#region src/react-ui/useRestorePurchases.ts
function E(e) {
	let [n, r] = s("idle"), c = o(!1), l = o(e);
	a(() => {
		l.current = e;
	}, [e]);
	let u = i(async () => {
		if (c.current) return null;
		c.current = !0, r("restoring");
		try {
			let e = await t(l.current);
			return r(e.status), e;
		} finally {
			c.current = !1;
		}
	}, []), d = i(() => r("idle"), []);
	return {
		status: n,
		pending: n === "restoring",
		run: u,
		reset: d
	};
}
//#endregion
//#region src/react-ui/usePresentationQueue.ts
function D(e) {
	let t = o(e);
	a(() => {
		t.current = e;
	}, [e]);
	let [c, l] = s([]), u = c[0] ?? null, d = i(() => {
		l((e) => n(e));
	}, []);
	return a(() => {
		if (u === null) return;
		let e = Math.max(0, t.current(u)), n = window.setTimeout(d, e);
		return () => window.clearTimeout(n);
	}, [u, d]), {
		items: c,
		current: u,
		enqueue: i((e) => {
			e.length !== 0 && l((t) => r(t, e));
		}, []),
		dismissCurrent: d,
		clear: i(() => l([]), [])
	};
}
//#endregion
export { g as AsyncActionButton, _ as AttentionBadge, y as BottomSheet, S as EntitlementGate, h as Motion, b as ProgressBar, x as PurchaseProductCard, m as motionPresets, p as prefersReducedMotion, f as useApplicationStore, C as useNonConsumablePurchase, D as usePresentationQueue, w as usePurchaseCatalog, E as useRestorePurchases, T as useRewardedAction };
