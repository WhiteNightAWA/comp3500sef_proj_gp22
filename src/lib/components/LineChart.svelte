<script lang="ts">
	import {
		Chart,
		CategoryScale,
		LinearScale,
		LineController,
		LineElement,
		PointElement,
		Tooltip,
		type ChartConfiguration
	} from 'chart.js';
	import { onMount } from 'svelte';

	Chart.register(LineController, CategoryScale, LinearScale, LineElement, PointElement, Tooltip);

	let { labels, values, caption }: { labels: string[]; values: number[]; caption: string } = $props();
	let canvas = $state<HTMLCanvasElement>();

	function colors() {
		const style = getComputedStyle(document.documentElement);
		return {
			color: style.getPropertyValue('--color-primary').trim(),
			text: style.getPropertyValue('--color-base-content').trim(),
			grid: style.getPropertyValue('--color-base-300').trim()
		};
	}

	function paint(chart: Chart<'line'>) {
		const { color, text, grid } = colors();
		const dataset = chart.data.datasets[0];
		if (!dataset) return;
		dataset.borderColor = color;
		dataset.backgroundColor = color;
		dataset.pointBackgroundColor = color;
		const scales = chart.options.scales;
		if (scales?.x?.ticks) scales.x.ticks.color = text;
		if (scales?.x?.grid) scales.x.grid.color = grid;
		if (scales?.y?.ticks) scales.y.ticks.color = text;
		if (scales?.y?.grid) scales.y.grid.color = grid;
		chart.update();
	}

	onMount(() => {
		const node = canvas;
		if (!node) return;
		const { color, text, grid } = colors();
		const config: ChartConfiguration<'line'> = {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: caption,
						data: values,
						borderColor: color,
						backgroundColor: color,
						pointBackgroundColor: color,
						tension: 0.25,
						fill: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: { ticks: { color: text, maxRotation: 0 }, grid: { color: grid } },
					y: { beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: grid } }
				}
			}
		};
		const chart = new Chart(node, config);
		const onTheme = () => paint(chart);
		document.addEventListener('harbour-theme', onTheme);
		return () => {
			document.removeEventListener('harbour-theme', onTheme);
			chart.destroy();
		};
	});
</script>

<figure class="panel p-4">
	<figcaption class="mb-3 text-sm font-medium">{caption}</figcaption>
	<div class="h-56">
		<canvas bind:this={canvas}></canvas>
	</div>
</figure>
