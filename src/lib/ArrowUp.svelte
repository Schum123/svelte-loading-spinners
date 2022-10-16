<script lang="ts">
	import type { SpinnerTypes } from './types/spinner.type';
	export let color: SpinnerTypes['color'] = '#FF3E00';
	export let unit: SpinnerTypes['unit'] = 'px';
	export let duration: SpinnerTypes['duration'] = '0.4s';
	export let size: SpinnerTypes['size'] = '15';
	export let pause: SpinnerTypes['pause'] = false;
</script>

<div
	class="wrapper"
	class:pause-animation={pause}
	style="--size: {size}{unit}; --color: {color}; --duration: {duration};"
/>

<style>
	.wrapper {
		width: var(--size);
		height: calc(var(--size) * 1.5);
		margin-left: var(--size);
		margin-top: var(--size);
		background: var(--color);
		display: inline-block;
		position: relative;
		box-sizing: border-box;
		animation: bump var(--duration) ease-in infinite alternate;
	}
	.wrapper::after {
		content: '';
		box-sizing: border-box;
		left: 50%;
		bottom: 100%;
		transform: translate(-50%, 0);
		position: absolute;
		border: var(--size) solid transparent;
		border-bottom-color: var(--color);
	}

	.pause-animation {
		animation-play-state: paused;
	}
	@keyframes bump {
		0% {
			transform: translate(-50%, 5px);
		}
		100% {
			transform: translate(-50%, -5px);
		}
	}
</style>
