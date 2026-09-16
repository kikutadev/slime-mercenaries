/**
 * public/ 配下の論理asset pathを、Viteのdeployment baseへ解決する。
 * Game Definitionはplatform-neutralな `/assets/...` を保持し、Web配信pathの知識を持たない。
 */
export declare function resolvePublicAssetUrl(assetPath: string, baseUrl?: string): string;
