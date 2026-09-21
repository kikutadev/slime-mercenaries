import {
  evaluateDefeatLoopBalance,
  evaluateFirstLoopBalance,
  evaluatePacedDefeatBalance,
  runFirstLoopSimulation,
  summarizeFirstLoopSimulation,
  type FirstLoopPolicyProfileId,
} from '../src/domain/simulator';

type CliOptions = Readonly<{
  profileId: FirstLoopPolicyProfileId;
  seeds: readonly number[];
  maxSimTimeSec: number;
  json: boolean;
  check: boolean;
}>;

const options = parseArgs(process.argv.slice(2));
const summaries = options.seeds.map((seed) => {
  const run = runFirstLoopSimulation(seed, options.maxSimTimeSec, options.profileId);
  return summarizeFirstLoopSimulation(seed, options.profileId, run);
});
const targetEvaluations = options.profileId === 'efficient'
  ? evaluateFirstLoopBalance(options.seeds)
  : options.profileId === 'defeat-loop'
    ? evaluateDefeatLoopBalance(options.seeds)
    : evaluatePacedDefeatBalance(options.seeds);
const failures = validateSummaries(options.profileId, summaries, targetEvaluations);

if (options.json) {
  console.log(JSON.stringify({
    profileId: options.profileId,
    maxSimTimeSec: options.maxSimTimeSec,
    summaries,
    targetEvaluations,
    failures,
  }, null, 2));
} else {
  printHumanReport(options, summaries, targetEvaluations, failures);
}

if (options.check && failures.length > 0) process.exitCode = 1;

function parseArgs(args: readonly string[]): CliOptions {
  let profileId: FirstLoopPolicyProfileId = 'defeat-loop';
  let seeds: readonly number[] = [1];
  let maxSimTimeSec = 900;
  let json = false;
  let check = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--profile') {
      const value = args[++index];
      if (value !== 'efficient' && value !== 'defeat-loop' && value !== 'paced-defeat') fail(`Unknown profile: ${value ?? ''}`);
      profileId = value;
    } else if (arg === '--seed') {
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
      printHelp();
      process.exit(0);
    } else {
      fail(`Unknown option: ${arg}`);
    }
  }

  return { profileId, seeds, maxSimTimeSec, json, check };
}

function positiveInteger(value: string | undefined, option: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) fail(`${option} requires a positive integer.`);
  return parsed;
}

function validateSummaries(
  profileId: FirstLoopPolicyProfileId,
  summaries: readonly ReturnType<typeof summarizeFirstLoopSimulation>[],
  targetEvaluations: readonly ReturnType<typeof evaluateFirstLoopBalance>[number][],
): readonly string[] {
  const failures: string[] = [];
  for (const summary of summaries) {
    if (summary.stopReason !== 'clover-road-clear' || summary.highestStageCleared < 5) {
      failures.push(`seed ${summary.seed}: did not clear Clover Road (stop=${summary.stopReason}, highest=${summary.highestStageCleared})`);
    }
    if (profileId === 'defeat-loop') {
      if (summary.retreats !== summary.defeats) failures.push(`seed ${summary.seed}: defeats/retreats diverged (${summary.defeats}/${summary.retreats})`);
      if (summary.firstDefeatSec !== null && summary.cloverRoadClearSec !== null && summary.firstDefeatSec >= summary.cloverRoadClearSec) {
        failures.push(`seed ${summary.seed}: defeat did not precede final breakthrough`);
      }
    }
  }
  for (const evaluation of targetEvaluations) {
    if (evaluation.status !== 'pass') failures.push(`${evaluation.target.id}: ${evaluation.status} (${evaluation.observed ?? 'missing'})`);
  }
  return failures;
}

function printHumanReport(
  options: CliOptions,
  summaries: readonly ReturnType<typeof summarizeFirstLoopSimulation>[],
  targetEvaluations: readonly ReturnType<typeof evaluateFirstLoopBalance>[number][],
  failures: readonly string[],
): void {
  console.log('Slime Mercenaries same-core simulation');
  console.log(`profile=${options.profileId} seeds=${summaries.length} max=${options.maxSimTimeSec}s`);
  console.table(summaries.map((summary) => ({
    seed: summary.seed,
    stop: summary.stopReason,
    time: summary.simTimeSec,
    clear: summary.cloverRoadClearSec ?? '-',
    firstDefeat: summary.firstDefeatSec ?? '-',
    firstFarm: summary.firstFarmClearSec ?? '-',
    firstRetry: summary.firstRetrySec ?? '-',
    preFarmLv: summary.levelUpsBeforeFirstFarmClear,
    retreatLv: summary.levelUpsDuringFirstRetreat,
    defeats: summary.defeats,
    farmClears: summary.farmClears,
    retries: summary.retries,
    levels: summary.levelUps,
    fusion: summary.firstFusionSec ?? '-',
    maxWait: summary.maxNoActionWindowSec,
    defeatsByStage: JSON.stringify(summary.defeatsByStage),
  })));

  if (targetEvaluations.length > 0) {
    console.log('\nAuthored balance targets');
    console.table(targetEvaluations.map((evaluation) => ({
      id: evaluation.target.id,
      status: evaluation.status,
      observed: evaluation.observed ?? '-',
      min: evaluation.expectedMin ?? '-',
      max: evaluation.expectedMax ?? '-',
    })));
  }

  if (failures.length === 0) {
    console.log('\nCHECK: PASS');
  } else {
    console.error('\nCHECK: FAIL');
    failures.forEach((failure) => console.error(`- ${failure}`));
  }
}

function printHelp(): void {
  console.log(`Usage: pnpm run simulate -- [options]\n\nOptions:\n  --profile efficient|defeat-loop|paced-defeat  Simulation policy (default: defeat-loop)\n  --seed N                         Run one deterministic seed\n  --seeds N                        Run seeds 1..N\n  --max-sec N                      Simulation horizon (default: 900)\n  --json                           Emit machine-readable JSON\n  --check                          Exit non-zero when acceptance checks fail\n`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}
