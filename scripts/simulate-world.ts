import {
  runWorldProgressionSimulation,
  summarizeWorldProgressionSimulation,
  validateWorldProgressionSummary,
} from '../src/domain/simulator';

type CliOptions = Readonly<{
  seeds: readonly number[];
  maxSimTimeSec: number;
  json: boolean;
  check: boolean;
}>;

const options = parseArgs(process.argv.slice(2));
const summaries = options.seeds.map((seed) =>
  summarizeWorldProgressionSimulation(seed, runWorldProgressionSimulation(seed, options.maxSimTimeSec)));

const failures = summaries.flatMap((summary) =>
  validateWorldProgressionSummary(summary).map((issue) => `seed ${summary.seed}: ${issue}`));


if (options.json) {
  console.log(JSON.stringify({ ...options, summaries, failures }, null, 2));
} else {
  console.log('Slime Mercenaries full-world same-core simulation');
  console.log(`seeds=${summaries.length} max=${options.maxSimTimeSec}s`);
  console.table(summaries.map((summary) => ({
    seed: summary.seed,
    stop: summary.stopReason,
    time: Math.round(summary.simTimeSec),
    stages: summary.clearedStages,
    areas: summary.areaUnlocks,
    jobs: summary.jobsDiscovered,
    defeats: summary.defeats,
    farmClears: summary.farmClears,
    retries: summary.retries,
    levels: summary.levelUps,
    fusions: summary.fusions,
    tier2: summary.tier2Fusions,
    tier3: summary.tier3Fusions,
    forge: summary.forgeDraws,
    dispatch: `${summary.dispatchCompletions}/${summary.dispatchStarts}`,
    weapons: summary.equippedWeapons,
    mutations: summary.mutations,
    maxWait: Math.round(summary.maxNoActionWindowSec),
    defeatAreas: Object.keys(summary.defeatsByArea).length,
  })));
  for (const summary of summaries.slice(0, 3)) {
    console.log(`\nseed ${summary.seed} defeats by area`, summary.defeatsByArea);
    console.log(`seed ${summary.seed} area clear times`, summary.clearTimeByArea);
    console.table(summary.finalParty);
  }
  if (failures.length === 0) console.log('\nCHECK: PASS');
  else {
    console.error('\nCHECK: FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
  }
}

if (options.check && failures.length > 0) process.exitCode = 1;

function parseArgs(args: readonly string[]): CliOptions {
  let seeds: readonly number[] = [1];
  let maxSimTimeSec = 14_400;
  let json = false;
  let check = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--seed') {
      seeds = [positiveInteger(args[++index], '--seed')];
    } else if (arg === '--seeds') {
      const count = positiveInteger(args[++index], '--seeds');
      seeds = Array.from({ length: count }, (_, seedIndex) => seedIndex + 1);
    } else if (arg === '--max-sec') {
      maxSimTimeSec = positiveInteger(args[++index], '--max-sec');
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--check') {
      check = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm run simulate:world -- [--seed N|--seeds N] [--max-sec N] [--json] [--check]');
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }
  }
  return { seeds, maxSimTimeSec, json, check };
}

function positiveInteger(value: string | undefined, option: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    console.error(`${option} requires a positive integer.`);
    process.exit(2);
  }
  return parsed;
}
