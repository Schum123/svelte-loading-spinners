<script lang="ts">
  import type { SpinnerTypes } from "./types/spinner.type";
  import { range, durationUnitRegex } from "./utils";
  export let color: SpinnerTypes["color"] = "#FF3E00";
  export let unit: SpinnerTypes["unit"] = "px";
  export let duration: SpinnerTypes["duration"] = "1s";
  export let size: SpinnerTypes["size"] = "60";

  let durationUnit = duration.match(durationUnitRegex)[0];
  let durationNum: any = duration.replace(durationUnitRegex, "");
</script>

<style>
  .wrapper {
    width: var(--size);
    height: var(--size);
  }
  .circle {
    border-radius: 100%;
    animation-fill-mode: both;
    position: absolute;
    opacity: 0;
    width: var(--size);
    height: var(--size);
    background-color: var(--color);
    animation: bounce var(--duration) linear infinite;
  }
  @keyframes bounce {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    5% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: scale(1);
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --duration: {duration};">
  {#each range(3, 1) as version}
    <div
      class="circle"
      style="animation-delay: {(durationNum / 3) * (version - 1) + durationUnit};" />
  {/each}
</div>
