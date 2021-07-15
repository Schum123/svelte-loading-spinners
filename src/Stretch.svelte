<script lang="ts">
  import type { SpinnerTypes } from "./types/spinner.type";
  import { range, durationUnitRegex } from "./utils";
  export let color: SpinnerTypes["color"] = "#FF3E00";
  export let unit: SpinnerTypes["unit"] = "px";
  export let duration: SpinnerTypes["duration"] = "1.2s";
  export let size: SpinnerTypes["size"] = "60";

  let durationUnit = duration.match(durationUnitRegex)[0];
  let durationNum = duration.replace(durationUnitRegex, "");
</script>

<style>
  .wrapper {
    height: var(--size);
    width: var(--size);
    display: inline-block;
    text-align: center;
    font-size: 10px;
  }
  .rect {
    height: 100%;
    width: 10%;
    display: inline-block;
    margin-right: 4px;
    background-color: var(--color);
    animation: stretch var(--duration) ease-in-out infinite;
  }
  @keyframes stretch {
    0%,
    40%,
    100% {
      transform: scaleY(0.4);
    }
    20% {
      transform: scaleY(1);
    }
  }
</style>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --duration: {duration}">
  {#each range(5, 1) as version}
    <div
      class="rect"
      style="animation-delay: {(version - 1) * (+durationNum / 12)}{durationUnit}" />
  {/each}
</div>
