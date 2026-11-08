<script lang="ts">
	import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, type ChartConfiguration } from 'chart.js';
	import { onMount } from 'svelte';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

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

	onMount(() => {
		const node = canvas;
		if (!node) return;
		const { color, text, grid } = colors();
		const config: ChartConfiguration<'bar'> = {
			type: 'bar',
			data: {
				labels,
				datasets: [{ label: caption, data: values, backgroundColor: color, borderRadius: 2 }]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: {
						ticks: {
							color: text,
							autoSkip: false,
							maxRotation: 45,
							minRotation: 45
						},
						grid: { display: false }
					},
					y: { beginAtZero: true, ticks: { color: text, precision: 0 }, grid: { color: grid } }
				}
			}
		};
		const chart = new Chart(node, config);
		const onTheme = () => {
			const next = colors();
			const dataset = chart.data.datasets[0];
			if (dataset) dataset.backgroundColor = next.color;
			if (chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = next.text;
			if (chart.options.scales?.y?.ticks) chart.options.scales.y.ticks.color = next.text;
			if (chart.options.scales?.y?.grid) chart.options.scales.y.grid.color = next.grid;
			chart.update();
		};
		document.addEventListener('harbour-theme', onTheme);
		return () => {
			document.removeEventListener('harbour-theme', onTheme);
			chart.destroy();
		};
	});
</script>

<figure class="panel p-4">
	<figcaption class="mb-3 text-sm font-medium">{caption}</figcaption>
	<div class="h-72">
		<canvas bind:this={canvas}></canvas>
	</div>
</figure>
