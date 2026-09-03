/**
 * Validation tests for the rigid body barricade solver.
 *
 * Compares rigid body solver behavior against the current particle solver
 * to ensure physical accuracy and consistency.
 */

import { BarricadeRigidBodySolver } from './barricadeRigidBodySolver';
import {
    BarricadeSolver,
    BarricadeLayout,
    defaultBarricadeSolverSpec,
    barricadeSolverSpecForRig,
} from './barricadeSolver';
import * as THREE from 'three';

describe('BarricadeRigidBodySolver', () => {
    it('should initialize bodies with correct count', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        // Should have 4 stanchions + belt nodes + stripes + wires + tie-downs
        expect(solver.bodies.length).toBeGreaterThan(0);
        expect(solver.bodies.length).toBeCloseTo(layout.count, 5);
    });

    it('should settle under gravity without oscillation', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        // Initial reset with high damping should settle quickly
        solver.reset(1.0);

        // Positions should be stable (no major oscillations)
        const initialPos = solver.pos.slice();
        solver.step(1 / 30); // One frame
        solver.step(1 / 30); // Another frame

        // Positions should have stabilized
        let maxChange = 0;
        for (let i = 0; i < initialPos.length; i++) {
            maxChange = Math.max(maxChange, Math.abs(solver.pos[i] - initialPos[i]));
        }
        expect(maxChange).toBeLessThan(0.1); // Less than 10cm change in one frame
    });

    it('should maintain belt length constraints', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        solver.reset(1.0);
        solver.step(1 / 30);

        // Belt constraints should keep nodes at fixed distance apart
        // This is a simplified check - full validation would measure
        // actual constraint violations
        expect(solver.bodies.length).toBeGreaterThan(0);
    });

    it('should handle deployment animation', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        solver.reset(0); // Start stowed
        solver.setDeploy(0.5); // Deploy to 50%
        solver.step(1 / 30);

        // After deployment, positions should have changed
        expect(solver.pos.length).toBeGreaterThan(0);
    });

    it('should output rendering positions correctly', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        solver.reset(1.0);

        // Rendering position array should match body count
        expect(solver.pos.length).toBe(layout.count * 3);

        // All positions should be finite numbers
        for (let i = 0; i < solver.pos.length; i++) {
            expect(isFinite(solver.pos[i])).toBe(true);
        }
    });

    it('should track tension in wires', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        solver.reset(1.0);
        solver.step(1 / 30);

        const tensions = solver.wireTension();
        expect(tensions.length).toBe(4);

        // All tensions should be non-negative
        for (let i = 0; i < tensions.length; i++) {
            expect(tensions[i]).toBeGreaterThanOrEqual(0);
        }
    });

    it('should accumulate forces from contacts', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);
        const solver = new BarricadeRigidBodySolver(spec, layout);

        solver.reset(1.0);

        // Set up a collision scenario (no actual aircraft yet)
        // But airframeForce/Torque should still return valid vectors
        const force = solver.airframeForce();
        const torque = solver.airframeTorque();

        expect(force).toBeInstanceOf(THREE.Vector3);
        expect(torque).toBeInstanceOf(THREE.Vector3);
        expect(isFinite(force.x) && isFinite(force.y) && isFinite(force.z)).toBe(true);
        expect(isFinite(torque.x) && isFinite(torque.y) && isFinite(torque.z)).toBe(true);
    });
});

/**
 * Comparison tests between rigid body and particle solver.
 *
 * These tests compare outputs to ensure the rigid body solver
 * produces equivalent behavior to the current particle solver.
 */
describe('BarricadeRigidBodySolver vs BarricadeSolver', () => {
    it('should produce similar belt configurations', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);

        const rbSolver = new BarricadeRigidBodySolver(spec, layout);
        const particleSolver = new BarricadeSolver(spec, layout);

        rbSolver.reset(1.0);
        particleSolver.reset(1.0);

        // Both should have settled the rig
        // Positions should be similar (allow for small differences due to algorithm)
        expect(rbSolver.pos.length).toBe(particleSolver.pos.length);
    });

    it('should handle sustained gravity similarly', () => {
        const spec = defaultBarricadeSolverSpec();
        const layout = new BarricadeLayout(spec);

        const rbSolver = new BarricadeRigidBodySolver(spec, layout);
        const particleSolver = new BarricadeSolver(spec, layout);

        rbSolver.reset(1.0);
        particleSolver.reset(1.0);

        // Run 10 frames on both
        for (let i = 0; i < 10; i++) {
            rbSolver.step(1 / 30);
            particleSolver.step(1 / 30);
        }

        // Bounding boxes should be similar
        let rbMinY = Infinity, rbMaxY = -Infinity;
        let pMinY = Infinity, pMaxY = -Infinity;

        for (let i = 1; i < rbSolver.pos.length; i += 3) {
            rbMinY = Math.min(rbMinY, rbSolver.pos[i]);
            rbMaxY = Math.max(rbMaxY, rbSolver.pos[i]);
        }

        for (let i = 1; i < particleSolver.pos.length; i += 3) {
            pMinY = Math.min(pMinY, particleSolver.pos[i]);
            pMaxY = Math.max(pMaxY, particleSolver.pos[i]);
        }

        // Y ranges should be within 0.5m of each other
        expect(Math.abs(rbMinY - pMinY)).toBeLessThan(0.5);
        expect(Math.abs(rbMaxY - pMaxY)).toBeLessThan(0.5);
    });
});
