// Registry of the app's lifecycles. docs/state-machines.md explains each one; tests/state-machines.test.mjs keeps them honest.
import {defineMachine} from './state-machine.js';
// Local analysis job (scripts/quant-jobs.mjs). New jobs enter as `queued`, or directly as `completed` when served from the immutable cache.
// running -> queued is the restart recovery path: jobs interrupted by a server stop are re-queued.
export const JOB_LIFECYCLE=defineMachine('job',{queued:['running','cancelled'],running:['completed','failed','cancelled','queued'],completed:[],failed:[],cancelled:[]});
// Workspace storage session (secure-workspace.js `mode`). `locked` is re-enterable by unlocking the vault; guest sessions never persist.
export const WORKSPACE_MODE=defineMachine('workspace-mode',{inactive:['guest','vault','locked'],guest:['locked'],vault:['locked'],locked:['vault']});
