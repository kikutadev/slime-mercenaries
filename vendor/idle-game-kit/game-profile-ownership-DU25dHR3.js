//#region src/application/game-profile-ownership.ts
function e(e) {
	return e.length > 0 && e.length <= 128 && !r(e);
}
function t(t) {
	return e(t.accountId) && e(t.gameId) && e(t.playerId) && Number.isSafeInteger(t.createdAtMs) && t.createdAtMs >= 0;
}
async function n(t, n, r, i) {
	return n === null || !e(r) || !e(i) ? !1 : (await t.findOwner(r, i))?.accountId === n.accountId;
}
function r(e) {
	for (let t of e) {
		let e = t.codePointAt(0);
		if (e !== void 0 && (e <= 31 || e === 127)) return !0;
	}
	return !1;
}
//#endregion
export { n, t as r, e as t };
