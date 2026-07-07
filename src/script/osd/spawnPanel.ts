/** HTML spawn menu with an aircraft listbox and spawn actions. */
export class SpawnPanel {
    private readonly panel: HTMLElement;
    private readonly title: HTMLElement;
    private readonly select: HTMLSelectElement;

    constructor(
        onSelect: (index: number) => void,
        onApproach: () => void,
        onRunway: () => void,
    ) {
        this.panel = document.getElementById('spawn-panel')!;
        this.title = document.getElementById('spawn-title')!;
        this.select = document.getElementById('aircraft-select') as HTMLSelectElement;

        this.select.addEventListener('change', () => {
            onSelect(this.select.selectedIndex);
        });

        document.getElementById('spawn-approach')!.addEventListener('click', onApproach);
        document.getElementById('spawn-runway')!.addEventListener('click', onRunway);
    }

    setTitle(text: string): void {
        this.title.textContent = text;
    }

    setAircraft(names: string[], selectedIndex: number): void {
        this.select.replaceChildren();
        for (const name of names) {
            const option = document.createElement('option');
            option.textContent = name;
            this.select.appendChild(option);
        }
        const visibleRows = Math.min(Math.max(names.length, 1), 12);
        this.select.size = visibleRows;
        this.select.selectedIndex = Math.min(selectedIndex, Math.max(0, names.length - 1));
    }

    setSelectedIndex(index: number): void {
        if (index >= 0 && index < this.select.options.length) {
            this.select.selectedIndex = index;
        }
    }

    show(): void {
        this.panel.classList.remove('hidden');
    }

    hide(): void {
        this.panel.classList.add('hidden');
    }
}
