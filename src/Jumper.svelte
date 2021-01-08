<script>
  import { range, durationUnitRegex } from "./utils";
  export let size = 60;
  export let color = "#FF3E00";
  export let unit = "px";
  export let duration = "3s";

  let durationUnit = duration.match(durationUnitRegex)[0];
  let durationNum = duration.replace(durationUnitRegex, "");
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

<div class="wrapper" style="--size: {size}{unit}; --color: {color}; --duration: {duration};">
  {#each range(3, 1) as version}
    <div
      class="circle"
      style="animation-delay: {(durationNum/3)*(version-1) + durationUnit};" />
  {/each}
</div>
