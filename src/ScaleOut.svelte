<script lang="ts">
  import type { SpinnerTypes } from "./types/spinner.type";
  export let color: SpinnerTypes["color"] = "#FF3E00";
  export let unit: SpinnerTypes["unit"] = "px";
  export let duration: SpinnerTypes["duration"] = "1s";
  export let size: SpinnerTypes["size"] = "60";
</script>

<style>
  .wrapper {
    width: var(--size);
    height: var(--size);
  }
  .circle {
    width: var(--size);
    height: var(--size);
    background-color: var(--color);
    animation-duration: var(--duration);
    border-radius: 100%;
    display: inline-block;
    animation: scaleOut var(--duration) ease-in-out infinite;
  }
  @keyframes scaleOut {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --duration: {duration}; --duration: {duration};">
  <div class="circle" />
</div>
