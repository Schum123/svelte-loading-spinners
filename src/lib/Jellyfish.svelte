<script lang="ts">
	import type { SpinnerTypes } from './types/spinner.type';
	import { range, durationUnitRegex } from './utils';
	export let color: SpinnerTypes['color'] = '#FF3E00';
	export let unit: SpinnerTypes['unit'] = 'px';
	export let duration: SpinnerTypes['duration'] = '2.5s';
	export let size: SpinnerTypes['size'] = '60';
	export let pause: SpinnerTypes['pause'] = false;
	let durationUnit: string = duration.match(durationUnitRegex)?.[0] ?? 's';
	let durationNum: string = duration.replace(durationUnitRegex, '');
</script>

<div
	class="wrapper"
	style="--size: {size}{unit}; --color: {color}; --motionOne: {-size /
		5}{unit}; --motionTwo: {+size / 4}{unit}; --motionThree: {-size /
		5}{unit}; --duration: {duration};"
>
	{#each range(6, 0) as version}
		<div
			class="ring"
			class:pause-animation={pause}
			style="animation-delay: {version * (+durationNum / 25)}{durationUnit}; width: {version *
				(+size / 6) +
				unit}; height: {(version * (+size / 6)) / 2 + unit}; "
		/>
	{/each}
</div>

<style>
	.wrapper {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		width: var(--size);
		height: var(--size);
	}
	.ring {
		position: absolute;
		border: 2px solid var(--color);
		border-radius: 50%;
		background-color: transparent;
		animation: motion var(--duration) ease infinite;
	}
	.pause-animation {
		animation-play-state: paused;
	}
	@keyframes motion {
		0% {
			transform: translateY(var(--motionOne));
		}
		50% {
			transform: translateY(var(--motionTwo));
		}
		100% {
			transform: translateY(var(--motionThree));
		}
	}
</style>
