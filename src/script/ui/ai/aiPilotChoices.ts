import { AiPersonality, AI_G_LIMIT_MAX, AI_G_LIMIT_MIN } from '../../ai/tunable/aiPersonality';
import { AiPilotModels } from '../../state/gameDefs';

/** The AI pilot models and the tunable personality's sliders, as Settings and the mission editor offer them. */

export const AI_PILOT_MODEL_OPTIONS: { value: AiPilotModels; label: string }[] = [
    { value: AiPilotModels.CLASSIC, label: 'Classic BFM' },
    { value: AiPilotModels.SHAW, label: 'Shaw (Fighter Combat)' },
    { value: AiPilotModels.AGGRESSIVE, label: 'Aggressive (Berserker)' },
    { value: AiPilotModels.ACE, label: 'Ace (vertical fight + post-stall)' },
    { value: AiPilotModels.TUNABLE, label: 'Tunable (set below)' },
];

/**
 * The TUNABLE model's sliders; 0..1 knobs show as percent. `tooltip` says
 * what the knob does at each end, in the numbers personalityTuning applies.
 */
export interface AiPersonalitySlider { key: keyof AiPersonality; label: string; tooltip: string; min: number; max: number; step: number; scale: number; unit: string }

export const AI_PERSONALITY_SLIDERS: AiPersonalitySlider[] = [
    {
        key: 'aggression', label: 'Aggression', min: 0, max: 100, step: 5, scale: 100, unit: '%',
        tooltip: 'How hard it presses the attack. Low: turns aside at head-on merges instead of shooting, '
            + 'and breaks off to rebuild speed and height as soon as it falls behind. High: takes every '
            + 'head-on gun pass (from 35 %), accepts more overshoot, and from 95 % never breaks off.',
    },
    {
        key: 'defensiveness', label: 'Defensiveness', min: 0, max: 100, step: 5, scale: 100, unit: '%',
        tooltip: 'How early and how hard it defends. Low: reacts only to a bandit close behind it. High: '
            + 'treats anything pointing at it from the beam back, out to 3.5 km, as a threat, breaks harder '
            + 'and keeps defending longer. From 40 % it jinks out of your gun solution.',
    },
    {
        key: 'skill', label: 'Skill', min: 0, max: 100, step: 5, scale: 100, unit: '%',
        tooltip: 'Overall ability, and the main difficulty setting. Raises reaction speed (1.5 s down to '
            + '0.15 s), aim (4° of error down to none), how much of its g limit it uses (65 % to all), '
            + 'fight speed, and head-on firing range (1.5 to 2.4 km). From 40 % it turns back level after '
            + 'a pass and dives for speed before a break; from 50 % it brakes in a fast pass and sees '
            + 'when it has lost a nose-to-nose race.',
    },
    {
        key: 'energyFighting', label: 'Energy fighting', min: 0, max: 100, step: 5, scale: 100, unit: '%',
        tooltip: 'Fighting style. Low: turn-and-burn, stays level and cuts inside your turn. High: climbs for '
            + 'up to 1,200 m of energy advantage before attacking, dives on you at full speed and zooms '
            + 'away rather than turning with you.',
    },
    {
        key: 'gunDiscipline', label: 'Gun discipline', min: 0, max: 100, step: 5, scale: 100, unit: '%',
        tooltip: 'When it pulls the trigger. Low: sprays at anything near the nose, out to 1.3 × gun range: '
            + 'many rounds, few hits. High: fires only when the round is predicted to hit, inside gun '
            + 'range: far fewer rounds, but it waits for shots a dodging target may never give.',
    },
    {
        key: 'gLimit', label: 'G limit', min: AI_G_LIMIT_MIN, max: AI_G_LIMIT_MAX, step: 0.5, scale: 1, unit: ' g',
        tooltip: 'The highest load factor it will pull, 3 to 9 g; at low skill it uses only part of it. '
            + 'The jet gives about 6 g at fight speed, so limits above that matter only when it is faster; '
            + 'below it, it turns wider than you can.',
    },
];
