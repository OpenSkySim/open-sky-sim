# Retro Flight Simulator

Quick and dirty attempt to replicate the visuals of late 80s / early 90s flight simulators, using as a reference MicroProse's F-117A Nighthawk Stealth Fighter 2.0 (1991).

## Live demo

[https://ruben3d.github.io/retroflightsim/dist](https://ruben3d.github.io/retroflightsim/dist)

## Screenshots

[<img src="doc/cga-day.png" width="320" height="200" />](doc/cga-day.png)
[<img src="doc/cga-night.png" width="320" height="200" />](doc/cga-night.png)

[<img src="doc/ega-day.png" width="320" height="200" />](doc/ega-day.png)
[<img src="doc/ega-night.png" width="320" height="200" />](doc/ega-night.png)

[<img src="doc/vga-day.png" width="320" height="200" />](doc/vga-day.png)
[<img src="doc/vga-night.png" width="320" height="200" />](doc/vga-night.png)

[<img src="doc/svga-day.png" width="320" height="200" />](doc/svga-day.png)
[<img src="doc/svga-night.png" width="320" height="200" />](doc/svga-night.png)

## How to build

You need node.js installed globally (I have been using 14.16.0).

```
$ cd retroflightsim
$ npm i
$ npm run build
```

## How to run

Start the local web server:

```
$ cd retroflightsim
$ npm run serve
```
Then open `localhost:8010` in your web browser (tested on Chrome/Linux).

**Important:** F10 mod import only works when the app is served by the Node dev
server (`npm run serve`). If you use another static file server on the same port
(e.g. `ws -d dist`, Live Server, or opening `dist/index.html` directly), uploads
will fail with HTTP 405. Stop any other server on port 8010 first, then run
`npm run serve`.

`npm run serve` starts a small Node/TypeScript dev server (`tools/modserver.ts`,
run via `tsx`) that serves `dist/` and also exposes the in-app mod import endpoint.

### Importing a mod from the app (F10)

Press `F10` in the app to upload a Unity aircraft mod `.zip`. The dev server runs
the Python import pipeline (`tools/import_mod.py` + `tools/pack_aircraft_mods.py`)
to convert it into a flat-shaded, flyable aircraft, then the app registers the
imported plane(s), shows what was imported, and opens the aircraft selection menu
so you can pick one and fly. This requires a Python environment with the import
tools' dependencies installed (see `tools/README.md`):

```
pip install UnityPy trimesh numpy pillow
```

Generic imports are flyable but have no animated control surfaces and use the
active flight model. Multi-plane mod packs are imported as **one aircraft pack
per livery** (each plane appears separately in the spawn menu). For full
fidelity (control surfaces + custom flight physics), include a
`retroflight.json` import config inside the mod `.zip`.

## Instructions

### Settings

#### Generation

The generation of choice will simulate the experience of a game of that era:
* 286/CGA: mid-80s
* 286/EGA: late 80s
* 386/VGA: early 90s
* 486/SVGA: mid-90s before texture mapping
* HD: full-color rendering at native viewport resolution with smooth shading and fog

#### Flight model

The flight model selects the physics driving the simulation:
* FM2 (Rigid body): The game's own 6-DOF aerodynamic model (lift, drag, and speed-dependent control authority), configured per-aircraft.
* Debug (Free-fly): A no-aerodynamics "free-fly" mode of the same rigid-body model, intended for debugging/inspecting scenery and models — the stick rotates the airframe directly and the plane can be stopped midair.
* JSBSim (WASM, F-16): The official [JSBSim](https://github.com/JSBSim-Team/jsbsim) flight dynamics model, running in a WebAssembly build ([`@0x62/jsbsim-wasm`](https://www.npmjs.com/package/@0x62/jsbsim-wasm)) inside a dedicated Web Worker, flying JSBSim's own stock F-16A Block-32 model (`assets/jsbsim/aircraft/f16/`). Unlike FM2, this option always flies that one bundled F-16 airframe, independent of whichever in-game aircraft/mod is selected — the visible aircraft model and livery still follow your selection, but the underlying aerodynamics, engine, FCS, and ground reactions are always JSBSim's F-16. JSBSim's own aircraft/engine data ships under the JSBSim project's LGPL-2.1 terms (see `assets/jsbsim/`).

#### Keyboard layout

Choose your keyboard layout, for users using QWERTZ, AZERTY, Dvorak, or arrow keys.

### Plane controls

#### Keyboard

Use the OSD settings to select the keyboard layout.

QWERTY (default):
* `W`/`S`: Pitch (`W` is wheel brakes while on the ground)
* `A`/`D`: Roll
* `Q`/`E`: Yaw
* `Z`/`X`: Throttle

QWERTZ:
* `W`/`S`: Pitch (`W` is wheel brakes while on the ground)
* `A`/`D`: Roll
* `Q`/`E`: Yaw
* `Y`/`X`: Throttle

AZERTY:
* `Z`/`S`: Pitch
* `Q`/`D`: Roll
* `A`/`E`: Yaw
* `W`/`X`: Throttle (`W` is wheel brakes while on the ground)

Dvorak:
* `,`/`O`: Pitch
* `A`/`E`: Roll
* `'`/`.`: Yaw
* `Q`/`J`: Throttle

Arrows:
* `↑`/`↓`: Pitch
* `←`/`→`: Roll
* `Y`/`X`: Yaw
* `Num-`/`Num+`: Throttle

#### Joystick

The system supports a single device connected only. If the device has less than four axes the keyboard can be used to complement the missing controls. Joystick information displayed in the OSD help.

* `Axis 1`: Pitch
* `Axis 0`: Roll
* `Axis 3`: Yaw
* `Axis 2`: Throttle

### Systems
* `W`: Wheel brakes (hold, on the ground)
* `G`: Landing gear
* `F`: Flaps
* `T`: Select target
* `I`: Toggle night (386/VGA) or IR (486/SVGA/HD) for the tracking camera
* `H`: Cycle through HUD focus modes (disabled, partial, full)

### Views
* `N`: Toggle day/night
* `1`: Cockpit
* `2`: Toggle exterior back/front
* `3`: Toggle exterior left/right
* `4`: Toggle to/from target

On reaching the limits of the detailed scenario the player position wraps around.
