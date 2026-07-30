import { AircraftModelGroup } from '../state/aircraftRegistry';

/** HTML spawn menu with aircraft + livery selectors and spawn actions. */
export class SpawnPanel {
    private readonly panel: HTMLElement;
    private readonly title: HTMLElement;
    private readonly aircraftSelect: HTMLSelectElement;
    private readonly liveryLabel: HTMLLabelElement;
    private readonly liverySelect: HTMLSelectElement;

    constructor(
        onModelSelect: (modelIndex: number) => void,
        onLiverySelect: (liveryIndex: number) => void,
        onApproach: () => void,
        onRunway: () => void,
        onHeadOn: () => void,
    ) {
        this.panel = document.getElementById('spawn-panel')!;
        this.title = document.getElementById('spawn-title')!;
        this.aircraftSelect = document.getElementById('aircraft-select') as HTMLSelectElement;
        this.liveryLabel = document.getElementById('livery-label') as HTMLLabelElement;
        this.liverySelect = document.getElementById('livery-select') as HTMLSelectElement;

        this.aircraftSelect.addEventListener('change', () => {
            onModelSelect(this.aircraftSelect.selectedIndex);
        });
        this.liverySelect.addEventListener('change', () => {
            onLiverySelect(this.liverySelect.selectedIndex);
        });

        document.getElementById('spawn-approach')!.addEventListener('click', onApproach);
        document.getElementById('spawn-runway')!.addEventListener('click', onRunway);
        document.getElementById('spawn-headon')!.addEventListener('click', onHeadOn);
    }

    setTitle(text: string): void {
        this.title.textContent = text;
    }

    setSelection(groups: AircraftModelGroup[], modelIndex: number, liveryIndex: number): void {
        this.aircraftSelect.replaceChildren();
        for (const group of groups) {
            const option = document.createElement('option');
            option.textContent = group.label;
            this.aircraftSelect.appendChild(option);
        }
        const modelRows = Math.min(Math.max(groups.length, 1), 12);
        this.aircraftSelect.size = modelRows;
        this.aircraftSelect.selectedIndex = Math.min(
            modelIndex,
            Math.max(0, groups.length - 1),
        );

        const group = groups[this.aircraftSelect.selectedIndex];
        const liveries = group?.variants ?? [];
        this.liverySelect.replaceChildren();
        for (const variant of liveries) {
            const option = document.createElement('option');
            option.textContent = variant.liveryName ?? variant.name;
            this.liverySelect.appendChild(option);
        }
        const liveryRows = Math.min(Math.max(liveries.length, 1), 12);
        this.liverySelect.size = liveryRows;
        this.liverySelect.selectedIndex = Math.min(
            liveryIndex,
            Math.max(0, liveries.length - 1),
        );

        const showLivery = liveries.length > 1;
        this.liveryLabel.classList.toggle('hidden', !showLivery);
        this.liverySelect.classList.toggle('hidden', !showLivery);
    }

    show(): void {
        this.panel.classList.remove('hidden');
    }

    hide(): void {
        this.panel.classList.add('hidden');
    }
}
