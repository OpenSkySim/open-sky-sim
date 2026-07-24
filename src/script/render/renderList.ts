import * as THREE from 'three';

const RENDER_GEN_KEY = 'renderGen';

/**
 * Attach `obj` to a layer list for the current build pass without reparenting
 * when it is already there. Marks the object so {@link pruneRenderList} keeps it.
 */
export function attachToRenderList(list: THREE.Object3D, obj: THREE.Object3D): void {
    const gen = list.userData[RENDER_GEN_KEY] as number | undefined;
    if (gen !== undefined) {
        obj.userData[RENDER_GEN_KEY] = gen;
    }
    if (obj.parent !== list) {
        list.add(obj);
    }
}

/** Drop children not attached during the current build generation. */
export function pruneRenderList(list: THREE.Object3D): void {
    const gen = list.userData[RENDER_GEN_KEY] as number | undefined;
    if (gen === undefined) {
        return;
    }
    const children = list.children;
    for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child.userData[RENDER_GEN_KEY] !== gen) {
            list.remove(child);
        }
    }
}

/** Bump the generation stamped onto objects by {@link attachToRenderList}. */
export function beginRenderListPass(list: THREE.Object3D, generation: number): void {
    list.userData[RENDER_GEN_KEY] = generation;
}
