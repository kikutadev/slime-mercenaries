import { GameNumber } from '../domain/number/game-number.js';
/** UI向け表示。DomainのGameNumber表現をReact側で直接解釈させない。 */
export declare function formatGameNumber(value: GameNumber, fractionDigits?: number): string;
