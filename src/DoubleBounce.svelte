<script lang="ts">
  import type { SpinnerTypes } from "./types/spinner.type";
  import { range, durationUnitRegex } from "./utils";
  export let color: SpinnerTypes["color"] = "#FF3E00";
  export let unit: SpinnerTypes["unit"] = "px";
  export let duration: SpinnerTypes["duration"] = "2.1s";
  export let size: SpinnerTypes["size"] = "60";

  let durationUnit = duration.match(durationUnitRegex)[0];
  let durationNum: any = duration.replace(durationUnitRegex, "");
</script>

<style>
  .wrapper {
    position: relative;
    width: var(--size);
    height: var(--size);
  }
  .circle {
    position: absolute;
    width: var(--size);
    height: var(--size);
    background-color: var(--color);
    border-radius: 100%;
    opacity: 0.6;
    top: 0;
    left: 0;
    animation-fill-mode: both;
    animation-name: bounce !important;
  }
  @keyframes bounce {
    0%,
    100% {
      transform: scale(0);
    }
    50% {
      transform: scale(1);
    }
  }
</style>

<div class="wrapper" style="--size: {size}{unit}; --color: {color}">
  {#each range(2, 1) as version}
    <div
      class="circle"
      style="animation: {duration} {version === 1 ? `${(durationNum - 0.1) / 2}${durationUnit}` : `0s`} infinite ease-in-out" />
  {/each}
</div>
